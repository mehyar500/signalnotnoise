import { query } from './db.js';

export async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      sub_source TEXT,
      feed_url TEXT UNIQUE NOT NULL,
      bias_label TEXT,
      last_fetched_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS clusters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic TEXT,
      topic_slug TEXT,
      representative_headline TEXT,
      summary TEXT,
      summary_generated_at TIMESTAMPTZ,
      bias_analysis JSONB,
      avg_heat_score REAL,
      avg_substance_score REAL,
      article_count INT DEFAULT 1,
      source_count INT DEFAULT 1,
      left_count INT DEFAULT 0,
      center_count INT DEFAULT 0,
      right_count INT DEFAULT 0,
      international_count INT DEFAULT 0,
      first_article_at TIMESTAMPTZ NOT NULL,
      last_article_at TIMESTAMPTZ NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      link TEXT UNIQUE NOT NULL,
      image_url TEXT,
      published_at TIMESTAMPTZ,
      heat_score REAL,
      substance_score REAL,
      is_processed BOOLEAN DEFAULT false,
      cluster_id UUID REFERENCES clusters(id),
      keywords TEXT[],
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS daily_digests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      digest_date DATE UNIQUE NOT NULL,
      summary TEXT NOT NULL,
      key_topics TEXT[],
      closing_line TEXT DEFAULT 'You''re caught up.',
      cluster_count INT,
      article_count INT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_active_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      notify_updates BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
      cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(collection_id, cluster_id)
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(cluster_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_articles_processed ON articles(is_processed)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clusters_active ON clusters(is_active)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clusters_article_count ON clusters(article_count)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clusters_last_article ON clusters(last_article_at)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sources_bias ON sources(bias_label)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id)`);

  console.log('[schema] Database schema initialized');
}
