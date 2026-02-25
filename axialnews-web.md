# JIRA Task: Implement Axial.news Frontend (MVP)

**Status:** Open
**Priority:** High
**Assignee:** Frontend Engineer
**Due Date:** TBD

---

## 1. Overview
Build the client-facing web application for **Axial.news**. The UI must be highly responsive, "uncomfortably clean," and demonstrate the value of "patterns over noise." It consumes the backend API to display clustered news stories, infinite feeds, and bias analysis.

**Design Aesthetic**: "Premium, Glassmorphism, Vibrant Colors, Dynamic."
**Key Interaction**: 20-second demo flow (Feed -> Cluster -> Bias Mirror -> Digest).

---

## 2. Requirements & Stack

-   **Framework**: React (v18+) + Vite
-   **Language**: TypeScript
-   **State Management**: Redux Toolkit (RTK) + RTK Query (Best Practice for API)
-   **Styling**: Tailwind CSS (Utility-first) + CSS Modules (for component-specifics)
-   **Icons**: Lucide React
-   **Routing**: React Router DOM (v6)
-   **Hosting/Deployment**: Cloudflare Pages
-   **Edge Integration**: Calls Cloudflare Worker API endpoints

### Component Structure Rule
Every logical component must reside in its own directory with:
```
/ComponentName
  ├── index.tsx      # Logic & View
  ├── index.css      # Specific styles/animations (if needed)
  └── types.ts       # Component-specific interfaces
```

---

## 3. Implementation Plan (Chronological)

### Phase 1: Setup & Configuration

**Goal**: Initialize a modern React environment with strict typing and Redux.

#### Step 1.1: Project Init
```bash
npm create vite@latest axialnews-web -- --template react-swc-ts
cd axialnews-web
npm install
```

#### Step 1.2: Dependencies
```bash
# State & Routing
npm install @reduxjs/toolkit react-redux react-router-dom

# Styling & Icons
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react clsx tailwind-merge
```

#### Step 1.3: Configure Tailwind
Edit `tailwind.config.js` to add the "Axial" palette (dark mode primary).
- Background: `#0f172a` (Slate 950)
- Surface: Glassy, translucent.
- Accents: Vibrant gradients.

#### Step 1.4: Directory Structure
Create:
```
src/
  ├── app/          # Store setup
  ├── assets/       # Static files
  ├── components/   # Shared UI (Button, Card)
  ├── features/     # Domain components (Feed, Cluster)
  ├── layouts/      # Page skeletons
  ├── pages/        # Route targets
  ├── hooks/        # Custom hooks
  └── services/     # API definitions
```

---

### Phase 2: State Management (Redux)

**Goal**: Setup the store and API integration.

#### Step 2.1: Store Setup
Create `src/app/store.ts` and `src/app/hooks.ts` (typed `useDispatch`, `useSelector`).

#### Step 2.2: API Slice (RTK Query)
Create `src/services/api.ts`.
- **Base Query**: Points to Cloudflare Worker API (e.g., `https://api.axial.news/api/v1`, local: `http://127.0.0.1:8787/api/v1`).
- **Endpoints**:
    - `getClusters`: Params `{ cursor }`. Returns `{ items, nextCursor }`.
    - `getClusterDetail`: Params `id`.
    - `getDigest`: Returns today's summary.
    - `getCollections`: Auth required.

---

### Phase 3: Building Blocks (Design System)

**Goal**: Create the visual primitives. "Make it feel premium."

#### Step 3.1: Base Components
Build these in `src/components/`:

1.  **GlassCard**:
    -   A wrapper `div` with `backdrop-blur-md`, `bg-white/5`, `border-white/10`.
    -   Usage: Container for almost everything.
2.  **Badge**:
    -   Small pill for simple tags ("Left", "Right", "High Heat").
3.  **HeatBar**:
    -   Visual slider showing Heat vs Substance scores.
    -   `Gradient from Orange (Heat) to Blue (Substance)`.

---

### Phase 4: Feature Components

**Goal**: Implement the business logic views.

#### Step 4.1: The Cluster Card
`src/features/feed/ClusterCard/`
-   **Props**: `Cluster` object.
-   **View**:
    -   Top: Topic + Article Count ("12 sources").
    -   Middle: `RepresentativeHeadline`.
    -   Bottom: `HeatSubstance` bar + `TimeAgo`.
-   **Interactions**: Click -> Navigate to `/cluster/:id`.

#### Step 4.2: Infinite Feed
`src/features/feed/InfiniteFeed/`
-   **Logic**: Use IntersectionObserver (or `react-intersection-observer`) to trigger `fetchNextPage` from RTK Query.
-   **View**: Stack of `ClusterCard`s.

#### Step 4.3: Bias Mirror (The Detail View)
`src/features/cluster/BiasMirror/`
-   **Layout**: 3 Columns (Left, Center, Right) on desktop, Tabs on mobile.
-   **Content**:
    -   Left Col: `leftEmphasizes` text + list of Left articles.
    -   Center Col: `consistentAcrossAll` text + list of Center articles.
    -   Right Col: `rightEmphasizes` text + list of Right articles.

#### Step 4.4: Daily Digest Player
`src/features/digest/DigestPlayer/`
-   **View**: Modal or Bottom Sheet.
-   **Content**: The "One Minute" text summary scrolling or static.
-   **Audio**: Play button (if TTS enabled).
-   **Action**: "Mark as Done" -> "You're caught up".

---

### Phase 5: Pages & Routing

**Goal**: Stitch it all together.

#### Step 5.1: Routing
`src/App.tsx`:
```tsx
<Routes>
  <Route path="/" element={<HomeFeed />} />
  <Route path="/cluster/:id" element={<ClusterDetail />} />
  <Route path="/research" element={<ResearchCollections />} />
</Routes>
```

#### Step 5.2: Home Page
-   **Header**: "Axial" (Minimal).
-   **Main**: `DailyDigest` trigger (if new) + `InfiniteFeed`.

#### Step 5.3: Cluster Detail Page
-   **Header**: Back button.
-   **Hero**: `Cluster` Summary + Topic.
-   **Content**: `BiasMirror` component.
-   **Footer**: "Add to Research" button.

---

## 4. Definition of Done
1.  Frontend runs on `localhost:5173`.
2.  Connects to Backend API (CORS handled).
3.  Infinite scroll works smoothly (loads more clusters).
4.  Switching to mobile view stacks the Bias Mirror columns into tabs.
5.  "Heat vs Substance" visualizations are rendered correctly.
6.  Production deploys successfully to Cloudflare Pages and talks to the Cloudflare Worker API.
