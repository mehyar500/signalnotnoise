import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AxialNews/1.0 (RSS Aggregator)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

export interface FeedValidationResult {
  valid: boolean;
  itemCount: number;
  title: string | null;
  error: string | null;
}

export async function validateFeed(url: string): Promise<FeedValidationResult> {
  try {
    const feed = await parser.parseURL(url);
    return {
      valid: true,
      itemCount: feed.items?.length || 0,
      title: feed.title || null,
      error: null,
    };
  } catch (err) {
    return {
      valid: false,
      itemCount: 0,
      title: null,
      error: (err as Error).message,
    };
  }
}
