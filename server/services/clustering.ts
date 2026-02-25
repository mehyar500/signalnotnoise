import { query } from '../db.js';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
  'was', 'one', 'our', 'out', 'has', 'have', 'been', 'from', 'this', 'that',
  'with', 'they', 'will', 'each', 'make', 'like', 'than', 'them', 'then',
  'what', 'when', 'who', 'how', 'said', 'its', 'also', 'into', 'just',
  'about', 'more', 'some', 'very', 'would', 'could', 'should', 'their',
  'which', 'there', 'other', 'were', 'after', 'being', 'those', 'does',
  'did', 'get', 'got', 'may', 'over', 'only', 'new', 'his', 'she', 'say',
  'says', 'news', 'article', 'report', 'here', 'now', 'way', 'still',
]);

function buildTfVector(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  const len = tokens.length || 1;
  const vec = new Map<string, number>();
  for (const [word, count] of freq) {
    vec.set(word, count / len);
  }
  return vec;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const allKeys = new Set([...a.keys(), ...b.keys()]);
  for (const key of allKeys) {
    const va = a.get(key) || 0;
    const vb = b.get(key) || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const SIMILARITY_THRESHOLD = 0.35;
const CLUSTER_WINDOW_HOURS = 72;

export async function assignToCluster(articleId: string, title: string, description: string, publishedAt: string, sourceId: string): Promise<string | null> {
  const text = `${title} ${description}`;
  const newTokens = tokenize(text);
  if (newTokens.length < 3) return null;
  const newVec = buildTfVector(newTokens);

  const windowDate = new Date(Date.now() - CLUSTER_WINDOW_HOURS * 3600 * 1000).toISOString();

  const recentRes = await query(
    `SELECT a.id, a.title, a.description, a.cluster_id 
     FROM articles a 
     WHERE a.published_at > $1 AND a.id != $2 AND a.cluster_id IS NOT NULL
     ORDER BY a.published_at DESC
     LIMIT 500`,
    [windowDate, articleId]
  );

  let bestMatch: { clusterId: string; similarity: number } | null = null;

  for (const row of recentRes.rows) {
    const rowText = `${row.title} ${row.description || ''}`;
    const rowTokens = tokenize(rowText);
    const rowVec = buildTfVector(rowTokens);
    const sim = cosineSimilarity(newVec, rowVec);

    if (sim > SIMILARITY_THRESHOLD && (!bestMatch || sim > bestMatch.similarity)) {
      bestMatch = { clusterId: row.cluster_id, similarity: sim };
    }
  }

  if (bestMatch) {
    await query(`UPDATE articles SET cluster_id = $1 WHERE id = $2`, [bestMatch.clusterId, articleId]);
    await updateClusterStats(bestMatch.clusterId);
    return bestMatch.clusterId;
  }

  const clusterRes = await query(
    `INSERT INTO clusters (representative_headline, topic, first_article_at, last_article_at)
     VALUES ($1, $2, $3, $3)
     RETURNING id`,
    [title, extractTopic(title), publishedAt]
  );

  const newClusterId = clusterRes.rows[0].id;
  await query(`UPDATE articles SET cluster_id = $1 WHERE id = $2`, [newClusterId, articleId]);
  await updateClusterStats(newClusterId);
  return newClusterId;
}

function extractTopic(title: string): string {
  return title
    .replace(/^(breaking|exclusive|update|opinion|analysis):\s*/i, '')
    .replace(/\s*[-–|]\s*.*$/, '')
    .trim()
    .slice(0, 120);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export async function updateClusterStats(clusterId: string) {
  await query(`
    UPDATE clusters SET
      article_count = sub.article_count,
      source_count = sub.source_count,
      left_count = sub.left_count,
      center_count = sub.center_count,
      right_count = sub.right_count,
      international_count = sub.international_count,
      avg_heat_score = sub.avg_heat,
      avg_substance_score = sub.avg_substance,
      first_article_at = sub.first_at,
      last_article_at = sub.last_at,
      representative_headline = sub.best_title,
      topic_slug = $2,
      updated_at = NOW()
    FROM (
      SELECT
        COUNT(a.id) as article_count,
        COUNT(DISTINCT a.source_id) as source_count,
        COUNT(CASE WHEN s.bias_label IN ('left','center-left') THEN 1 END) as left_count,
        COUNT(CASE WHEN s.bias_label IN ('center') THEN 1 END) as center_count,
        COUNT(CASE WHEN s.bias_label IN ('right','center-right') THEN 1 END) as right_count,
        COUNT(CASE WHEN s.bias_label IN ('international') THEN 1 END) as international_count,
        AVG(a.heat_score) as avg_heat,
        AVG(a.substance_score) as avg_substance,
        MIN(a.published_at) as first_at,
        MAX(a.published_at) as last_at,
        (SELECT a2.title FROM articles a2 WHERE a2.cluster_id = $1 ORDER BY a2.published_at ASC LIMIT 1) as best_title
      FROM articles a
      JOIN sources s ON a.source_id = s.id
      WHERE a.cluster_id = $1
    ) sub
    WHERE clusters.id = $1
  `, [clusterId, slugify(clusterId)]);

  const topicRes = await query(`SELECT topic, representative_headline FROM clusters WHERE id = $1`, [clusterId]);
  if (topicRes.rows[0]) {
    const topic = topicRes.rows[0].topic || topicRes.rows[0].representative_headline || '';
    await query(`UPDATE clusters SET topic_slug = $1 WHERE id = $2`, [slugify(topic), clusterId]);
  }
}
