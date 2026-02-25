import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Axial.news/1.0 RSS Reader',
    'Accept': 'application/rss+xml, application/xml, text/xml',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ],
  },
});

export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl: string | null;
}

function cleanDescription(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

function extractImageUrl(item: Record<string, unknown>): string | null {
  if (item.mediaContent && Array.isArray(item.mediaContent)) {
    for (const mc of item.mediaContent) {
      const attrs = (mc as Record<string, unknown>)?.['$'] as Record<string, string> | undefined;
      if (attrs?.url && attrs?.medium === 'image') return attrs.url;
      if (attrs?.url) return attrs.url;
    }
  }

  if (item.mediaThumbnail && Array.isArray(item.mediaThumbnail)) {
    for (const mt of item.mediaThumbnail) {
      const attrs = (mt as Record<string, unknown>)?.['$'] as Record<string, string> | undefined;
      if (attrs?.url) return attrs.url;
    }
  }

  if (item.enclosure) {
    const enc = item.enclosure as Record<string, string>;
    if (enc.url && enc.type?.startsWith('image/')) return enc.url;
  }

  const content = (item.content || item['content:encoded'] || '') as string;
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch && imgMatch[1]) return imgMatch[1];

  return null;
}

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items
      .filter(item => item.title && item.link)
      .map(item => ({
        title: (item.title || '').trim(),
        description: cleanDescription(item.contentSnippet || item.content || item.summary || ''),
        link: (item.link || '').trim(),
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        imageUrl: extractImageUrl(item as Record<string, unknown>),
      }));
  } catch (err) {
    console.error(`[rss] Failed to fetch ${url}:`, (err as Error).message);
    return [];
  }
}
