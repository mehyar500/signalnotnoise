import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { query } from './db.js';
import { initSchema } from './schema.js';
import { seedSources } from './seed-sources.js';
import { syncAllFeeds, enrichClustersWithAI, generateDailyDigest } from './services/pipeline.js';
import { isAIAvailable } from './services/cloudflare-ai.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: isAIAvailable(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/clusters', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const cursor = req.query.cursor as string;

    let whereClause = 'WHERE c.is_active = true AND c.article_count >= 2';
    const params: unknown[] = [limit];

    if (cursor) {
      whereClause += ` AND c.last_article_at < (SELECT last_article_at FROM clusters WHERE id = $2)`;
      params.push(cursor);
    }

    const result = await query(
      `SELECT c.id, c.topic, c.topic_slug, c.representative_headline, c.summary,
              c.bias_analysis, c.avg_heat_score, c.avg_substance_score,
              c.article_count, c.source_count, c.left_count, c.center_count,
              c.right_count, c.international_count,
              c.first_article_at, c.last_article_at
       FROM clusters c
       ${whereClause}
       ORDER BY c.last_article_at DESC
       LIMIT $1`,
      params
    );

    const items = result.rows.map(formatCluster);
    const nextCursor = items.length === limit ? items[items.length - 1].id : null;

    res.json({ items, nextCursor });
  } catch (err) {
    console.error('[api] /clusters error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/clusters/:id', async (req, res) => {
  try {
    const clusterRes = await query(
      `SELECT c.id, c.topic, c.topic_slug, c.representative_headline, c.summary,
              c.bias_analysis, c.avg_heat_score, c.avg_substance_score,
              c.article_count, c.source_count, c.left_count, c.center_count,
              c.right_count, c.international_count,
              c.first_article_at, c.last_article_at
       FROM clusters c
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (clusterRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    const articlesRes = await query(
      `SELECT a.id, a.title, a.description, a.link, a.published_at,
              a.heat_score, a.substance_score,
              s.name as source_name, s.bias_label
       FROM articles a
       JOIN sources s ON a.source_id = s.id
       WHERE a.cluster_id = $1
       ORDER BY a.published_at DESC`,
      [req.params.id]
    );

    const cluster = formatCluster(clusterRes.rows[0]);
    cluster.articles = articlesRes.rows.map((a: Record<string, unknown>) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      link: a.link,
      publishedAt: a.published_at,
      sourceName: a.source_name,
      biasLabel: a.bias_label,
      heatScore: a.heat_score || 0,
      substanceScore: a.substance_score || 0,
    }));

    res.json(cluster);
  } catch (err) {
    console.error('[api] /clusters/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/digest', async (_req, res) => {
  try {
    const result = await query(
      `SELECT * FROM daily_digests ORDER BY digest_date DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    const d = result.rows[0];
    res.json({
      id: d.id,
      digestDate: d.digest_date,
      summary: d.summary,
      keyTopics: d.key_topics || [],
      closingLine: d.closing_line,
      clusterCount: d.cluster_count,
      articleCount: d.article_count,
    });
  } catch (err) {
    console.error('[api] /digest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/stats', async (_req, res) => {
  try {
    const sources = await query(`SELECT COUNT(*) as count FROM sources WHERE is_active = true`);
    const articles = await query(`SELECT COUNT(*) as count FROM articles`);
    const clusters = await query(`SELECT COUNT(*) as count FROM clusters WHERE is_active = true`);
    const recent = await query(`SELECT COUNT(*) as count FROM articles WHERE fetched_at > NOW() - INTERVAL '24 hours'`);

    res.json({
      activeSources: parseInt(sources.rows[0].count),
      totalArticles: parseInt(articles.rows[0].count),
      activeClusters: parseInt(clusters.rows[0].count),
      articlesLast24h: parseInt(recent.rows[0].count),
      aiAvailable: isAIAvailable(),
    });
  } catch (err) {
    console.error('[api] /stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/admin/sync', async (_req, res) => {
  try {
    const result = await syncAllFeeds();
    res.json(result);
  } catch (err) {
    console.error('[api] /admin/sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.post('/api/v1/admin/enrich', async (_req, res) => {
  try {
    const count = await enrichClustersWithAI();
    res.json({ enriched: count });
  } catch (err) {
    console.error('[api] /admin/enrich error:', err);
    res.status(500).json({ error: 'Enrichment failed' });
  }
});

app.post('/api/v1/admin/digest', async (_req, res) => {
  try {
    const created = await generateDailyDigest();
    res.json({ created });
  } catch (err) {
    console.error('[api] /admin/digest error:', err);
    res.status(500).json({ error: 'Digest generation failed' });
  }
});

function formatCluster(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    topic: row.topic as string || row.representative_headline as string || 'Developing Story',
    topicSlug: row.topic_slug as string || '',
    representativeHeadline: row.representative_headline as string || '',
    summary: row.summary as string || '',
    biasAnalysis: (row.bias_analysis as Record<string, string>) || {
      leftEmphasizes: 'Analysis pending.',
      rightEmphasizes: 'Analysis pending.',
      consistentAcrossAll: 'Analysis pending.',
      whatsMissing: 'Analysis pending.',
    },
    heatScore: (row.avg_heat_score as number) || 0,
    substanceScore: (row.avg_substance_score as number) || 0,
    articleCount: (row.article_count as number) || 0,
    sourceCount: (row.source_count as number) || 0,
    sourceBreakdown: {
      left: (row.left_count as number) || 0,
      center: (row.center_count as number) || 0,
      right: (row.right_count as number) || 0,
      international: (row.international_count as number) || 0,
    },
    firstArticleAt: row.first_article_at as string,
    lastArticleAt: row.last_article_at as string,
    articles: [],
  };
}

async function startServer() {
  console.log('[server] Initializing database...');
  await initSchema();

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[server] API running on http://localhost:${PORT}`);
  });

  (async () => {
    try {

      const sourcesCount = await query(`SELECT COUNT(*) as count FROM sources`);
      if (parseInt(sourcesCount.rows[0].count) === 0) {
        console.log('[server] No sources found, seeding...');
        await seedSources();
      } else {
        console.log(`[server] ${sourcesCount.rows[0].count} sources already in database`);
      }

      cron.schedule('*/30 * * * *', async () => {
        console.log('[cron] Running scheduled feed sync...');
        try {
          await syncAllFeeds();
          if (isAIAvailable()) {
            await enrichClustersWithAI();
          }
        } catch (err) {
          console.error('[cron] Sync error:', err);
        }
      });

      cron.schedule('0 6 * * *', async () => {
        console.log('[cron] Running daily digest generation...');
        try {
          await generateDailyDigest();
        } catch (err) {
          console.error('[cron] Digest error:', err);
        }
      });

      console.log('[server] Cron jobs scheduled: feed sync every 30min, digest daily at 6am');

      console.log('[server] Running initial feed sync...');
      await syncAllFeeds();
      await generateDailyDigest();
      if (isAIAvailable()) {
        await enrichClustersWithAI();
      }
      console.log('[server] Initial sync complete');
    } catch (err) {
      console.error('[server] Background init error:', err);
    }
  })();
}

startServer().catch(err => {
  console.error('[server] Startup failed:', err);
  process.exit(1);
});
