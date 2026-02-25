import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';
import { initSchema } from './schema.js';
import { seedSources } from './seed-sources.js';
import { syncAllFeeds, enrichClustersWithAI, generateDailyDigest } from './services/pipeline.js';
import { isAIAvailable, chat } from './services/cloudflare-ai.js';
import { validateFeed } from './services/feed-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const IS_PROD = process.env.NODE_ENV === 'production';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';
const JWT_SECRET = process.env.JWT_SECRET || 'axial-news-jwt-secret-key-2026';


function getUserIdFromRequest(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function requireAdmin(req: express.Request, res: express.Response): Promise<string | null> {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const result = await query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return null;
    }
    return userId;
  } catch (err) {
    console.error('[auth] requireAdmin error:', err);
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
}

app.use(cors());
app.use(express.json());

const distPath = path.resolve(__dirname, '..', 'dist');
if (IS_PROD && existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: isAIAvailable(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userCount = await query('SELECT COUNT(*) as cnt FROM users');
    const isFirstUser = parseInt(userCount.rows[0].cnt) === 0;

    const result = await query(
      'INSERT INTO users (id, email, password_hash, display_name, is_admin, created_at, last_active_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, display_name, is_admin',
      [email.toLowerCase().trim(), hash, displayName || null, isFirstUser]
    );
    if (isFirstUser) console.log(`[auth] First user ${email} registered as admin`);

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      user: { id: user.id, email: user.email, displayName: user.display_name, isAdmin: user.is_admin },
      token,
    });
  } catch (err) {
    console.error('[api] signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT id, email, display_name, password_hash, is_admin FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: { id: user.id, email: user.email, displayName: user.display_name, isAdmin: user.is_admin || false },
      token,
    });
  } catch (err) {
    console.error('[api] signin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/auth/me', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const result = await query('SELECT id, email, display_name, is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({ id: u.id, email: u.email, displayName: u.display_name, isAdmin: u.is_admin || false });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    const bias = req.query.bias as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    if (!q && !bias) {
      return res.status(400).json({ error: 'Search query (q) or bias filter required' });
    }

    let whereClause = 'WHERE c.is_active = true AND c.article_count >= 2';
    const params: unknown[] = [limit];
    let paramIdx = 2;

    if (q) {
      whereClause += ` AND (c.representative_headline ILIKE $${paramIdx} OR c.topic ILIKE $${paramIdx} OR c.summary ILIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }

    if (bias && ['left', 'center-left', 'center', 'center-right', 'right', 'international'].includes(bias)) {
      if (bias === 'left' || bias === 'center-left') {
        whereClause += ` AND c.left_count > 0`;
      } else if (bias === 'right' || bias === 'center-right') {
        whereClause += ` AND c.right_count > 0`;
      } else if (bias === 'center') {
        whereClause += ` AND c.center_count > 0`;
      } else if (bias === 'international') {
        whereClause += ` AND c.international_count > 0`;
      }
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

    res.json({ items: result.rows.map(formatCluster) });
  } catch (err) {
    console.error('[api] /search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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

app.get('/api/v1/clusters/blindspot', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await query(
      `SELECT c.id, c.topic, c.topic_slug, c.representative_headline, c.summary,
              c.bias_analysis, c.avg_heat_score, c.avg_substance_score,
              c.article_count, c.source_count, c.left_count, c.center_count,
              c.right_count, c.international_count,
              c.first_article_at, c.last_article_at,
              (SELECT a.image_url FROM articles a WHERE a.cluster_id = c.id AND a.image_url IS NOT NULL ORDER BY a.published_at DESC LIMIT 1) as hero_image
       FROM clusters c
       WHERE c.is_active = true AND c.article_count >= 2
         AND (
           (c.left_count + c.center_count + c.right_count + c.international_count) >= 3
           AND (
             c.left_count::float / GREATEST(c.left_count + c.center_count + c.right_count + c.international_count, 1) > 0.7
             OR c.center_count::float / GREATEST(c.left_count + c.center_count + c.right_count + c.international_count, 1) > 0.7
             OR c.right_count::float / GREATEST(c.left_count + c.center_count + c.right_count + c.international_count, 1) > 0.7
             OR c.left_count = 0 OR c.center_count = 0 OR c.right_count = 0
           )
         )
       ORDER BY c.last_article_at DESC
       LIMIT $1`,
      [limit]
    );

    const items = result.rows.map(formatCluster);
    res.json({ items, total: items.length });
  } catch (err) {
    console.error('[api] /clusters/blindspot error:', err);
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

app.get('/api/v1/collections', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Sign in to access collections' });
  try {
    const result = await query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              COUNT(b.id) as bookmark_count,
              MAX(b.created_at) as last_bookmark_at
       FROM collections c
       LEFT JOIN bookmarks b ON b.collection_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
      [userId]
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
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Sign in to create collections' });
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await query(
      `INSERT INTO collections (id, title, user_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       RETURNING id, title, created_at, updated_at`,
      [title.trim(), userId]
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
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Sign in to access collections' });
  try {
    const collectionRes = await query(
      `SELECT id, title, created_at, updated_at FROM collections WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
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
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Sign in required' });
  try {
    await query(`DELETE FROM bookmarks WHERE collection_id = $1`, [req.params.id]);
    const result = await query(
      `DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, userId]
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
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.json([]);
  try {
    const result = await query(
      `SELECT b.id, b.collection_id, c.title as collection_title
       FROM bookmarks b
       JOIN collections c ON b.collection_id = c.id
       WHERE b.cluster_id = $1 AND c.user_id = $2`,
      [req.params.clusterId, userId]
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

app.get('/api/v1/admin/sources', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const result = await query(
      `SELECT id, name, sub_source, feed_url, bias_label, is_active, last_fetched_at, created_at
       FROM sources ORDER BY created_at DESC`
    );
    res.json({ sources: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('[api] /admin/sources error:', err);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

app.post('/api/v1/admin/sources', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { name, feedUrl, biasLabel, subSource } = req.body;
    if (!name || !feedUrl) {
      return res.status(400).json({ error: 'name and feedUrl are required' });
    }

    const existing = await query('SELECT id FROM sources WHERE feed_url = $1', [feedUrl]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Feed URL already exists', existingId: existing.rows[0].id });
    }

    console.log(`[admin] Validating feed: ${feedUrl}`);
    const validation = await validateFeed(feedUrl);
    if (!validation.valid) {
      return res.status(422).json({
        error: 'Feed validation failed - could not parse RSS',
        detail: validation.error,
        url: feedUrl,
      });
    }

    const result = await query(
      `INSERT INTO sources (name, sub_source, feed_url, bias_label, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING id, name, feed_url, bias_label, is_active`,
      [name, subSource || null, feedUrl, biasLabel || 'center']
    );

    console.log(`[admin] Added source: ${name} (${feedUrl}) - ${validation.itemCount} items found`);
    res.json({ source: result.rows[0], validation });
  } catch (err) {
    console.error('[api] /admin/sources POST error:', err);
    res.status(500).json({ error: 'Failed to add source' });
  }
});

app.post('/api/v1/admin/sources/bulk', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { sources } = req.body;
    if (!Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'sources array is required' });
    }

    const results: { name: string; url: string; status: string; error?: string; itemCount?: number }[] = [];
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const src of sources) {
      const { name, feedUrl, biasLabel, subSource } = src;
      if (!name || !feedUrl) {
        results.push({ name: name || 'unknown', url: feedUrl || '', status: 'error', error: 'Missing name or feedUrl' });
        failed++;
        continue;
      }

      const existing = await query('SELECT id FROM sources WHERE feed_url = $1', [feedUrl]);
      if (existing.rows.length > 0) {
        results.push({ name, url: feedUrl, status: 'skipped', error: 'Already exists' });
        skipped++;
        continue;
      }

      const validation = await validateFeed(feedUrl);
      if (!validation.valid) {
        results.push({ name, url: feedUrl, status: 'failed', error: validation.error || 'Invalid feed' });
        failed++;
        continue;
      }

      await query(
        `INSERT INTO sources (name, sub_source, feed_url, bias_label, is_active)
         VALUES ($1, $2, $3, $4, true) ON CONFLICT (feed_url) DO NOTHING`,
        [name, subSource || null, feedUrl, biasLabel || 'center']
      );

      results.push({ name, url: feedUrl, status: 'inserted', itemCount: validation.itemCount });
      inserted++;
    }

    console.log(`[admin] Bulk import: ${inserted} inserted, ${skipped} skipped, ${failed} failed`);
    res.json({ inserted, skipped, failed, total: sources.length, results });
  } catch (err) {
    console.error('[api] /admin/sources/bulk error:', err);
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

app.post('/api/v1/admin/sources/import-file', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { filePath, biasMap } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    let data: Array<{ fields: { source: string; sub_source: string; url: string; active: boolean } }>;
    try {
      const raw = readFileSync(filePath, 'utf-8');
      data = JSON.parse(raw);
    } catch (err) {
      return res.status(400).json({ error: 'Could not read file', detail: (err as Error).message });
    }

    const biasLookup: Record<string, string> = biasMap || {};
    const results: { name: string; url: string; status: string; error?: string; itemCount?: number }[] = [];
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of data) {
      const { source, sub_source, url } = entry.fields;
      const displayName = source.charAt(0).toUpperCase() + source.slice(1);

      const existing = await query('SELECT id FROM sources WHERE feed_url = $1', [url]);
      if (existing.rows.length > 0) {
        results.push({ name: displayName, url, status: 'skipped', error: 'Already exists' });
        skipped++;
        continue;
      }

      const validation = await validateFeed(url);
      if (!validation.valid) {
        results.push({ name: displayName, url, status: 'failed', error: validation.error || 'Invalid feed' });
        failed++;
        continue;
      }

      const bias = biasLookup[source.toLowerCase()] || 'international';

      await query(
        `INSERT INTO sources (name, sub_source, feed_url, bias_label, is_active)
         VALUES ($1, $2, $3, $4, true) ON CONFLICT (feed_url) DO NOTHING`,
        [displayName, sub_source, url, bias]
      );

      results.push({ name: displayName, url, status: 'inserted', itemCount: validation.itemCount });
      inserted++;
    }

    console.log(`[admin] File import from ${filePath}: ${inserted} inserted, ${skipped} skipped, ${failed} failed`);
    res.json({ inserted, skipped, failed, total: data.length, results });
  } catch (err) {
    console.error('[api] /admin/sources/import-file error:', err);
    res.status(500).json({ error: 'File import failed' });
  }
});

app.patch('/api/v1/admin/sources/:id', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { id } = req.params;
    const { name, biasLabel, isActive } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (name !== undefined) { updates.push(`name = $${paramIdx++}`); values.push(name); }
    if (biasLabel !== undefined) { updates.push(`bias_label = $${paramIdx++}`); values.push(biasLabel); }
    if (isActive !== undefined) { updates.push(`is_active = $${paramIdx++}`); values.push(isActive); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE sources SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }

    res.json({ source: result.rows[0] });
  } catch (err) {
    console.error('[api] /admin/sources/:id PATCH error:', err);
    res.status(500).json({ error: 'Failed to update source' });
  }
});

app.delete('/api/v1/admin/sources/:id', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM sources WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json({ deleted: true, source: result.rows[0] });
  } catch (err) {
    console.error('[api] /admin/sources/:id DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

app.post('/api/v1/admin/sources/validate', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { feedUrl } = req.body;
    if (!feedUrl) return res.status(400).json({ error: 'feedUrl is required' });
    const validation = await validateFeed(feedUrl);
    res.json(validation);
  } catch (err) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.post('/api/v1/admin/sources/analyze', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const { feedUrl } = req.body;
    if (!feedUrl) return res.status(400).json({ error: 'feedUrl is required' });

    const validation = await validateFeed(feedUrl);
    if (!validation.valid) {
      return res.json({ valid: false, error: validation.error });
    }

    let aiAnalysis = null;
    if (isAIAvailable() && validation.sampleHeadlines && validation.sampleHeadlines.length > 0) {
      try {
        const headlines = validation.sampleHeadlines.slice(0, 8).join('\n- ');
        const prompt = `Analyze this RSS news feed. Feed title: "${validation.title}". Sample headlines:\n- ${headlines}\n\nRespond ONLY with valid JSON (no markdown):\n{"suggestedName":"short source name","summary":"1 sentence describing what this source covers","biasLabel":"one of: left, center-left, center, center-right, right, international","biasReasoning":"1 sentence explaining the bias assessment","contentType":"news, opinion, analysis, or mixed","region":"geographic focus e.g. US, UK, Global, etc"}`;
        const response = await chat(prompt, 'You analyze news sources and output only valid JSON. Be objective about political bias based on editorial patterns.');
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (aiErr) {
        console.error('[admin] AI analysis failed:', aiErr);
      }
    }

    const existing = await query('SELECT id FROM sources WHERE feed_url = $1', [feedUrl]);

    res.json({
      valid: true,
      feedTitle: validation.title,
      itemCount: validation.itemCount,
      sampleHeadlines: validation.sampleHeadlines || [],
      alreadyExists: existing.rows.length > 0,
      existingId: existing.rows[0]?.id || null,
      aiAnalysis,
    });
  } catch (err) {
    console.error('[api] /admin/sources/analyze error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.post('/api/v1/admin/sources/smart-bulk', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function sendEvent(data: Record<string, unknown>) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const { sources } = req.body;
    if (!Array.isArray(sources) || sources.length === 0) {
      sendEvent({ type: 'error', message: 'sources array is required' });
      res.end();
      return;
    }

    sendEvent({ type: 'start', total: sources.length, message: `Processing ${sources.length} sources...` });

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const { name, feedUrl, biasLabel, subSource } = src;
      const idx = i + 1;

      if (!feedUrl) {
        sendEvent({ type: 'result', index: idx, name: name || 'Unknown', status: 'failed', error: 'Missing feedUrl' });
        failed++;
        continue;
      }

      sendEvent({ type: 'progress', index: idx, name: name || feedUrl, step: 'checking', message: `[${idx}/${sources.length}] Checking ${name || feedUrl}...` });

      const existing = await query('SELECT id FROM sources WHERE feed_url = $1', [feedUrl]);
      if (existing.rows.length > 0) {
        sendEvent({ type: 'result', index: idx, name: name || feedUrl, status: 'skipped', message: 'Already exists' });
        skipped++;
        continue;
      }

      sendEvent({ type: 'progress', index: idx, name: name || feedUrl, step: 'validating', message: `[${idx}/${sources.length}] Validating RSS feed...` });

      const validation = await validateFeed(feedUrl);
      if (!validation.valid) {
        sendEvent({ type: 'result', index: idx, name: name || feedUrl, status: 'failed', error: `Invalid feed: ${validation.error}` });
        failed++;
        continue;
      }

      let finalBias = biasLabel || 'center';
      let finalName = name || validation.title || feedUrl;
      let aiInfo = null;

      if (isAIAvailable() && !biasLabel && validation.sampleHeadlines && validation.sampleHeadlines.length > 0) {
        sendEvent({ type: 'progress', index: idx, name: finalName, step: 'ai-analyzing', message: `[${idx}/${sources.length}] AI analyzing bias for ${finalName}...` });
        try {
          const headlines = validation.sampleHeadlines.slice(0, 6).join('\n- ');
          const prompt = `Analyze this RSS feed. Title: "${validation.title}". Headlines:\n- ${headlines}\n\nRespond ONLY with JSON: {"biasLabel":"left|center-left|center|center-right|right|international","suggestedName":"short name","reasoning":"1 sentence"}`;
          const response = await chat(prompt, 'Output only valid JSON.');
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiInfo = JSON.parse(jsonMatch[0]);
            if (aiInfo.biasLabel) finalBias = aiInfo.biasLabel;
            if (aiInfo.suggestedName && !name) finalName = aiInfo.suggestedName;
          }
        } catch {
          // AI failed, use defaults
        }
      }

      sendEvent({ type: 'progress', index: idx, name: finalName, step: 'inserting', message: `[${idx}/${sources.length}] Inserting ${finalName} (${finalBias})...` });

      try {
        await query(
          `INSERT INTO sources (name, sub_source, feed_url, bias_label, is_active) VALUES ($1, $2, $3, $4, true)`,
          [finalName, subSource || null, feedUrl, finalBias]
        );
        sendEvent({
          type: 'result', index: idx, name: finalName, status: 'inserted',
          bias: finalBias, itemCount: validation.itemCount,
          aiReasoning: aiInfo?.reasoning || null,
          message: `Added ${finalName} (${finalBias}, ${validation.itemCount} items)`
        });
        inserted++;
      } catch (insertErr) {
        sendEvent({ type: 'result', index: idx, name: finalName, status: 'failed', error: 'Database insert failed' });
        failed++;
      }
    }

    sendEvent({ type: 'complete', inserted, skipped, failed, total: sources.length, message: `Done: ${inserted} added, ${skipped} skipped, ${failed} failed` });
    res.end();
  } catch (err) {
    console.error('[api] /admin/sources/smart-bulk error:', err);
    sendEvent({ type: 'error', message: 'Bulk import failed' });
    res.end();
  }
});

app.get('/api/v1/admin/pipeline-status', async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  try {
    const [
      sourcesResult,
      articlesResult,
      clustersResult,
      articles24hResult,
      digestResult,
      lastFetchResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM sources WHERE is_active = true'),
      query('SELECT COUNT(*) as count FROM articles'),
      query('SELECT COUNT(*) as count FROM clusters WHERE last_article_at > NOW() - INTERVAL \'7 days\''),
      query('SELECT COUNT(*) as count FROM articles WHERE fetched_at > NOW() - INTERVAL \'24 hours\''),
      query('SELECT digest_date, created_at FROM daily_digests ORDER BY created_at DESC LIMIT 1'),
      query('SELECT MAX(last_fetched_at) as last_fetch FROM sources'),
    ]);

    const now = new Date();
    const currentMinute = now.getMinutes();
    const nextSyncMinutes = currentMinute < 30 ? 30 - currentMinute : 60 - currentMinute;
    const nextSync = new Date(now.getTime() + nextSyncMinutes * 60000);

    const nextDigest = new Date(now);
    nextDigest.setUTCHours(6, 0, 0, 0);
    if (nextDigest <= now) nextDigest.setDate(nextDigest.getDate() + 1);

    res.json({
      activeSources: parseInt(sourcesResult.rows[0].count),
      totalArticles: parseInt(articlesResult.rows[0].count),
      activeClusters: parseInt(clustersResult.rows[0].count),
      articlesLast24h: parseInt(articles24hResult.rows[0].count),
      aiAvailable: isAIAvailable(),
      lastDigest: digestResult.rows[0] ? {
        date: digestResult.rows[0].digest_date,
        createdAt: digestResult.rows[0].created_at,
      } : null,
      lastFetchAt: lastFetchResult.rows[0]?.last_fetch || null,
      schedules: {
        feedSync: { interval: 'Every 30 minutes', nextRun: nextSync.toISOString() },
        dailyDigest: { interval: 'Daily at 6:00 AM UTC', nextRun: nextDigest.toISOString() },
      },
    });
  } catch (err) {
    console.error('[api] /admin/pipeline-status error:', err);
    res.status(500).json({ error: 'Failed to get pipeline status' });
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

if (IS_PROD && existsSync(distPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function startServer() {
  console.log('[server] Initializing database...');
  await initSchema();

  const host = IS_PROD ? '0.0.0.0' : '127.0.0.1';
  app.listen(PORT, host, () => {
    console.log(`[server] API running on http://${host}:${PORT} (${IS_PROD ? 'production' : 'development'})`);
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
