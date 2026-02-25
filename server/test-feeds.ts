import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'Axial.news/1.0 RSS Reader', 'Accept': 'application/rss+xml, application/xml, text/xml' },
  customFields: { item: [['media:content', 'mediaContent', { keepArray: true }], ['media:thumbnail', 'mediaThumbnail', { keepArray: true }]] },
});

interface FeedCandidate {
  name: string;
  bias: string;
  category: string;
  url: string;
}

const candidates: FeedCandidate[] = [
  // === RIGHT / CENTER-RIGHT ===
  { name: 'Fox News', bias: 'right', category: 'news', url: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { name: 'Fox News', bias: 'right', category: 'politics', url: 'https://moxie.foxnews.com/google-publisher/politics.xml' },
  { name: 'Fox News', bias: 'right', category: 'world', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
  { name: 'Fox News', bias: 'right', category: 'business', url: 'https://moxie.foxnews.com/google-publisher/us.xml' },
  { name: 'Fox News', bias: 'right', category: 'science', url: 'https://moxie.foxnews.com/google-publisher/science.xml' },
  { name: 'Fox News', bias: 'right', category: 'tech', url: 'https://moxie.foxnews.com/google-publisher/tech.xml' },
  { name: 'Fox News', bias: 'right', category: 'opinion', url: 'https://moxie.foxnews.com/google-publisher/opinion.xml' },
  { name: 'New York Post', bias: 'right', category: 'news', url: 'https://nypost.com/feed/' },
  { name: 'New York Post', bias: 'right', category: 'news', url: 'https://nypost.com/news/feed/' },
  { name: 'New York Post', bias: 'right', category: 'politics', url: 'https://nypost.com/politics/feed/' },
  { name: 'New York Post', bias: 'right', category: 'business', url: 'https://nypost.com/business/feed/' },
  { name: 'New York Post', bias: 'right', category: 'opinion', url: 'https://nypost.com/opinion/feed/' },
  { name: 'Washington Examiner', bias: 'right', category: 'news', url: 'https://www.washingtonexaminer.com/feed' },
  { name: 'Washington Examiner', bias: 'right', category: 'politics', url: 'https://www.washingtonexaminer.com/tag/politics/feed' },
  { name: 'Daily Wire', bias: 'right', category: 'news', url: 'https://www.dailywire.com/feeds/rss.xml' },
  { name: 'The Federalist', bias: 'right', category: 'news', url: 'https://thefederalist.com/feed/' },
  { name: 'National Review', bias: 'right', category: 'news', url: 'https://www.nationalreview.com/feed/' },
  { name: 'Breitbart', bias: 'right', category: 'news', url: 'https://feeds.feedburner.com/breitbart' },
  { name: 'Daily Caller', bias: 'right', category: 'news', url: 'https://dailycaller.com/feed/' },
  { name: 'Townhall', bias: 'right', category: 'news', url: 'https://townhall.com/rss/political-cartoons/' },
  { name: 'Reason', bias: 'center-right', category: 'news', url: 'https://reason.com/feed/' },
  { name: 'Reason', bias: 'center-right', category: 'news', url: 'https://reason.com/latest/feed/' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'news', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'opinion', url: 'https://feeds.a.dj.com/rss/RSSOpinion.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'tech', url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'lifestyle', url: 'https://feeds.a.dj.com/rss/RSSLifestyle.xml' },
  { name: 'The Economist', bias: 'center-right', category: 'news', url: 'https://www.economist.com/rss' },
  { name: 'The Economist', bias: 'center-right', category: 'news', url: 'https://www.economist.com/international/rss.xml' },
  { name: 'The Economist', bias: 'center-right', category: 'business', url: 'https://www.economist.com/business/rss.xml' },
  { name: 'The Economist', bias: 'center-right', category: 'science', url: 'https://www.economist.com/science-and-technology/rss.xml' },

  // === LEFT / CENTER-LEFT ===
  { name: 'Washington Post', bias: 'center-left', category: 'news', url: 'https://feeds.washingtonpost.com/rss/world' },
  { name: 'Washington Post', bias: 'center-left', category: 'politics', url: 'https://feeds.washingtonpost.com/rss/politics' },
  { name: 'Washington Post', bias: 'center-left', category: 'business', url: 'https://feeds.washingtonpost.com/rss/business' },
  { name: 'Washington Post', bias: 'center-left', category: 'tech', url: 'https://feeds.washingtonpost.com/rss/business/technology' },
  { name: 'Washington Post', bias: 'center-left', category: 'opinions', url: 'https://feeds.washingtonpost.com/rss/opinions' },
  { name: 'Washington Post', bias: 'center-left', category: 'national', url: 'https://feeds.washingtonpost.com/rss/national' },
  { name: 'Washington Post', bias: 'center-left', category: 'health', url: 'https://feeds.washingtonpost.com/rss/national/health-science' },
  { name: 'Washington Post', bias: 'center-left', category: 'climate', url: 'https://feeds.washingtonpost.com/rss/climate-environment' },
  { name: 'CNN', bias: 'center-left', category: 'news', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
  { name: 'CNN', bias: 'center-left', category: 'world', url: 'http://rss.cnn.com/rss/cnn_world.rss' },
  { name: 'CNN', bias: 'center-left', category: 'politics', url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss' },
  { name: 'CNN', bias: 'center-left', category: 'business', url: 'http://rss.cnn.com/rss/money_latest.rss' },
  { name: 'CNN', bias: 'center-left', category: 'tech', url: 'http://rss.cnn.com/rss/cnn_tech.rss' },
  { name: 'CNN', bias: 'center-left', category: 'health', url: 'http://rss.cnn.com/rss/cnn_health.rss' },
  { name: 'MSNBC', bias: 'left', category: 'news', url: 'https://www.msnbc.com/feeds/latest' },
  { name: 'Huffington Post', bias: 'left', category: 'news', url: 'https://www.huffpost.com/section/front-page/feed' },
  { name: 'Huffington Post', bias: 'left', category: 'politics', url: 'https://www.huffpost.com/section/politics/feed' },
  { name: 'Huffington Post', bias: 'left', category: 'world', url: 'https://www.huffpost.com/section/world-news/feed' },
  { name: 'Slate', bias: 'left', category: 'news', url: 'https://slate.com/feeds/all.rss' },
  { name: 'The Atlantic', bias: 'center-left', category: 'news', url: 'https://www.theatlantic.com/feed/all/' },
  { name: 'The Atlantic', bias: 'center-left', category: 'politics', url: 'https://www.theatlantic.com/feed/channel/politics/' },
  { name: 'The Atlantic', bias: 'center-left', category: 'tech', url: 'https://www.theatlantic.com/feed/channel/technology/' },
  { name: 'Mother Jones', bias: 'left', category: 'news', url: 'https://www.motherjones.com/feed/' },
  { name: 'The Intercept', bias: 'left', category: 'news', url: 'https://theintercept.com/feed/?rss' },
  { name: 'Salon', bias: 'left', category: 'news', url: 'https://www.salon.com/feed/' },
  { name: 'ProPublica', bias: 'center-left', category: 'investigative', url: 'https://feeds.propublica.org/propublica/main' },
  { name: 'The Daily Beast', bias: 'left', category: 'news', url: 'https://feeds.thedailybeast.com/rss/articles' },
  { name: 'NPR', bias: 'center-left', category: 'news', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'NPR', bias: 'center-left', category: 'politics', url: 'https://feeds.npr.org/1014/rss.xml' },
  { name: 'NPR', bias: 'center-left', category: 'world', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'NPR', bias: 'center-left', category: 'business', url: 'https://feeds.npr.org/1006/rss.xml' },
  { name: 'NPR', bias: 'center-left', category: 'tech', url: 'https://feeds.npr.org/1019/rss.xml' },
  { name: 'NPR', bias: 'center-left', category: 'health', url: 'https://feeds.npr.org/1128/rss.xml' },
  { name: 'NPR', bias: 'center-left', category: 'science', url: 'https://feeds.npr.org/1007/rss.xml' },
  { name: 'PBS NewsHour', bias: 'center-left', category: 'news', url: 'https://www.pbs.org/newshour/feeds/rss/headlines' },
  { name: 'PBS NewsHour', bias: 'center-left', category: 'world', url: 'https://www.pbs.org/newshour/feeds/rss/world' },
  { name: 'PBS NewsHour', bias: 'center-left', category: 'politics', url: 'https://www.pbs.org/newshour/feeds/rss/politics' },
  { name: 'PBS NewsHour', bias: 'center-left', category: 'science', url: 'https://www.pbs.org/newshour/feeds/rss/science' },

  // === CENTER ===
  { name: 'Associated Press', bias: 'center', category: 'news', url: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { name: 'Associated Press', bias: 'center', category: 'news', url: 'https://feeds.apnews.com/rss/apf-topnews' },
  { name: 'Reuters', bias: 'center', category: 'news', url: 'https://www.reutersagency.com/feed/' },
  { name: 'Reuters', bias: 'center', category: 'business', url: 'https://www.reuters.com/rssFeed/businessNews/' },
  { name: 'Reuters', bias: 'center', category: 'world', url: 'https://www.reuters.com/rssFeed/worldNews/' },
  { name: 'Reuters', bias: 'center', category: 'tech', url: 'https://www.reuters.com/rssFeed/technologyNews/' },
  { name: 'USA Today', bias: 'center', category: 'news', url: 'http://rssfeeds.usatoday.com/usatoday-NewsTopStories' },
  { name: 'USA Today', bias: 'center', category: 'politics', url: 'http://rssfeeds.usatoday.com/usatodaycompoliticstopstories' },
  { name: 'USA Today', bias: 'center', category: 'tech', url: 'http://rssfeeds.usatoday.com/usatoday-TechTopStories' },
  { name: 'USA Today', bias: 'center', category: 'money', url: 'http://rssfeeds.usatoday.com/usatoday-MoneyTopStories' },
  { name: 'CNBC', bias: 'center', category: 'news', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114' },
  { name: 'CNBC', bias: 'center', category: 'business', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { name: 'CNBC', bias: 'center', category: 'tech', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910' },
  { name: 'CNBC', bias: 'center', category: 'politics', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000113' },
  { name: 'CNBC', bias: 'center', category: 'markets', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258' },
  { name: 'CBS News', bias: 'center', category: 'news', url: 'https://www.cbsnews.com/latest/rss/main' },
  { name: 'CBS News', bias: 'center', category: 'politics', url: 'https://www.cbsnews.com/latest/rss/politics' },
  { name: 'CBS News', bias: 'center', category: 'world', url: 'https://www.cbsnews.com/latest/rss/world' },
  { name: 'CBS News', bias: 'center', category: 'tech', url: 'https://www.cbsnews.com/latest/rss/technology' },
  { name: 'ABC News', bias: 'center', category: 'news', url: 'https://abcnews.go.com/abcnews/topstories' },
  { name: 'ABC News', bias: 'center', category: 'politics', url: 'https://abcnews.go.com/abcnews/politicsheadlines' },
  { name: 'ABC News', bias: 'center', category: 'world', url: 'https://abcnews.go.com/abcnews/internationalheadlines' },
  { name: 'ABC News', bias: 'center', category: 'tech', url: 'https://abcnews.go.com/abcnews/technologyheadlines' },
  { name: 'The Hill', bias: 'center', category: 'news', url: 'https://thehill.com/feed/' },
  { name: 'The Hill', bias: 'center', category: 'news', url: 'https://thehill.com/news/feed/' },
  { name: 'Axios', bias: 'center', category: 'news', url: 'https://api.axios.com/feed/' },
  { name: 'Business Insider', bias: 'center', category: 'news', url: 'https://www.businessinsider.com/rss' },
  { name: 'Business Insider', bias: 'center', category: 'tech', url: 'https://www.businessinsider.com/sai/rss' },
  { name: 'Business Insider', bias: 'center', category: 'finance', url: 'https://www.businessinsider.com/clusterstock/rss' },

  // === INTERNATIONAL ===
  { name: 'Al Jazeera', bias: 'international', category: 'news', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'Deutsche Welle', bias: 'international', category: 'news', url: 'https://rss.dw.com/rdf/rss-en-all' },
  { name: 'Deutsche Welle', bias: 'international', category: 'world', url: 'https://rss.dw.com/rdf/rss-en-world' },
  { name: 'Deutsche Welle', bias: 'international', category: 'europe', url: 'https://rss.dw.com/rdf/rss-en-eu' },
  { name: 'Deutsche Welle', bias: 'international', category: 'asia', url: 'https://rss.dw.com/rdf/rss-en-asia' },
  { name: 'France 24', bias: 'international', category: 'news', url: 'https://www.france24.com/en/rss' },
  { name: 'France 24', bias: 'international', category: 'world', url: 'https://www.france24.com/en/france/rss' },
  { name: 'Japan Times', bias: 'international', category: 'news', url: 'https://www.japantimes.co.jp/feed/' },
  { name: 'South China Morning Post', bias: 'international', category: 'news', url: 'https://www.scmp.com/rss/91/feed' },
  { name: 'South China Morning Post', bias: 'international', category: 'asia', url: 'https://www.scmp.com/rss/5/feed' },
  { name: 'South China Morning Post', bias: 'international', category: 'china', url: 'https://www.scmp.com/rss/4/feed' },
  { name: 'The Times of India', bias: 'international', category: 'news', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  { name: 'The Times of India', bias: 'international', category: 'world', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
  { name: 'Sydney Morning Herald', bias: 'international', category: 'news', url: 'https://www.smh.com.au/rss/feed.xml' },
  { name: 'The Globe and Mail', bias: 'international', category: 'news', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/' },
  { name: 'The Globe and Mail', bias: 'international', category: 'business', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/' },
  { name: 'The Irish Times', bias: 'international', category: 'news', url: 'https://www.irishtimes.com/cmlink/the-irish-times-news-1.1319192' },
  { name: 'The Independent', bias: 'international', category: 'news', url: 'https://www.independent.co.uk/news/world/rss' },
  { name: 'The Independent', bias: 'international', category: 'politics', url: 'https://www.independent.co.uk/news/uk/politics/rss' },
  { name: 'The Independent', bias: 'international', category: 'tech', url: 'https://www.independent.co.uk/tech/rss' },
  { name: 'The Telegraph', bias: 'international', category: 'news', url: 'https://www.telegraph.co.uk/rss.xml' },
  { name: 'Sky News', bias: 'international', category: 'news', url: 'https://feeds.skynews.com/feeds/rss/home.xml' },
  { name: 'Sky News', bias: 'international', category: 'world', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
  { name: 'Sky News', bias: 'international', category: 'politics', url: 'https://feeds.skynews.com/feeds/rss/politics.xml' },
  { name: 'Sky News', bias: 'international', category: 'tech', url: 'https://feeds.skynews.com/feeds/rss/technology.xml' },
  { name: 'Sky News', bias: 'international', category: 'business', url: 'https://feeds.skynews.com/feeds/rss/business.xml' },
  { name: 'The Straits Times', bias: 'international', category: 'news', url: 'https://www.straitstimes.com/news/world/rss.xml' },
  { name: 'Nikkei Asia', bias: 'international', category: 'news', url: 'https://asia.nikkei.com/rss' },
  { name: 'ABC Australia', bias: 'international', category: 'news', url: 'https://www.abc.net.au/news/feed/2942460/rss.xml' },
  { name: 'ABC Australia', bias: 'international', category: 'world', url: 'https://www.abc.net.au/news/feed/51120/rss.xml' },

  // === TECH / SCIENCE ===
  { name: 'Ars Technica', bias: 'center', category: 'tech', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { name: 'Ars Technica', bias: 'center', category: 'science', url: 'https://feeds.arstechnica.com/arstechnica/science' },
  { name: 'Ars Technica', bias: 'center', category: 'tech-policy', url: 'https://feeds.arstechnica.com/arstechnica/tech-policy' },
  { name: 'The Register', bias: 'center', category: 'tech', url: 'https://www.theregister.com/headlines.atom' },
  { name: 'TechCrunch', bias: 'center', category: 'ai', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'TechCrunch', bias: 'center', category: 'startups', url: 'https://techcrunch.com/category/startups/feed/' },
  { name: 'TechCrunch', bias: 'center', category: 'venture', url: 'https://techcrunch.com/category/venture/feed/' },
  { name: 'The Verge', bias: 'center-left', category: 'ai', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'MIT Technology Review', bias: 'center', category: 'tech', url: 'https://www.technologyreview.com/feed/' },
  { name: 'ZDNet', bias: 'center', category: 'tech', url: 'https://www.zdnet.com/news/rss.xml' },
  { name: 'TechRadar', bias: 'center', category: 'tech', url: 'https://www.techradar.com/rss' },
  { name: 'Android Authority', bias: 'center', category: 'tech', url: 'https://www.androidauthority.com/feed/' },
  { name: '9to5Mac', bias: 'center', category: 'tech', url: 'https://9to5mac.com/feed/' },
  { name: '9to5Google', bias: 'center', category: 'tech', url: 'https://9to5google.com/feed/' },
  { name: 'Tom\'s Hardware', bias: 'center', category: 'tech', url: 'https://www.tomshardware.com/feeds/all' },
  { name: 'PCMag', bias: 'center', category: 'tech', url: 'https://www.pcmag.com/feeds/rss/latest' },
  { name: 'Nature', bias: 'center', category: 'science', url: 'https://www.nature.com/nature.rss' },
  { name: 'Science Magazine', bias: 'center', category: 'science', url: 'https://www.science.org/rss/news_current.xml' },
  { name: 'Scientific American', bias: 'center', category: 'science', url: 'http://rss.sciam.com/ScientificAmerican-Global' },
  { name: 'New Scientist', bias: 'center', category: 'science', url: 'https://www.newscientist.com/feed/home' },
  { name: 'Phys.org', bias: 'center', category: 'science', url: 'https://phys.org/rss-feed/' },
  { name: 'Space.com', bias: 'center', category: 'science', url: 'https://www.space.com/feeds/all' },

  // === BUSINESS / FINANCE ===
  { name: 'Fortune', bias: 'center', category: 'business', url: 'https://fortune.com/feed/' },
  { name: 'Fortune', bias: 'center', category: 'tech', url: 'https://fortune.com/section/tech/feed/' },
  { name: 'Barrons', bias: 'center-right', category: 'finance', url: 'https://www.barrons.com/feed' },
  { name: 'Investopedia', bias: 'center', category: 'finance', url: 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline' },
  { name: 'Yahoo Finance', bias: 'center', category: 'finance', url: 'https://finance.yahoo.com/news/rssindex' },

  // === ENTERTAINMENT / SPORTS / CULTURE ===
  { name: 'ESPN', bias: 'center', category: 'sports', url: 'https://www.espn.com/espn/rss/news' },
  { name: 'Variety', bias: 'center', category: 'entertainment', url: 'https://variety.com/feed/' },
  { name: 'Rolling Stone', bias: 'center-left', category: 'culture', url: 'https://www.rollingstone.com/feed/' },
  { name: 'The A.V. Club', bias: 'center-left', category: 'entertainment', url: 'https://www.avclub.com/rss' },
  { name: 'IGN', bias: 'center', category: 'entertainment', url: 'https://feeds.feedburner.com/ign/all' },

  // === OPINION-HEAVY / ANALYSIS ===
  { name: 'The Conversation', bias: 'center-left', category: 'analysis', url: 'https://theconversation.com/us/articles.atom' },
  { name: 'Foreign Policy', bias: 'center', category: 'world', url: 'https://foreignpolicy.com/feed/' },
  { name: 'Foreign Affairs', bias: 'center', category: 'world', url: 'https://www.foreignaffairs.com/rss.xml' },
];

async function testFeed(c: FeedCandidate): Promise<{ candidate: FeedCandidate; ok: boolean; count: number; error?: string }> {
  try {
    const feed = await parser.parseURL(c.url);
    const items = feed.items?.filter(i => i.title && i.link) || [];
    return { candidate: c, ok: items.length > 0, count: items.length };
  } catch (e: any) {
    return { candidate: c, ok: false, count: 0, error: e.message?.slice(0, 80) };
  }
}

async function main() {
  console.log(`Testing ${candidates.length} feeds...\n`);

  const batchSize = 10;
  const results: Awaited<ReturnType<typeof testFeed>>[] = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(testFeed));
    results.push(...batchResults);
    const done = Math.min(i + batchSize, candidates.length);
    console.log(`Progress: ${done}/${candidates.length}`);
  }

  const working = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  console.log(`\n=== WORKING FEEDS (${working.length}) ===`);
  for (const r of working) {
    console.log(`OK  | ${r.candidate.name.padEnd(25)} | ${r.candidate.bias.padEnd(14)} | ${r.candidate.category.padEnd(15)} | ${r.count} items | ${r.candidate.url}`);
  }

  console.log(`\n=== FAILED FEEDS (${failed.length}) ===`);
  for (const r of failed) {
    console.log(`ERR | ${r.candidate.name.padEnd(25)} | ${r.error?.slice(0, 60)}`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working.length}/${candidates.length}`);

  const workingNames = new Set(working.map(r => r.candidate.name));
  console.log(`\nUnique sources that work: ${workingNames.size}`);
  for (const name of [...workingNames].sort()) {
    const feeds = working.filter(r => r.candidate.name === name);
    console.log(`  ${name}: ${feeds.length} feeds`);
  }
}

main();
