import { query } from '../db.js';
import { fetchFeed } from './rss-fetcher.js';
import { analyzeHeatSubstance } from './heat-substance.js';
import { assignToCluster, updateClusterStats } from './clustering.js';
import {
  isAIAvailable,
  generateClusterSummary,
  generateBiasAnalysis,
  generateDigestSummary,
} from './cloudflare-ai.js';

export async function syncAllFeeds(): Promise<{ fetched: number; new: number; errors: number }> {
  console.log('[pipeline] Starting feed sync...');
  const sourcesRes = await query(`SELECT id, name, feed_url, bias_label FROM sources WHERE is_active = true`);
  const sources = sourcesRes.rows;
  console.log(`[pipeline] Found ${sources.length} active sources`);

  let totalFetched = 0;
  let totalNew = 0;
  let totalErrors = 0;

  for (const source of sources) {
    try {
      const items = await fetchFeed(source.feed_url);
      totalFetched += items.length;

      for (const item of items) {
        try {
          const exists = await query(`SELECT id FROM articles WHERE link = $1`, [item.link]);
          if (exists.rows.length > 0) continue;

          const text = `${item.title} ${item.description}`;
          const { heat, substance } = analyzeHeatSubstance(text);

          const keywords = extractKeywords(text);

          const pubDate = new Date(item.pubDate);
          const validDate = isNaN(pubDate.getTime()) ? new Date() : pubDate;

          const artRes = await query(
            `INSERT INTO articles (source_id, title, description, link, image_url, published_at, heat_score, substance_score, keywords)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (link) DO NOTHING
             RETURNING id`,
            [source.id, item.title, item.description, item.link, item.imageUrl, validDate.toISOString(), heat, substance, keywords]
          );

          if (artRes.rows.length > 0) {
            totalNew++;
            const articleId = artRes.rows[0].id;
            await assignToCluster(articleId, item.title, item.description, validDate.toISOString(), source.id);
            await query(`UPDATE articles SET is_processed = true WHERE id = $1`, [articleId]);
          }
        } catch (err) {
          totalErrors++;
          if ((err as Error).message?.includes('duplicate key')) continue;
          console.error(`[pipeline] Error processing article "${item.title?.slice(0, 50)}":`, (err as Error).message);
        }
      }

      await query(`UPDATE sources SET last_fetched_at = NOW() WHERE id = $1`, [source.id]);
    } catch (err) {
      totalErrors++;
      console.error(`[pipeline] Error fetching source ${source.name}/${source.feed_url}:`, (err as Error).message);
    }
  }

  console.log(`[pipeline] Sync complete: fetched=${totalFetched}, new=${totalNew}, errors=${totalErrors}`);
  return { fetched: totalFetched, new: totalNew, errors: totalErrors };
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'was', 'one', 'our', 'has', 'have', 'been', 'from', 'this', 'that',
    'with', 'they', 'will', 'each', 'make', 'like', 'than', 'them', 'then',
    'what', 'when', 'who', 'how', 'said', 'its', 'also', 'into', 'just',
    'about', 'more', 'some', 'very', 'would', 'could', 'should', 'their',
    'which', 'there', 'other', 'were', 'after', 'being', 'those', 'does',
    'here', 'says', 'news', 'over', 'only', 'still',
  ]);

  const freq = new Map<string, number>();
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
}

export async function enrichClustersWithAI(): Promise<number> {
  if (!isAIAvailable()) {
    console.log('[pipeline] Cloudflare AI not configured, skipping enrichment');
    return 0;
  }

  console.log('[pipeline] Starting AI enrichment...');

  const clustersRes = await query(`
    SELECT c.id, c.topic, c.article_count, c.summary
    FROM clusters c
    WHERE c.is_active = true
      AND c.article_count >= 3
      AND c.summary IS NULL
    ORDER BY c.article_count DESC
    LIMIT 10
  `);

  let enriched = 0;

  for (const cluster of clustersRes.rows) {
    try {
      const articlesRes = await query(
        `SELECT a.title, a.description, s.bias_label
         FROM articles a
         JOIN sources s ON a.source_id = s.id
         WHERE a.cluster_id = $1
         ORDER BY a.published_at DESC
         LIMIT 10`,
        [cluster.id]
      );

      const articles = articlesRes.rows;
      const headlines = articles.map((a: { title: string }) => a.title);
      const descriptions = articles.map((a: { description: string }) => a.description || '');

      const summary = await generateClusterSummary(headlines, descriptions);

      const leftArts = articles
        .filter((a: { bias_label: string }) => ['left', 'center-left'].includes(a.bias_label))
        .map((a: { title: string; description: string }) => `${a.title}: ${a.description?.slice(0, 150) || ''}`);
      const centerArts = articles
        .filter((a: { bias_label: string }) => a.bias_label === 'center')
        .map((a: { title: string; description: string }) => `${a.title}: ${a.description?.slice(0, 150) || ''}`);
      const rightArts = articles
        .filter((a: { bias_label: string }) => ['right', 'center-right'].includes(a.bias_label))
        .map((a: { title: string; description: string }) => `${a.title}: ${a.description?.slice(0, 150) || ''}`);

      const biasAnalysis = await generateBiasAnalysis(
        cluster.topic || headlines[0],
        leftArts,
        centerArts,
        rightArts
      );

      await query(
        `UPDATE clusters SET summary = $1, bias_analysis = $2, summary_generated_at = NOW() WHERE id = $3`,
        [summary, JSON.stringify(biasAnalysis), cluster.id]
      );

      enriched++;
      console.log(`[pipeline] Enriched cluster: ${cluster.topic?.slice(0, 50)}`);
    } catch (err) {
      console.error(`[pipeline] AI enrichment error for cluster ${cluster.id}:`, (err as Error).message);
    }
  }

  console.log(`[pipeline] Enrichment complete: ${enriched} clusters enriched`);
  return enriched;
}

export async function generateDailyDigest(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const existsRes = await query(`SELECT id FROM daily_digests WHERE digest_date = $1`, [today]);
  if (existsRes.rows.length > 0) {
    console.log('[pipeline] Digest already exists for today');
    return false;
  }

  const clustersRes = await query(`
    SELECT topic, summary, article_count
    FROM clusters
    WHERE is_active = true AND last_article_at > NOW() - INTERVAL '24 hours'
    ORDER BY article_count DESC
    LIMIT 10
  `);

  if (clustersRes.rows.length === 0) {
    console.log('[pipeline] No clusters for digest');
    return false;
  }

  const totals = await query(`
    SELECT COUNT(DISTINCT c.id) as cluster_count, COUNT(a.id) as article_count
    FROM clusters c
    JOIN articles a ON a.cluster_id = c.id
    WHERE c.is_active = true AND c.last_article_at > NOW() - INTERVAL '24 hours'
  `);

  let digestText: string;
  const topics = clustersRes.rows;
  const keyTopics = topics.map((t: { topic: string }) => t.topic).filter(Boolean);

  if (isAIAvailable()) {
    digestText = await generateDigestSummary(topics);
  } else {
    digestText = `Today's top stories:\n\n` +
      topics.map((t: { topic: string; article_count: number; summary: string }, i: number) =>
        `${i + 1}. ${t.topic || 'Developing story'} (${t.article_count} sources)${t.summary ? ': ' + t.summary : ''}`
      ).join('\n\n') +
      `\n\n${topics.length} stories tracked today.`;
  }

  await query(
    `INSERT INTO daily_digests (digest_date, summary, key_topics, cluster_count, article_count)
     VALUES ($1, $2, $3, $4, $5)`,
    [today, digestText, keyTopics, totals.rows[0].cluster_count, totals.rows[0].article_count]
  );

  console.log('[pipeline] Daily digest generated');
  return true;
}
