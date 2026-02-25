# Axial.news

A news aggregation platform that ingests 153 RSS feeds from 16 sources, clusters articles into stories using TF-IDF cosine similarity, shows left/center/right bias framing, heat vs. substance scores, and generates a daily digest. AI enrichment uses Cloudflare Workers AI.

## Architecture

**Full-stack app**: React SPA frontend + Express.js API backend + PostgreSQL database.

### Tech Stack
- **Frontend**: React 18 + Vite 7 (SWC) + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS v4
- **Backend**: Express.js (TypeScript via tsx)
- **Database**: PostgreSQL (Replit-managed)
- **AI**: Cloudflare Workers AI (free tier) for cluster summaries & bias analysis
- **RSS**: rss-parser for feed ingestion
- **Clustering**: TF-IDF cosine similarity (custom implementation)

### Project Structure
```
src/                    # Frontend (React SPA)
  app/                  # Redux store, slices, typed hooks
  components/           # Shared UI primitives (GlassCard, Badge, HeatBar)
  features/             # Domain components
    feed/               # ClusterCard, InfiniteFeed
    cluster/            # BiasMirror (left/center/right framing)
    digest/             # DigestPlayer (One-Minute World modal)
  layouts/              # AppLayout (header + nav)
  pages/                # Home, ClusterDetail, Research
  services/             # RTK Query API slice
  hooks/                # useTimeAgo
  types/                # TypeScript interfaces

server/                 # Backend (Express.js API)
  index.ts              # Express server, routes, startup
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
```

### Database Schema
- **sources**: 153 RSS feeds with name, url, bias label, category
- **articles**: Ingested articles with title, content, source, cluster assignment
- **clusters**: Grouped stories with topic, summary, bias analysis, scores
- **daily_digests**: Generated daily summaries
- **users, collections, bookmarks**: User features (future)

## Core Concept

The product primitive is a **Cluster** — a group of articles from different sources covering the same story. Each cluster includes:
- Representative headline and AI-generated summary
- Source count by political bias (left/center/right/international)
- Bias Mirror: AI analysis of how each perspective frames the story
- Heat vs Substance scores (emotional language vs. specificity)

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

- Background: `#0f172a` (Slate 950)
- Glassmorphism surfaces: `bg-white/5 backdrop-blur-md border-white/10`
- Accent: Indigo/Purple gradient
- Left bias: Blue | Center: Purple | Right: Red
- Heat: Orange | Substance: Cyan
