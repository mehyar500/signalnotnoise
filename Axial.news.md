# Axial.news

> **"We compress the world into distinct stories, show you the consensus + disagreements, and give you one daily moment of clarity."**

---

## Pick the demo. Cut the rest. Ship the knife.

This document follows **one principle**: Everything serves the killer demo.

---

# 🎯 THE KILLER DEMO (20 Seconds)

```
1. Open app
2. See 10 clusters, each with "covered by 12 sources"
3. Tap one cluster
4. See 3-column bias mirror (left / center / right) with 1 sentence each
5. Hit play: 60-second digest
6. "You're caught up."
```

**If you can't demo it in 20 seconds, it doesn't exist.**

---

# ⚠️ THE CONSTRAINT IS YOUR LEVERAGE

Free RSS feeds provide:
- ✅ Title
- ✅ Description/snippet (50-300 words)
- ✅ Link (kept as reference)
- ✅ Publication date
- ✅ Source name
- ❌ Full article content (paywalled/unavailable)

**Position it as:**
- "We don't need full articles to see patterns."
- "We're analyzing coverage, not content."
- "This is about signal detection in the media ecosystem."

That makes the "no full text" look **intentional**, not impoverished.

---

# 📦 THE MVP

**The only things you need to prove product-market pull:**

| Component | Purpose |
|-----------|---------|
| Feed Ingestion | Get article metadata from RSS |
| Embeddings | Vector representation for similarity |
| **Clustering** | THE core primitive - everything hangs off this |
| Cluster Summaries | One summary per story, not per article |
| Bias Mirror (simple) | Left / Center / Right framing differences |
| Daily Digest | 60 seconds of clarity, ends with closure |
| Research Tools | Collections, Bookmarks, and Triggers to "Return" |
| Basic Auth | Email-based login for saving research |

---

# 🔧 THE CLUSTER OBJECT (Product Primitive)

> **Everything in the product hangs off the Cluster object.**

A Cluster is NOT an article. A Cluster is a **STORY** - the same event covered by multiple sources.

```typescript
// This is THE central object. Everything else is a view on this.
interface Cluster {
  id: string;
  
  // ---------------------------------------------------------------------------
  // IDENTITY - What is this story?
  // ---------------------------------------------------------------------------
  representativeHeadline: string;   // Best title from the cluster
  summary: string;                   // 2-3 sentence LLM summary
  topic: string;                     // "Biden Infrastructure Bill"
  topicSlug: string;                 // "biden-infrastructure-bill"
  
  // ---------------------------------------------------------------------------
  // COVERAGE - Who's talking about this?
  // ---------------------------------------------------------------------------
  articleCount: number;              // "Covered by 12 sources"
  sourceCount: number;               // Unique outlets
  sourceBreakdown: {                 // By bias label
    left: number;
    center: number;
    right: number;
    international: number;
  };
  
  // ---------------------------------------------------------------------------
  // FRAMING DIFFERENCES (Bias Mirror data)
  // ---------------------------------------------------------------------------
  // This is the strict schema output - NOT a long LLM essay
  biasAnalysis: {
    leftEmphasizes: string;          // 1 sentence max
    rightEmphasizes: string;         // 1 sentence max
    consistentAcrossAll: string;     // What everyone agrees on
    whatsMissing: string;            // Gaps in coverage
  };
  
  // ---------------------------------------------------------------------------
  // HEAT VS SUBSTANCE (replaces "Reality Check")
  // ---------------------------------------------------------------------------
  // Not preachy. Not moralizing. Just data.
  heatScore: number;                 // 0-1, urgency/emotional language
  substanceScore: number;            // 0-1, specificity (numbers, entities, concrete claims)
  // Display: "High heat, low substance. Read skeptically."
  
  // ---------------------------------------------------------------------------
  // TIMING
  // ---------------------------------------------------------------------------
  firstArticleAt: Date;              // When story broke
  lastArticleAt: Date;               // Most recent update
  lastUpdated: Date;                 // When we last processed
  
  // ---------------------------------------------------------------------------
  // VECTOR (for similarity/search)
  // ---------------------------------------------------------------------------
  centroid: Float[768];              // Average embedding of member articles
  
  // ---------------------------------------------------------------------------
  // MEMBER ARTICLES (links back, not the main data)
  // ---------------------------------------------------------------------------
  articles: Article[];
}
```

---

# 📐 MVP DATABASE SCHEMA

> **Build less. Ship faster. Iterate on reality, not imagination.**

**Infra direction (current):** D1 is the operational relational store, R1 holds larger artifacts/snapshots, and vector similarity lives in a Cloudflare-compatible vector index used by Workers. The schema below remains the product data contract and should be mapped to D1 tables.

MVP schema includes core Clustering + Research/Engagement tables:

```prisma
// =============================================================================
// data-model reference (map this contract to Cloudflare D1 + vector index)
// =============================================================================

// NOTE: Keep this as a logical schema reference.
// Runtime infra is Cloudflare Workers + D1 + R1 + Workers AI.

// =============================================================================
// SOURCE - RSS Feed Sources
// =============================================================================
// Minimal. Just what we need to fetch and label.
// =============================================================================

model Source {
  id          String    @id @default(uuid())
  
  // Feed metadata
  name        String                    // "CNN", "Fox News", "BBC"
  feedUrl     String    @unique         // RSS feed URL
  
  // Bias label - THIS IS THE DIFFERENTIATION
  // Values: "left", "center-left", "center", "center-right", "right", "international"
  // Pre-labeled from AllSides/MediaBiasFactCheck data
  biasLabel   String?
  
  // Fetch management
  lastFetchedAt DateTime?
  isActive      Boolean  @default(true)
  
  // Relationships
  articles    Article[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([biasLabel])
  @@index([isActive])
}

// =============================================================================
// ARTICLE - Individual News Articles
// =============================================================================
// The raw input. Gets assigned to a cluster.
// =============================================================================

model Article {
  id           String   @id @default(uuid())
  
  // Source relationship
  sourceId     String
  source       Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  // Core content (ONLY what RSS gives us)
  title        String
  description  String                   // 50-300 word snippet
  link         String   @unique         // Original URL (reference only)
  publishedAt  DateTime
  
  // ---------------------------------------------------------------------------
  // VECTOR EMBEDDING (768 dimensions, Cloudflare BGE model)
  // ---------------------------------------------------------------------------
  // Generated from: CONCAT(title, ' ', description)
  //
  // CRITICAL QUERIES:
  //
  // Find similar articles for clustering:
  //   SELECT id, title, 1 - (embedding <=> $new) as similarity
  //   FROM "Article"
  //   WHERE publishedAt > NOW() - INTERVAL '48 hours'
  //   ORDER BY embedding <=> $new
  //   LIMIT 5;
  //
  // If similarity > 0.85, JOIN existing cluster
  // If no match, CREATE new cluster
  // ---------------------------------------------------------------------------
  embedding    Unsupported("vector(768)")?
  
  // ---------------------------------------------------------------------------
  // HEAT VS SUBSTANCE SCORES (at article level for aggregation)
  // ---------------------------------------------------------------------------
  heatScore       Float?   // Urgency/emotional language (0-1)
  substanceScore  Float?   // Specificity: numbers, entities, claims (0-1)
  
  // Processing status
  isProcessed  Boolean  @default(false)
  
  // Cluster assignment
  clusterId    String?
  cluster      Cluster? @relation(fields: [clusterId], references: [id])
  
  fetchedAt    DateTime @default(now())

  @@index([sourceId])
  @@index([clusterId])
  @@index([publishedAt])
  @@index([isProcessed])
}

// =============================================================================
// CLUSTER - THE CORE OBJECT
// =============================================================================
// This is THE product primitive. Everything else is a view on this.
//
// CLUSTERING LOGIC:
// 1. New article comes in → generate embedding
// 2. Find top 5 similar articles within 48h window
// 3. If any have similarity > 0.85 AND belong to a cluster → JOIN that cluster
// 4. If no match → CREATE new cluster with this article as seed
// 5. Update cluster centroid: new_centroid = (old * n + new_embedding) / (n + 1)
//
// CLUSTER LIFECYCLE:
// - Active: accepting new articles (< 48h since last article)
// - Inactive: frozen, no new articles
// - Daily merge job: combine clusters that prove to be same story
// =============================================================================

model Cluster {
  id            String    @id @default(uuid())
  
  // ---------------------------------------------------------------------------
  // IDENTITY
  // ---------------------------------------------------------------------------
  topic         String?                   // "Biden Infrastructure Bill"
  topicSlug     String?                   // URL-friendly slug
  representativeHeadline String?          // Best title from member articles
  
  // Summary (generated by LLM for One-Minute World)
  summary       String?                   // 2-3 sentences, ~40 words
  summaryGeneratedAt DateTime?
  
  // ---------------------------------------------------------------------------
  // CLUSTER CENTROID (pgvector)
  // ---------------------------------------------------------------------------
  // Average embedding of all member articles
  // Updated incrementally on each new article
  //
  // QUERY: Find clusters similar to a search
  //   SELECT id, topic, 1 - (centroid <=> $query) as relevance
  //   FROM "Cluster"
  //   ORDER BY centroid <=> $query
  //   LIMIT 10;
  // ---------------------------------------------------------------------------
  centroid      Unsupported("vector(768)")?
  
  // ---------------------------------------------------------------------------
  // BIAS ANALYSIS (Bias Mirror feature)
  // ---------------------------------------------------------------------------
  // Strict schema output - NOT a long essay
  // JSON structure:
  // {
  //   "leftEmphasizes": "Highlights worker benefits",
  //   "rightEmphasizes": "Warns of federal overreach", 
  //   "consistentAcrossAll": "Bill passed with bipartisan support",
  //   "whatsMissing": "No coverage of implementation timeline"
  // }
  // ---------------------------------------------------------------------------
  biasAnalysis  Json?
  
  // ---------------------------------------------------------------------------
  // HEAT VS SUBSTANCE (aggregated from articles)
  // ---------------------------------------------------------------------------
  // Average of member article scores
  avgHeatScore      Float?
  avgSubstanceScore Float?
  
  // ---------------------------------------------------------------------------
  // COVERAGE METRICS
  // ---------------------------------------------------------------------------
  articleCount  Int       @default(1)
  sourceCount   Int       @default(1)
  
  // Breakdown by bias (for quick filtering)
  leftCount     Int       @default(0)
  centerCount   Int       @default(0)
  rightCount    Int       @default(0)
  
  // ---------------------------------------------------------------------------
  // TIME BOUNDS
  // ---------------------------------------------------------------------------
  firstArticleAt DateTime
  lastArticleAt  DateTime
  isActive       Boolean  @default(true)  // Still accepting articles?
  
  // Relationships
  articles      Article[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([isActive])
  @@index([articleCount])
  @@index([lastArticleAt])
}

// =============================================================================
// DAILY DIGEST - One-Minute World cache
// =============================================================================
// Pre-generated daily summary. The habit loop.
// =============================================================================

model DailyDigest {
  id            String   @id @default(uuid())
  
  digestDate    DateTime @unique         // Date this covers
  
  // Content
  summary       String                   // ~150 words, ~60 seconds spoken
  keyTopics     String[]                 // ["Biden Policy", "Tech Layoffs"]
  
  // Closure message
  closingLine   String   @default("You're caught up.")
  
  // Optional TTS
  audioUrl      String?
  audioDuration Int?                     // Seconds
  
  // Metadata
  clusterCount  Int
  articleCount  Int
  
  createdAt     DateTime @default(now())

  @@index([digestDate])
}

// =============================================================================
// RESEARCH & ENGAGEMENT - The "Depth" Repositories
// =============================================================================
// PURPOSE: Turn passive readers into active researchers.
// "Make them come back" -> "Notify me when this story changes"
// =============================================================================

model User {
  id            String    @id @default(uuid())
  email         String?   @unique  // Optional start, required for notifications
  
  // Research Collections
  collections   Collection[]
  
  createdAt     DateTime  @default(now())
  lastActiveAt  DateTime  @default(now())
}

model Collection {
  id            String    @id @default(uuid())
  title         String    // "Election 2024", "My Research", "Watchlist"
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  bookmarks     Bookmark[]
  
  // Engagement Triggers
  notifyUpdates Boolean   @default(true) // "Ping me on significant updates"
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
}

model Bookmark {
  id            String    @id @default(uuid())
  collectionId  String
  collection    Collection @relation(fields: [collectionId], references: [id])
  
  clusterId     String
  cluster       Cluster    @relation(fields: [clusterId], references: [id])
  
  // Snapshot of why they saved it (optional)
  note          String?
  
  createdAt     DateTime  @default(now())
  
  @@unique([collectionId, clusterId])
}
```

---

# 🔄 MVP DATA FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MVP PIPELINE                                    │
│   Everything flows toward building CLUSTERS for the killer demo             │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: FETCH RSS
    │
    ▼
┌───────────────────────────────────────┐
│ RSSFetcherService.fetchFeed(url)      │
│ Output: { title, description, link }  │
└───────────────────────────────────────┘
    │
    ▼
STEP 2: DEDUPE BY LINK
    │ EXISTS in Article table? → SKIP
    │
    ▼
STEP 3: GENERATE EMBEDDING
    │
    ▼
┌───────────────────────────────────────┐
│ CloudflareAI.embed(                   │
│   title + " " + description           │
│ )                                     │
│ Output: Float[768]                    │
└───────────────────────────────────────┘
    │
    ▼
STEP 4: HEAT VS SUBSTANCE SCORING
    │
    ▼
┌───────────────────────────────────────┐
│ HeatSubstanceService.analyze(text)    │
│                                       │
│ Heat: Count emotional/urgency words   │
│   "unprecedented", "shocking", etc.   │
│   → normalize to 0-1                  │
│                                       │
│ Substance: Count specificity signals  │
│   numbers, proper nouns, quotes, etc. │
│   → normalize to 0-1                  │
│                                       │
│ Output: { heat: 0.7, substance: 0.3 } │
│ → "High heat, low substance"          │
└───────────────────────────────────────┘
    │
    ▼
STEP 5: FIND SIMILAR ARTICLES (CLUSTERING)
    │
    ▼
┌───────────────────────────────────────┐
│ SQL:                                  │
│ SELECT id, clusterId,                 │
│        1 - (embedding <=> $new) as s  │
│ FROM Article                          │
│ WHERE publishedAt > NOW() - '48h'     │
│ ORDER BY embedding <=> $new           │
│ LIMIT 5                               │
└───────────────────────────────────────┘
    │
    ├─── similarity > 0.85 AND has clusterId?
    │    │
    │    ▼ YES: JOIN EXISTING CLUSTER
    │    ┌─────────────────────────────────┐
    │    │ UPDATE Article                  │
    │    │ SET clusterId = existing.id     │
    │    │                                 │
    │    │ UPDATE Cluster                  │
    │    │ SET articleCount += 1,          │
    │    │     centroid = weighted_avg(),  │
    │    │     sourceCount = recalculate,  │
    │    │     lastArticleAt = NOW()       │
    │    └─────────────────────────────────┘
    │
    ▼ NO: CREATE NEW CLUSTER
┌───────────────────────────────────────┐
│ INSERT Cluster (                      │
│   centroid = article.embedding,       │
│   representativeHeadline = title,     │
│   firstArticleAt = publishedAt,       │
│   lastArticleAt = publishedAt         │
│ )                                     │
│ UPDATE Article SET clusterId = new.id │
└───────────────────────────────────────┘
    │
    ▼
STEP 6: TRIGGER CLUSTER UPDATES (async, when thresholds hit)
    │
    ├─► 3+ articles in cluster? → Generate cluster.summary
    ├─► 2+ bias labels covered? → Generate biasAnalysis
    └─► Update avgHeatScore, avgSubstanceScore

STEP 7: ENGAGEMENT LOOP (Research Triggers)
    │
    ▼
┌───────────────────────────────────────┐
│ IF Cluster is Bookmarked by Users:    │
│   AND Significant Update Detected     │
│   (New source, major bias shift)      │
│                                       │
│ → Notify User:                        │
│   "New development in [Topic]"        │
│ → Update Collection "Last Updated"    │
└───────────────────────────────────────┘


```

---

# 🎨 MVP SERVICES

## 1. RSS Fetcher (Simple, Clean)

```typescript
// src/services/rss-fetcher.service.ts
import Parser from 'rss-parser';

interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

export class RSSFetcherService {
  private parser = new Parser();

  async fetchFeed(url: string): Promise<FeedItem[]> {
    const feed = await this.parser.parseURL(url);
    
    return feed.items.map(item => ({
      title: item.title || '',
      description: this.cleanDescription(item.contentSnippet || item.content || ''),
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
    }));
  }

  private cleanDescription(text: string): string {
    // Remove HTML, limit to 500 chars
    return text.replace(/<[^>]*>/g, '').slice(0, 500);
  }
}
```

## 2. Heat vs Substance Scorer (Better than "Manipulation Detection")

> **This framing feels intelligent, not moralizing.**

```typescript
// src/services/heat-substance.service.ts

// HEAT = urgency/emotional language
const HEAT_SIGNALS = [
  { pattern: /unprecedented/i, weight: 0.15 },
  { pattern: /shocking/i, weight: 0.2 },
  { pattern: /breaking/i, weight: 0.1 },
  { pattern: /bombshell/i, weight: 0.25 },
  { pattern: /slammed/i, weight: 0.15 },
  { pattern: /outrage/i, weight: 0.2 },
  { pattern: /crisis/i, weight: 0.15 },
  { pattern: /you won't believe/i, weight: 0.25 },
  { pattern: /everyone is saying/i, weight: 0.2 },
  { pattern: /could be catastrophic/i, weight: 0.2 },
  { pattern: /!{2,}/g, weight: 0.1 },              // Multiple exclamation marks
  { pattern: /ALL CAPS WORDS/g, weight: 0.1 },
];

// SUBSTANCE = specificity (numbers, entities, concrete claims)
const SUBSTANCE_SIGNALS = [
  { pattern: /\$[\d,]+/g, weight: 0.2 },           // Dollar amounts
  { pattern: /\d+%/g, weight: 0.2 },               // Percentages
  { pattern: /\d{1,3}(,\d{3})+/g, weight: 0.15 }, // Large numbers
  { pattern: /"[^"]{10,}"/g, weight: 0.2 },       // Quoted speech
  { pattern: /according to/i, weight: 0.15 },     // Attribution
  { pattern: /study|research|report/i, weight: 0.15 },
  { pattern: /January|February|March|April|May|June|July|August|September|October|November|December/i, weight: 0.1 },
];

export class HeatSubstanceService {
  analyze(title: string, description: string): { heat: number; substance: number; label: string } {
    const text = `${title} ${description}`;
    
    let heatScore = 0;
    for (const { pattern, weight } of HEAT_SIGNALS) {
      if (pattern.test(text)) heatScore += weight;
    }
    heatScore = Math.min(heatScore, 1);
    
    let substanceScore = 0;
    for (const { pattern, weight } of SUBSTANCE_SIGNALS) {
      if (pattern.test(text)) substanceScore += weight;
    }
    substanceScore = Math.min(substanceScore, 1);
    
    // Generate human-readable label
    const label = this.generateLabel(heatScore, substanceScore);
    
    return { heat: heatScore, substance: substanceScore, label };
  }
  
  private generateLabel(heat: number, substance: number): string {
    if (heat > 0.6 && substance < 0.3) return "High heat, low substance. Read skeptically.";
    if (heat < 0.3 && substance > 0.6) return "Low heat, high substance. Solid reporting.";
    if (heat > 0.6 && substance > 0.6) return "High heat AND substance. Important but emotional.";
    return "Balanced coverage.";
  }
}
```

## 3. Bias Mirror (Strict Schema, Not Essays)

> **Short. Controlled. Reliable.**

```typescript
// src/services/bias-analyzer.service.ts

interface ClusterArticle {
  title: string;
  description: string;
  biasLabel: string; // "left" | "center" | "right"
}

interface BiasAnalysis {
  leftEmphasizes: string;       // 1 sentence max
  rightEmphasizes: string;      // 1 sentence max
  consistentAcrossAll: string;  // What everyone agrees on
  whatsMissing: string;         // Gaps in coverage
}

export class BiasAnalyzerService {
  constructor(private ai: CloudflareAIService) {}

  async analyzeCluster(articles: ClusterArticle[]): Promise<BiasAnalysis> {
    const grouped = {
      left: articles.filter(a => a.biasLabel.includes('left')),
      center: articles.filter(a => a.biasLabel === 'center'),
      right: articles.filter(a => a.biasLabel.includes('right')),
    };

    // STRICT PROMPT - forces structured output
    const prompt = `You are analyzing news coverage of the same event from different political perspectives.

LEFT-LEANING SOURCES:
${grouped.left.map(a => `- ${a.title}`).join('\n') || '(none)'}

CENTER SOURCES:
${grouped.center.map(a => `- ${a.title}`).join('\n') || '(none)'}

RIGHT-LEANING SOURCES:
${grouped.right.map(a => `- ${a.title}`).join('\n') || '(none)'}

Respond ONLY in this exact JSON format, each value must be ONE SENTENCE MAXIMUM:
{
  "leftEmphasizes": "...",
  "rightEmphasizes": "...",
  "consistentAcrossAll": "...",
  "whatsMissing": "..."
}`;

    const response = await this.ai.chat(prompt);
    return JSON.parse(response) as BiasAnalysis;
  }
}

## 4. Research Service (The Rabbit Hole Engine)

```typescript
// src/services/research.service.ts

interface ClusterFeed {
  items: any[];
  nextCursor: string | null;
}

export class ResearchService {
  constructor(private prisma: PrismaClient) {}
  
  // The "Infinite Scroll" Logic
  // Uses cursor-based pagination for high performance
  // But maintains "Closure" by having distinct sessions/breaks
  async getFeed(cursor?: string, limit = 20): Promise<ClusterFeed> {
    const clusters = await this.prisma.cluster.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { articleCount: 'desc' }, // Big stories first
        { lastArticleAt: 'desc' } // Then recent updates
      ],
      where: { 
        // Show all clusters for research/exploration, or maybe filter by relevance score
        // For the main feed, we might want active ones or just recent ones.
        // removing isActive: true to allow browsing history
      },
      include: {
        // Include minimal data for list view
        source: false, 
        articles: false 
      }
    });
    
    return {
      items: clusters,
      nextCursor: clusters.length === limit ? clusters[limit - 1].id : null
    };
  }

  // The "Deep Dive" Logic
  async getRelatedClusters(clusterId: string): Promise<any[]> {
    // Find related stories via vector similarity
    // This creates the "Rabbit Hole" effect
    const source = await this.prisma.cluster.findUnique({ where: { id: clusterId } });
    
    if (!source || !source.centroid) return [];
    
    // Raw vector search for related clusters
    return this.prisma.$queryRaw`
      SELECT id, topic, summary, 
             1 - (centroid <=> ${source.centroid}::vector) as similarity
      FROM "Cluster"
      WHERE id != ${clusterId}
      AND 1 - (centroid <=> ${source.centroid}::vector) > 0.7
      ORDER BY centroid <=> ${source.centroid}::vector
      LIMIT 3
    `;
  }
}
```

## 5. Clustering Service (The Core Logic)

```typescript
// src/services/clustering.service.ts
import { PrismaClient } from '@prisma/client';

interface SimilarArticle {
  id: string;
  clusterId: string | null;
  similarity: number;
}

export class ClusteringService {
  constructor(
    private prisma: PrismaClient,
    private ai: CloudflareAIService
  ) {}

  // ---------------------------------------------------------------------------
  // CORE CLUSTERING LOGIC
  // ---------------------------------------------------------------------------
  // 1. Find similar articles within 48h window
  // 2. If similarity > 0.85 and article has cluster → join that cluster
  // 3. Otherwise → create new cluster
  // ---------------------------------------------------------------------------
  
  async assignToCluster(articleId: string, embedding: number[]): Promise<string> {
    // Find similar articles from last 48 hours
    const similar = await this.findSimilarArticles(embedding, 5);
    
    // Check if any similar article belongs to a cluster
    for (const match of similar) {
      if (match.similarity > 0.85 && match.clusterId) {
        await this.joinCluster(articleId, match.clusterId, embedding);
        return match.clusterId;
      }
    }
    
    // No match → create new cluster
    return this.createCluster(articleId, embedding);
  }
  
  private async findSimilarArticles(
    embedding: number[], 
    limit: number
  ): Promise<SimilarArticle[]> {
    // Raw SQL for vector similarity search
    const results = await this.prisma.$queryRaw<SimilarArticle[]>`
      SELECT id, "clusterId", 1 - (embedding <=> ${embedding}::vector) as similarity
      FROM "Article"
      WHERE embedding IS NOT NULL
        AND "publishedAt" > NOW() - INTERVAL '48 hours'
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `;
    return results;
  }
  
  private async joinCluster(
    articleId: string, 
    clusterId: string, 
    embedding: number[]
  ): Promise<void> {
    // Get current cluster
    const cluster = await this.prisma.cluster.findUnique({
      where: { id: clusterId },
    });
    if (!cluster) return;
    
    // Update article
    await this.prisma.article.update({
      where: { id: articleId },
      data: { clusterId },
    });
    
    // Update cluster metrics
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { source: true },
    });
    
    await this.prisma.cluster.update({
      where: { id: clusterId },
      data: {
        articleCount: { increment: 1 },
        lastArticleAt: article?.publishedAt || new Date(),
        // Update bias counts
        leftCount: article?.source.biasLabel?.includes('left') 
          ? { increment: 1 } : undefined,
        centerCount: article?.source.biasLabel === 'center' 
          ? { increment: 1 } : undefined,
        rightCount: article?.source.biasLabel?.includes('right') 
          ? { increment: 1 } : undefined,
      },
    });
    
    // Trigger async updates if thresholds hit
    this.maybeUpdateCluster(clusterId);
  }
  
  private async createCluster(articleId: string, embedding: number[]): Promise<string> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { source: true },
    });
    if (!article) throw new Error('Article not found');
    
    const cluster = await this.prisma.cluster.create({
      data: {
        representativeHeadline: article.title,
        firstArticleAt: article.publishedAt,
        lastArticleAt: article.publishedAt,
        leftCount: article.source.biasLabel?.includes('left') ? 1 : 0,
        centerCount: article.source.biasLabel === 'center' ? 1 : 0,
        rightCount: article.source.biasLabel?.includes('right') ? 1 : 0,
        // Store centroid as raw SQL since Prisma doesn't support vector natively
      },
    });
    
    // Update article with cluster assignment
    await this.prisma.article.update({
      where: { id: articleId },
      data: { clusterId: cluster.id },
    });
    
    // Set centroid via raw SQL
    await this.prisma.$executeRaw`
      UPDATE "Cluster" 
      SET centroid = ${embedding}::vector 
      WHERE id = ${cluster.id}
    `;
    
    return cluster.id;
  }
  
  // ---------------------------------------------------------------------------
  // ASYNC CLUSTER UPDATES
  // ---------------------------------------------------------------------------
  // Only run when thresholds are hit, not on every article
  // ---------------------------------------------------------------------------
  
  private async maybeUpdateCluster(clusterId: string): Promise<void> {
    const cluster = await this.prisma.cluster.findUnique({
      where: { id: clusterId },
      include: { articles: { include: { source: true } } },
    });
    if (!cluster) return;
    
    // Generate summary if 3+ articles
    if (cluster.articleCount >= 3 && !cluster.summary) {
      // Queue summary generation job
    }
    
    // Generate bias analysis if 2+ different bias labels covered
    const biasLabels = new Set(cluster.articles.map(a => a.source.biasLabel));
    if (biasLabels.size >= 2 && !cluster.biasAnalysis) {
      // Queue bias analysis job
    }
  }
}
```

## 5. Daily Digest Generator

```typescript
// src/services/digest.service.ts

export class DigestService {
  constructor(
    private prisma: PrismaClient,
    private ai: CloudflareAIService
  ) {}

  async generateDailyDigest(date: Date): Promise<void> {
    // Get top 10 clusters by article count from last 24h
    const topClusters = await this.prisma.cluster.findMany({
      where: {
        lastArticleAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        articleCount: { gte: 2 }, // Only stories with coverage
      },
      orderBy: { articleCount: 'desc' },
      take: 10,
    });

    // Build prompt from cluster summaries
    const clusterSummaries = topClusters
      .filter(c => c.summary)
      .map((c, i) => `${i + 1}. ${c.topic || c.representativeHeadline}: ${c.summary}`)
      .join('\n');

    const prompt = `You are creating a 60-second news digest. Be calm, specific, and brief.

Today's top stories:
${clusterSummaries}

Write a ~150 word summary that:
- Covers the most important stories
- Uses neutral, calm language
- Mentions specific facts when available
- Ends with a sense of closure

Do NOT use phrases like "in summary" or "in conclusion".
End naturally, as if closing a calm conversation.`;

    const summary = await this.ai.chat(prompt);
    
    await this.prisma.dailyDigest.create({
      data: {
        digestDate: date,
        summary,
        keyTopics: topClusters.slice(0, 5).map(c => c.topic || c.representativeHeadline || 'Unknown'),
        closingLine: "You're caught up.",
        clusterCount: topClusters.length,
        articleCount: topClusters.reduce((sum, c) => sum + c.articleCount, 0),
      },
    });
  }
}
```

---

# 🏗️ MVP ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Cloudflare Pages)                       │
│                      ReactJS + Vite                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Dashboard: Infinite Feed ("Just one more")               │    │
│  │  → Sort: Importance > Recency                             │    │
│  │  → Tap cluster → Deep Dive (Bias Mirror + Related)        │    │
│  │  → Daily Digest player (The Closure Hook)                 │    │
│  │  → "You're caught up" (Session boundary)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Cloudflare Workers)                             │
│                    TypeScript Worker Runtime                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SERVICES (MVP only):                                     │    │
│  │ • RSSFetcherService                                      │    │
│  │ • EmbeddingService (Cloudflare AI)                       │    │
│  │ • ClusteringService                                      │    │
│  │ • HeatSubstanceService                                   │    │
│  │ • BiasAnalyzerService                                    │    │
│  │ • DigestService                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────────┐
│   Cloudflare D1 + R1 + Vector Index        │    Cloudflare Workers AI  │
│   (local Wrangler dev / Cloudflare edge prod)      │    (API Key + Email)      │
│                                │                           │
│ MVP Tables:                    │ • @cf/baai/bge-base-en    │
│ • Source (bias labels)         │ • @cf/meta/llama-2-7b     │
│ • Article (embeddings)         │                           │
│ • Cluster (centroids)          │                           │
│ • DailyDigest (summaries)      │                           │
└────────────────────────────────┴───────────────────────────┘
```

---

# 📁 MVP PROJECT STRUCTURE

```
Axialnews-api/
├── src/
│   ├── services/
│   │   ├── rss-fetcher.service.ts    # Fetch RSS feeds
│   │   ├── embedding.service.ts       # Generate embeddings
│   │   ├── clustering.service.ts      # THE CORE
│   │   ├── heat-substance.service.ts  # Heat vs Substance scoring
│   │   ├── bias-analyzer.service.ts   # Strict schema output
│   │   ├── digest.service.ts          # Daily 60-second summary
│   │   └── cloudflare-ai.service.ts   # AI wrapper
│   │
│   ├── controllers/
│   │   ├── cluster.controller.ts      # GET /clusters, GET /clusters/:id
│   │   └── digest.controller.ts       # GET /digest/today
│   │
│   ├── jobs/
│   │   ├── feed-sync.job.ts           # Cron: fetch RSS every 30min
│   │   └── digest-gen.job.ts          # Cron: generate digest at midnight
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   └── index.ts
│
├── docs/
│   └── data-model.md                   # logical schema contract
├── migrations/                         # D1 SQL migrations
├── wrangler.toml                       # D1 + R1 bindings
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 🔑 MVP API ENDPOINTS

Only what the killer demo needs:

```typescript
// GET /clusters (Infinite Feed)
// Returns today's clusters with pagination
{
  cursor: "next-page-id",
  clusters: [
    {
      // ... cluster data ...
      id: "uuid",
      topic: "Biden Infrastructure Bill",
      articleCount: 15,
      // ...
      avgHeatScore: 0.4,
      avgSubstanceScore: 0.6,
      heatSubstanceLabel: "Balanced coverage.",
      lastArticleAt: "2024-01-15T10:30:00Z"
    }
  ]
}

// POST /collections (Save for Research)
// Creates a research bucket
{
  id: "col-123",
  title: "Crypto Regulation 2024",
  notifyUpdates: true
}

// GET /collections/:id
// Returns saved clusters + updates since last view
{
  title: "Crypto Regulation 2024",
  newUpdatesCount: 3,
  items: [
    {
      cluster: { ... },
      hasNewArticles: true
    }
  ]
}

// GET /clusters/:id
// Returns single cluster with all member articles
{
  cluster: { ... },
  articles: [
    {
      id: "uuid",
      title: "...",
      description: "...",
      link: "https://...",
      sourceName: "CNN",
      biasLabel: "left",
      heatScore: 0.3,
      substanceScore: 0.7
    }
  ]
}

// GET /digest/today
// Returns the daily 60-second summary
{
  date: "2024-01-15",
  summary: "Here's what happened today...",
  keyTopics: ["Infrastructure Bill", "Tech Layoffs", "Climate Summit"],
  audioUrl: null,
  closingLine: "You're caught up."
}
```

---

# ☁️ LOCAL DEV SETUP

```toml
# wrangler.toml
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

```bash
# Quick start
git clone https://github.com/yourusername/axialnews-api.git
cd axialnews-api
npm install
cp .env.example .env
# Edit .env with Cloudflare credentials
wrangler d1 migrations apply axialnews-d1 --local
wrangler dev
```

### PostgreSQL to D1 migration note
If data already exists in Postgres, migrate table data (`Source`, `Article`, `Cluster`, `DailyDigest`, `User`, `Collection`, `Bookmark`) into D1 with type conversions (`uuid`/`jsonb`/arrays/timestamps → D1-safe `TEXT` formats) and move vectors to a Cloudflare vector index or R1 JSON artifacts keyed by entity IDs.

### Cloudflare API token setup (ops)
Create a custom Cloudflare API token with at least: Workers Scripts:Edit, D1:Edit, Workers AI:Read, and (if used) Queues:Edit + Workers Routes:Edit for your zone/account scope.

---

# 🎯 MVP SUCCESS CRITERIA

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Daily digest opens | 70%+ of active users | Proves the habit loop works |
| Time to "You're caught up" | < 2 minutes | Users want closure, not infinity |
| Cluster accuracy | < 5% false merges | Trust depends on correct grouping |
| Bias Mirror usage | 30%+ click-through on clusters | Proves differentiation value |

---

# 🚫 WHAT WE ARE NOT BUILDING YET

These are explicitly **postponed** until MVP is validated:

| Feature | Why Postponed |
|---------|---------------|
| User preferences / personalization | Generic works until you have users |
| Interest vectors | Build after you have engagement data |
| TopicEntity graph | Cool visualization, add after search works |
| Attention Map | Dashboard porn, not product |
| Trend Radar | Can add after clusters work |
| Impact longevity 1-10 | LLM score nobody will trust |
| TTS audio | Add after text digest works |

**Rule: If it's not in the 20-second demo OR the Research loop, it doesn't ship.**

---

# 🎓 DESIGN PHILOSOPHY

## Two Modes: Daily Clarity + Research Depth

Axial.news serves **two user intents**:

| Mode | Intent | Behavior |
|------|--------|----------|
| **Daily Digest** | "What happened today?" | Quick, finite, calming |
| **Research Mode** | "I need to understand this deeper" | Infinite exploration, rabbit holes |

Both modes live on the same platform. The **daily digest** is the hook. **Research mode** is where they spend hours.

## Capture Attention → Enable Research → Bring Them Back

### 1. The Entry Point (Daily Hook)
- Daily digest notification ("Your 60-second briefing is ready")
- Push at consistent time (user's choice: morning/evening)
- Quick clusters overview: "12 stories, 3 developing"

### 2. The Rabbit Hole (Research Mode)
Every cluster opens infinite depth:
- **Related clusters**: "See also: [3 related ongoing stories]"
- **Timeline view**: How this story evolved over days/weeks
- **Source deep dive**: All coverage from a specific outlet
- **Bias comparison**: Full left vs right analysis
- **Semantic search**: Find similar past stories

### 3. The Bookmark System (Research Tool)
- Save clusters for later
- Create research collections ("Election Coverage", "Tech Layoffs")
- Export as report (PDF/markdown)
- Share collections with others

### 4. The Return Triggers
- "This story you bookmarked has 5 new developments"
- "A story similar to [saved cluster] is trending"
- Weekly summary email of saved topics
- "Your collection 'Election Coverage' has 12 new articles"

## Build Credibility by Being Visibly Uncertain

Every LLM output should carry:
- Confidence: High / Medium / Low
- Based on: X sources, Y regions, Z political labels
- Links (as references)

**This protects you when the model is wrong.**

## Heat vs Substance > "Manipulation Detection"

**Old design (preachy):**
> 🚨 "This headline uses 3 manipulative phrases"

**New design (intelligent):**
> Heat: ████████░░ (80%)
> Substance: ██░░░░░░░░ (20%)
> "High heat, low substance. Read skeptically."

That framing feels analytical, not moralizing.
Do it at the **cluster level**, not individual headline level.
You're not grading writers—you're mapping media behavior.

---

# 🚦 IMPLEMENTATION PHASES

## Phase 1: The Knife (2 weeks)

- [ ] Cloudflare Workers + D1 + R1 + Vector Index
- [ ] RSS fetcher (10 diverse sources)
- [ ] Embedding generation via Workers AI
- [ ] Basic clustering (similarity > 0.85)
- [ ] Heat vs Substance scoring

**Checkpoint**: Can you see 10 clusters with article counts?

## Phase 2: The Demo (2 weeks)

- [ ] Cluster summaries (LLM)
- [ ] Bias Mirror (strict JSON schema)
- [ ] Daily digest generation
- [ ] Basic frontend (clusters list → detail view)

**Checkpoint**: Can you run the 20-second demo?

## Phase 3: The Habit (2 weeks)

- [ ] Private beta with 50 people
- [ ] Track: Do they open it daily?
- [ ] Track: Do they share clusters?
- [ ] Track: Do they trust the summaries?
- [ ] Iterate based on feedback

**Checkpoint**: Do beta users form a daily habit?

---

# 💰 MVP COST

| Service | Monthly Cost |
|---------|--------------|
| Cloudflare Pages (frontend) | Free |
| Cloudflare Workers + D1 + R1 | Usage-based |
| Cloudflare Workers AI (50k req/day) | ~$15 |
| Domain (axial.news) | ~$1 |
| **Total** | **~$16+/month (usage-based)** |

---

# 🔮 FUTURE FEATURES (Post-MVP)

> **Only build these after proving product-market pull.**

Once users love the MVP, we can layer in:

---

## Auth & Personalization (V2)

**When to build**: After 1,000+ daily active users

We already have basic `User` for research collections. This phase adds rich profiles and preferences.

### Enhanced User Model
```prisma
// Extends existing User model
model UserProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  googleId        String?  @unique
  displayName     String?
  avatarUrl       String?
  lastLoginAt     DateTime @default(now())
}
```

### UserPreference Model
```prisma
model UserPreference {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Interest vector (learned from behavior)
  interestVector  Unsupported("vector(768)")?
  
  // Explicit preferences
  preferredTopics String[]
  blockedSources  String[]
  showBiasLabels  String[] @default(["left", "center", "right"])
  
  // UI preferences
  theme           String @default("system")
  digestTime      String @default("08:00")
}
```

---

## Trend Radar

**When to build**: After clustering accuracy > 95%

```prisma
model TrendSnapshot {
  id            String   @id @default(uuid())
  clusterId     String
  cluster       Cluster  @relation(fields: [clusterId], references: [id])
  
  articleCount  Int
  velocity      Float    // articleCount_now / articleCount_24h_ago
  noveltyScore  Float    // 10 - (hours_since_creation / 6)
  trendScore    Float    // velocity * (1 + noveltyScore/10)
  
  createdAt     DateTime @default(now())
}
```

```sql
-- Find emerging trends (velocity > 2x in last 24h)
SELECT c.topic, t.velocity, t."trendScore"
FROM "TrendSnapshot" t
JOIN "Cluster" c ON t."clusterId" = c.id
WHERE t."createdAt" > NOW() - INTERVAL '1 hour'
  AND t.velocity > 2.0
ORDER BY t."trendScore" DESC
LIMIT 10;
```

---

## TopicEntity Graph

**When to build**: After users search for topics regularly

```prisma
model TopicEntity {
  id            String   @id @default(uuid())
  name          String   @unique       // "Elon Musk"
  type          String                 // "person", "organization", "location"
  embedding     Unsupported("vector(768)")?
  mentionCount  Int      @default(1)
  lastMentionAt DateTime @default(now())
}

model ArticleEntity {
  id          String      @id @default(uuid())
  articleId   String
  entityId    String
  
  @@unique([articleId, entityId])
}
```

---

## Impact Longevity Score

**When to build**: After users request "what actually matters" filter

```typescript
// Add to Article model
impactScore: Float?  // 1-10, will this matter in 6 months?

// LLM prompt
const prompt = `
Rate this story's long-term impact on a scale of 1-10.
1 = Pure fluff, forgotten tomorrow
5 = Notable, but routine
10 = Historic, will be studied for years

Story: ${title}
${description}

Respond with only a number 1-10.
`;
```

---

## Attention Map Visualization

**When to build**: After having 6+ months of cluster data

Visual globe/map showing:
- What topics are getting attention by region
- Volume of coverage (bubble size)
- Velocity of change (color intensity)
- Click to drill into top clusters

---

## TTS Audio Digests

**When to build**: After text digest has 500+ daily opens

```typescript
// Options:
// 1. Cloudflare Workers AI TTS
// 2. ElevenLabs API
// 3. OpenAI TTS

// Store in DailyDigest:
audioUrl: String?
audioDuration: Int?  // seconds
```

---

## User Interaction Tracking

**When to build**: After auth is implemented

```prisma
model UserArticleInteraction {
  id              String   @id @default(uuid())
  userId          String
  articleId       String
  interactionType String   // "view", "click", "read", "bookmark", "share"
  readDuration    Int?     // seconds
  createdAt       DateTime @default(now())
  
  @@unique([userId, articleId, interactionType])
}
```

Use this to:
- Build user interest vectors
- Improve cluster ranking
- A/B test features

---

# 📋 MARKET POSITIONING

| Competitor | What They Do | Our Advantage |
|------------|--------------|---------------|
| **Feedly** | RSS reader with basic AI | No dedup, no bias mirror |
| **Ground News** | Bias ratings | Academic, no habit loop |
| **AllSides** | Left/right labeling | Manual curation, slow |
| **Artifact** | AI news (dead) | Required full articles |
| **Apple News** | Curated feed | No transparency, no closure |

**Nobody combines**: deduplication into clusters + bias mirror + daily closure ritual

---

# 🎯 THE UNCOMFORTABLE TRUTH

This will work if you stop acting like you're building a platform and start acting like you're building a product with **taste**.

Your biggest risk isn't technical. It's that you'll keep adding features because it **feels like progress**, and you'll ship nothing that feels **clean, obvious, and inevitable**.

---

> **The RDF Mantra:**
> 
> # Pick the demo. Cut the rest. Ship the knife.

---

*Axial.news: One daily moment of clarity.*
