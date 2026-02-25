# Axial.news

A news aggregation web application that compresses the world into distinct stories, shows consensus and disagreements, and provides a daily moment of clarity.

## Architecture

**Frontend-only React SPA** (the backend is designed for Cloudflare Workers — not yet implemented).

### Tech Stack
- **Framework**: React 18 + Vite 7 (SWC compiler)
- **Language**: TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Routing**: React Router DOM v6

### Project Structure
```
src/
  app/           # Redux store, slices, typed hooks
  components/    # Shared UI primitives (GlassCard, Badge, HeatBar)
  features/      # Domain components
    feed/        # ClusterCard, InfiniteFeed
    cluster/     # BiasMirror (left/center/right framing)
    digest/      # DigestPlayer (One-Minute World modal)
  layouts/       # AppLayout (header + nav)
  pages/         # Home, ClusterDetail, Research
  services/      # RTK Query API slice + mock data
  hooks/         # useTimeAgo
  types/         # TypeScript interfaces
```

## Core Concept

The product primitive is a **Cluster** — a group of articles from different sources covering the same story. Each cluster includes:
- Representative headline and summary
- Source count by political bias (left/center/right)
- Bias Mirror: how each perspective frames the story
- Heat vs Substance scores (emotional language vs. specificity)

## Running

```bash
npm run dev   # Development server on port 5000
npm run build # Production build to dist/
```

## Current State

The frontend uses **mock data** (10 pre-built story clusters) to demonstrate the full product experience. The backend (Cloudflare Workers + D1 + RSS ingestion + Workers AI embeddings) is defined in `axialnews-api.md` and `Axial.news.md` but not yet implemented.

## Deployment

Configured as a **static site** deployment (builds via `npm run build`, serves `dist/`).

## Design System

- Background: `#0f172a` (Slate 950)
- Glassmorphism surfaces: `bg-white/5 backdrop-blur-md border-white/10`
- Accent: Indigo/Purple gradient
- Left bias: Blue | Center: Purple | Right: Red
- Heat: Orange | Substance: Cyan
