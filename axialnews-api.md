# JIRA Task: Implement Axial.news Backend (MVP)

**Status:** Open
**Priority:** High
**Assignee:** Backend Engineer
**Due Date:** TBD

---

## 1. Overview
Build the core backend for **Axial.news**, a news aggregation platform that uses vector clustering to group stories rather than just listing articles. The system must ingest RSS feeds, store operational data in Cloudflare D1, persist larger artifacts/snapshots in Cloudflare R1, cluster stories with Workers AI, and expose APIs through a Cloudflare Worker.

**Guiding Principle**: "Pick the demo. Cut the rest. Ship the knife."
**Core Value**: Compressing the world into distinct stories with a daily moment of clarity.

---

## 2. Requirements & Stack

- **Runtime**: Cloudflare Workers (TypeScript)
- **API Framework**: Worker-native routing (Hono or lightweight fetch router)
- **Database**: Cloudflare D1 (relational operational data)
- **Blob/Artifact Storage**: Cloudflare R1 (feed snapshots, digest audio, exports)
- **AI/ML**: Cloudflare Workers AI for Embeddings + Summarization
- **Deployment**: Cloudflare Workers (API) with Pages-compatible edge routing

---

## 3. Implementation Plan (Chronological)

Follow these steps in exact order to avoid dependency hell.

### Phase 1: The Foundation (Worker + D1 + R1)

**Goal**: Get a running Worker with D1/R1 bindings and local dev parity.

#### Step 1.1: Project Initialization
1.  Initialize project: `npm init -y`
2.  Install TypeScript & tooling:
    ```bash
    npm install -D typescript wrangler @cloudflare/workers-types
    npm install hono zod
    npx tsc --init
    ```
3.  Configure `tsconfig.json`:
    - `outDir`: `./dist`
    - `strict`: `true`

#### Step 1.2: Cloudflare Environment
Create `wrangler.toml` bindings:
```toml
name = "axialnews-api"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DB"
database_name = "axialnews-d1"
database_id = "<d1-id>"

[[r2_buckets]]
binding = "R1"
bucket_name = "axialnews-r1"
```

#### Step 1.3: Cloudflare API Token (Required)
Create a scoped API token in Cloudflare Dashboard:
1. Go to **My Profile → API Tokens → Create Token → Create Custom Token**.
2. Suggested token name: `axialnews-worker-deploy`.
3. Add permissions:
   - `Account - Workers Scripts:Edit`
   - `Account - D1:Edit`
   - `Account - Workers AI:Read`
   - `Account - Queues:Edit` (if using queues)
   - `Account - Workers KV Storage:Edit` (optional, only if used)
   - `Zone - Workers Routes:Edit` (if binding Worker to a zone route)
   - `Zone - Page Rules:Read` (optional)
4. Account resources: include your Axial account.
5. Zone resources: include `axial.news` if routes are zone-scoped.
6. Export to shell for CI/local deploys:
   ```bash
   export CLOUDFLARE_API_TOKEN="<token>"
   export CLOUDFLARE_ACCOUNT_ID="<account-id>"
   ```

#### Step 1.4: Database Schema (D1 SQL)
Create `migrations/0001_init.sql`. **CRITICAL**: Mirror the MVP schema exactly using SQLite-compatible D1 SQL.

**Core Tables:**
1.  `Source`: RSS feed metadata & bias labels.
2.  `Article`: Raw items + vector embeddings.
3.  `Cluster`: The product primitive (centroid, summaries, bias analysis).
4.  `DailyDigest`: Generated summaries.
5.  `User`, `Collection`, `Bookmark`: Research/Engagement loops.

Key implementation note:
- D1 stores relational entities (`Source`, `Article`, `Cluster`, `DailyDigest`, `User`, `Collection`, `Bookmark`).
- Store embeddings outside D1 in Workers AI Vectorize or in R1 JSON blobs keyed by `articleId`/`clusterId`.

#### Step 1.5: Migration
1.  Create D1 DB: `wrangler d1 create axialnews-d1`
2.  Apply migration: `wrangler d1 migrations apply axialnews-d1 --local`
3.  For remote: `wrangler d1 migrations apply axialnews-d1 --remote`

#### Step 1.6: PostgreSQL → D1 Migration Plan (Table-by-table)
If you have legacy Postgres data, migrate with a one-time export/import workflow:

1. **Freeze writes** in old environment.
2. **Export table data** from Postgres as CSV/JSON (`Source`, `Article`, `Cluster`, `DailyDigest`, `User`, `Collection`, `Bookmark`).
3. **Transform types** for D1 compatibility:
   - `uuid` → `TEXT`
   - `jsonb` → `TEXT` (JSON string)
   - `timestamp with time zone` → ISO8601 `TEXT`
   - arrays (`text[]`) → JSON `TEXT`
4. **Create D1 schema** with foreign keys and indexes in `migrations/*.sql`.
5. **Import in dependency order**:
   - `Source` → `Cluster` → `Article` → `DailyDigest` → `User` → `Collection` → `Bookmark`
6. **Embedding strategy**:
   - Recompute embeddings with Workers AI and upsert into your vector index, or
   - export existing vectors to JSON and reindex into Vectorize/object storage keyed by entity ID.
7. **Validation checks**:
   - row counts match per table
   - sample referential integrity checks pass
   - cluster/article relationships match expected IDs
8. **Cutover**:
   - switch Worker bindings to production D1
   - run smoke endpoints (`/api/v1/clusters`, `/api/v1/digest`)

**Minimal mapping reference**
- `Source` (same logical columns, IDs as TEXT)
- `Article` (keep `link` unique; embedding moved out of D1)
- `Cluster` (keep aggregate counters and bias-analysis JSON)
- `DailyDigest`, `User`, `Collection`, `Bookmark` (straight relational migration)

---

### Phase 2: Core Services (The Primitives)

**Goal**: Build the independent services that handle data logic.

#### Step 2.1: Cloudflare AI Wrapper
Create `src/services/cloudflare-ai.service.ts`:
- **Input**: Access Token, Account ID from env.
- **Methods**:
    - `run(model: string, input: any)`: Generic wrapper.
    - `embed(text: string)`: Uses `@cf/baai/bge-base-en-v1.5`. Returns `number[]`.
    - `chat(prompt: string)`: Uses `@cf/meta/llama-2-7b-chat-int8`. Returns string.

#### Step 2.2: RSS Fetcher
Create `src/services/rss-fetcher.service.ts`:
- **Deps**: `rss-parser`
- **Logic**:
    - `fetchFeed(url)`: Returns array of `{ title, description, link, pubDate }`.
    - **Cleaning**: Strip HTML from description using regex or `cheerio` (keep it lightweight).

#### Step 2.3: Heat vs Substance Scorer
Create `src/services/heat-substance.service.ts`:
- **Logic**: Regex-based analysis (no AI required for speed).
- **Heat Signals**: `/unprecedented/`, `/shocking/`, `ALL CAPS`.
- **Substance Signals**: Numbers, percentages, quotes, citations.
- **Output**: `{ heat: 0-1, substance: 0-1, label: string }`.

---

### Phase 3: The Clustering Engine (The Knife)

**Goal**: Implement the logic that converts raw articles into Stories (Clusters).

#### Step 3.1: Clustering Service
Create `src/services/clustering.service.ts`.

**Method**: `processArticle(articleData: ArticleInput): Promise<string>`
1.  **Dedupe**: Check if `link` exists. Abort if true.
2.  **Embed**: text = `title + " " + description`.
3.  **Search**: Query Workers AI Vectorize (or embedding index in R1) for nearest neighbors within 48h window.
4.  **Decision**:
    - IF `similarity > 0.85` AND match has `clusterId` -> **JOIN**.
    - ELSE -> **CREATE NEW CLUSTER**.
5.  **On Join**:
    - Add to cluster.
    - Re-calculate Cluster Centroid (Running Average) and write to vector store.
    - Increment logic (articleCount++).
6.  **On Create**:
    - Create Cluster record.
    - Set Centroid = Article Embedding in vector index.

---

### Phase 4: API Internals (Controllers & Routes)

**Goal**: Expose the data to the frontend.

#### Step 4.1: Cluster Controller
`src/controllers/cluster.controller.ts`

-   `getFeed`: Infinite scroll.
    -   Params: `cursor` (last cluster ID), `limit`.
    -   Logic: Fetch `Cluster` where (optional: `isActive=true`), Order by `articleCount` DESC + `lastArticleAt` DESC.
-   `getDetail`:
    -   Params: `id`.
    -   Logic: Fetch Cluster + `include: { articles: true }`.

#### Step 4.2: Research Controller
`src/controllers/research.controller.ts`

-   `saveToCollection(userId, clusterId)`
-   `getCollections(userId)`

#### Step 4.3: Worker Entrypoint
`src/index.ts`
-   Setup middleware (CORS, JSON).
-   Mount routes:
    -   `/api/v1/clusters`
    -   `/api/v1/digest`
    -   `/api/v1/research`

---

### Phase 5: The Loop (Background Jobs)

**Goal**: Keep the system alive without user interaction.

#### Step 5.1: Scheduler
Use Cloudflare Cron Triggers + Queues.

1.  **Feed Sync (Every 30m)**:
    -   Iterate all active `Sources`.
    -   Fetch RSS.
    -   For each item -> `ClusteringService.processArticle()`.
2.  **Digest Gen (Daily @ 00:00)**:
    -   Query top 10 clusters (by articleCount).
    -   Summarize with AI.
    -   Create `DailyDigest` record.

---

## 4. Definition of Done
1.  `wrangler dev` starts the API worker without error.
2.  D1/R1 bindings resolve in local dev.
3.  Cloudflare API token works for deploy/migrations with least-privilege scopes.
4.  If migrating from Postgres, row-count validation is documented and completed.
5.  `POST /debug/trigger-sync` successfully fetches an RSS feed and creates Channels/Articles in DB.
6.  `GET /api/v1/clusters` returns JSON array of clusters.
