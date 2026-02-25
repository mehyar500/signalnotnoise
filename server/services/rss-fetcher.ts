import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Axial.news/1.0 RSS Reader',
    'Accept': 'application/rss+xml, application/xml, text/xml',
  },
});

export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
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
      }));
  } catch (err) {
    console.error(`[rss] Failed to fetch ${url}:`, (err as Error).message);
    return [];
  }
}
