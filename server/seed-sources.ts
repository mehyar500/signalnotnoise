import { query } from './db.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const BIAS_MAP: Record<string, string> = {
  'bbc': 'center',
  'bloomberg': 'center',
  'cnet': 'center',
  'engadget': 'center',
  'financial times': 'center',
  'forbes': 'center-right',
  'marketwatch': 'center',
  'mashable': 'center-left',
  'new york times': 'center-left',
  'politico': 'center',
  'techcrunch': 'center',
  'the guardian': 'left',
  'the verge': 'center-left',
  'vox': 'left',
  'wired': 'center-left',
  'ycombinator': 'center',
};

export async function seedSources() {
  const filePath = join(process.cwd(), 'attached_assets', 'feed_sources_1772031202645.json');
  let data: Array<{ fields: { source: string; sub_source: string; url: string; active: boolean } }>;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error('[seed] Could not read feed sources file:', (err as Error).message);
    return 0;
  }

  console.log(`[seed] Found ${data.length} feed sources to import`);

  let inserted = 0;
  let skipped = 0;

  for (const entry of data) {
    const { source, sub_source, url, active } = entry.fields;
    const biasLabel = BIAS_MAP[source] || 'center';
    const displayName = source.charAt(0).toUpperCase() + source.slice(1);

    try {
      const res = await query(
        `INSERT INTO sources (name, sub_source, feed_url, bias_label, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (feed_url) DO NOTHING
         RETURNING id`,
        [displayName, sub_source, url, biasLabel, active]
      );
      if (res.rows.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`[seed] Error inserting source ${source}/${sub_source}:`, (err as Error).message);
    }
  }

  console.log(`[seed] Import complete: ${inserted} inserted, ${skipped} skipped (already exist)`);
  return inserted;
}
