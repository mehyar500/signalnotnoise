# Axial.news

A global news aggregation platform that ingests 153+ RSS feeds, clusters articles into stories using TF-IDF cosine similarity, shows global left/center/right/international bias framing, heat vs. substance scores, and generates a daily digest. AI enrichment uses Cloudflare Workers AI.

## Architecture

**Full-stack app**: React SPA frontend + Express.js API backend + PostgreSQL database.

### Tech Stack
- **Frontend**: React 18 + Vite 7 (SWC) + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS v4 + CSS custom properties (dark/light theme)
- **Backend**: Express.js (TypeScript via tsx)
- **Database**: PostgreSQL (Replit-managed)
- **AI**: Cloudflare Workers AI (free tier) for cluster summaries & bias analysis
- **RSS**: rss-parser for feed ingestion + validation
- **Clustering**: TF-IDF cosine similarity (custom implementation)

### Project Structure
```
src/                    # Frontend (React SPA)
  app/                  # Redux store, slices (auth, digest, theme), typed hooks
  components/           # Shared UI: GlassCard, Badge, HeatBar, CoverageSpectrum
  features/             # Domain components
    feed/               # ClusterCard, InfiniteFeed
    cluster/            # BiasMirror (global left/center/right framing)
    digest/             # DigestPlayer (One-Minute World modal overlay)
  layouts/              # AppLayout (header + 4-tab nav + theme toggle)
  pages/                # Home, Blindspot, Digest, ClusterDetail, Research, Auth
  services/             # RTK Query API slice (clusters, blindspot, digest, admin sources)
  hooks/                # useTimeAgo
  types/                # TypeScript interfaces

server/                 # Backend (Express.js API)
  index.ts              # Express server, routes (public + admin), auth, startup
  db.ts                 # PostgreSQL connection pool
  schema.ts             # Database schema initialization
  seed-sources.ts       # 153 RSS feed sources with bias labels
  services/
    rss-fetcher.ts      # RSS feed parsing & article extraction
    clustering.ts       # TF-IDF cosine similarity clustering
    scorer.ts           # Heat & substance scoring
    pipeline.ts         # Orchestrates sync, clustering, AI enrichment
    cloudflare-ai.ts    # Cloudflare Workers AI integration
    digest.ts           # Daily digest generation
    feed-validator.ts   # RSS feed validation before source insert
```

### Database Schema
- **sources**: 153+ RSS feeds with name, url, bias label, is_active, updated_at
- **articles**: Ingested articles with title, content, source, image_url, cluster assignment
- **clusters**: Grouped stories with topic, summary, bias analysis, scores, hero image
- **daily_digests**: Generated daily summaries
- **users**: Auth with email, password_hash, display_name, is_admin (first user auto-admin)
- **collections, bookmarks**: Research collections system (CRUD for collections, bookmark clusters)

## Auth & Admin

- Open signup (no beta gate), 8-character minimum password
- First user auto-promoted to admin (`is_admin = true`)
- JWT auth with 30-day tokens, stored in localStorage
- Admin endpoints require JWT + `is_admin` flag

### Admin Source Management Endpoints
- `GET /api/v1/admin/sources` — list all sources
- `POST /api/v1/admin/sources` — add single source (validates RSS feed first)
- `POST /api/v1/admin/sources/bulk` — bulk import array of sources
- `POST /api/v1/admin/sources/import-file` — import from JSON file on disk
- `PATCH /api/v1/admin/sources/:id` — update source (name, bias, active)
- `DELETE /api/v1/admin/sources/:id` — remove source
- `POST /api/v1/admin/sources/validate` — test-parse a feed URL

## Navigation & Pages

4-tab dashboard (Ground News-inspired):
- **Feed** (`/`): Infinite scroll of clustered stories with coverage spectrum bars
- **Blindspot** (`/blindspot`): Stories with lopsided coverage (>70% one perspective or missing perspectives)
- **Digest** (`/digest`): Full-page "One-Minute World" daily briefing (also available as header modal)
- **Research** (`/research`): Search + collections + bookmarks (requires auth)

## Theme System

Dark/light mode toggle via CSS custom properties:
- Theme stored in `localStorage('axial_theme')`
- Toggle via Redux `themeSlice` → `toggleTheme()`
- All components use CSS variables: `var(--bg-primary)`, `var(--text-primary)`, `var(--bg-card)`, etc.
- `data-theme` attribute set on document root

## Core Concept

The product primitive is a **Cluster** — a group of articles from different sources covering the same story. Each cluster includes:
- Representative headline and AI-generated summary
- Source count by global perspective (left-leaning/center/right-leaning/international)
- Coverage Spectrum: visual bar showing source distribution
- Bias Mirror: AI analysis of how each perspective frames the story
- Heat vs Substance scores (emotional language vs. specificity)
- Blindspot indicator when coverage is heavily one-sided

## Running

```bash
npm run dev   # Starts both backend (port 3001) and frontend (port 5000)
```

- Frontend: Vite dev server on port 5000
- Backend: Express API on port 3001
- Vite proxies `/api` requests to the backend

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-configured by Replit)
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID for Workers AI
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Workers AI permission

## Cron Jobs

- **Feed sync**: Every 30 minutes — fetches all RSS feeds, clusters articles, runs AI enrichment
- **Daily digest**: Every day at 6am UTC

## Design System

- Dark theme: `#111318` base, warm charcoal surfaces, glassmorphism
- Light theme: `#f5f5f0` warm white/cream backgrounds
- Accent: Amber/burnt-orange (`#d97706` dark, `#b45309` light) — matching compass logo
- Bias colors: Left = Blue (`#2563eb`), Center = Gray (`#6b7280`), Right = Red (`#dc2626`), International = Green (`#059669`)
- Heat: Orange (`#f97316`) | Substance: Cyan (`#06b6d4`)
- Logo: Amber compass rose SVG (inline component `src/components/Logo.tsx` + `public/favicon.svg`)
- Favicon: SVG compass icon at `public/favicon.svg`
- All components use CSS custom properties exclusively — no hardcoded `text-white/*` or `text-indigo-*` 
- Layout: `max-w-6xl` container
