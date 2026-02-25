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
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

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
              c.first_article_at, c.last_article_at,
              (SELECT a.image_url FROM articles a WHERE a.cluster_id = c.id AND a.image_url IS NOT NULL ORDER BY a.published_at DESC LIMIT 1) as hero_image
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
              c.first_article_at, c.last_article_at,
              (SELECT a.image_url FROM articles a WHERE a.cluster_id = c.id AND a.image_url IS NOT NULL ORDER BY a.published_at DESC LIMIT 1) as hero_image
       FROM clusters c
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (clusterRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    const articlesRes = await query(
      `SELECT a.id, a.title, a.description, a.link, a.image_url, a.published_at,
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
      imageUrl: a.image_url || null,
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

async function ensureDefaultUser() {
  const existing = await query(`SELECT id FROM users WHERE id = $1`, [DEFAULT_USER_ID]);
  if (existing.rows.length === 0) {
    await query(
      `INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_USER_ID, 'default@axial.news']
    );
  }
}

app.get('/api/v1/collections', async (_req, res) => {
  try {
    await ensureDefaultUser();
    const result = await query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              COUNT(b.id) as bookmark_count,
              MAX(b.created_at) as last_bookmark_at
       FROM collections c
       LEFT JOIN bookmarks b ON b.collection_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
      [DEFAULT_USER_ID]
    );

    res.json(result.rows.map(r => ({
      id: r.id,
      title: r.title,
      bookmarkCount: parseInt(r.bookmark_count) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lastBookmarkAt: r.last_bookmark_at,
    })));
  } catch (err) {
    console.error('[api] /collections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/collections', async (req, res) => {
  try {
    await ensureDefaultUser();
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await query(
      `INSERT INTO collections (id, title, user_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       RETURNING id, title, created_at, updated_at`,
      [title.trim(), DEFAULT_USER_ID]
    );

    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      title: r.title,
      bookmarkCount: 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  } catch (err) {
    console.error('[api] POST /collections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/collections/:id', async (req, res) => {
  try {
    const collectionRes = await query(
      `SELECT id, title, created_at, updated_at FROM collections WHERE id = $1 AND user_id = $2`,
      [req.params.id, DEFAULT_USER_ID]
    );

    if (collectionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const bookmarksRes = await query(
      `SELECT b.id as bookmark_id, b.note, b.created_at as bookmarked_at,
              c.id, c.topic, c.topic_slug, c.representative_headline, c.summary,
              c.bias_analysis, c.avg_heat_score, c.avg_substance_score,
              c.article_count, c.source_count, c.left_count, c.center_count,
              c.right_count, c.international_count,
              c.first_article_at, c.last_article_at
       FROM bookmarks b
       JOIN clusters c ON b.cluster_id = c.id
       WHERE b.collection_id = $1
       ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    const col = collectionRes.rows[0];
    res.json({
      id: col.id,
      title: col.title,
      createdAt: col.created_at,
      updatedAt: col.updated_at,
      bookmarks: bookmarksRes.rows.map(r => ({
        bookmarkId: r.bookmark_id,
        note: r.note,
        bookmarkedAt: r.bookmarked_at,
        cluster: formatCluster(r),
      })),
    });
  } catch (err) {
    console.error('[api] /collections/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/collections/:id', async (req, res) => {
  try {
    await query(`DELETE FROM bookmarks WHERE collection_id = $1`, [req.params.id]);
    const result = await query(
      `DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, DEFAULT_USER_ID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('[api] DELETE /collections/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/bookmarks', async (req, res) => {
  try {
    const { clusterId, collectionId, note } = req.body;
    if (!clusterId || !collectionId) {
      return res.status(400).json({ error: 'clusterId and collectionId are required' });
    }

    const existing = await query(
      `SELECT id FROM bookmarks WHERE collection_id = $1 AND cluster_id = $2`,
      [collectionId, clusterId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already bookmarked', bookmarkId: existing.rows[0].id });
    }

    const result = await query(
      `INSERT INTO bookmarks (id, collection_id, cluster_id, note, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, collection_id, cluster_id, note, created_at`,
      [collectionId, clusterId, note || null]
    );

    const b = result.rows[0];
    await query(`UPDATE collections SET updated_at = NOW() WHERE id = $1`, [collectionId]);

    res.status(201).json({
      id: b.id,
      collectionId: b.collection_id,
      clusterId: b.cluster_id,
      note: b.note,
      createdAt: b.created_at,
    });
  } catch (err) {
    console.error('[api] POST /bookmarks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/bookmarks/:id', async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM bookmarks WHERE id = $1 RETURNING id, collection_id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await query(`UPDATE collections SET updated_at = NOW() WHERE id = $1`, [result.rows[0].collection_id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[api] DELETE /bookmarks/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/bookmarks/check/:clusterId', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.collection_id, c.title as collection_title
       FROM bookmarks b
       JOIN collections c ON b.collection_id = c.id
       WHERE b.cluster_id = $1 AND c.user_id = $2`,
      [req.params.clusterId, DEFAULT_USER_ID]
    );

    res.json(result.rows.map(r => ({
      bookmarkId: r.id,
      collectionId: r.collection_id,
      collectionTitle: r.collection_title,
    })));
  } catch (err) {
    console.error('[api] /bookmarks/check error:', err);
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
    heroImage: (row.hero_image as string) || null,
    firstArticleAt: row.first_article_at as string,
    lastArticleAt: row.last_article_at as string,
    articles: [] as Record<string, unknown>[],
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
