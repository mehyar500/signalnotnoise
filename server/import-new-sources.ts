import Parser from 'rss-parser';
import { query } from './db.js';

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'Axial.news/1.0 RSS Reader', 'Accept': 'application/rss+xml, application/xml, text/xml' },
});

interface NewSource {
  name: string;
  bias: string;
  category: string;
  url: string;
}

const newSources: NewSource[] = [
  // RIGHT
  { name: 'Fox News', bias: 'right', category: 'news', url: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { name: 'Fox News', bias: 'right', category: 'politics', url: 'https://moxie.foxnews.com/google-publisher/politics.xml' },
  { name: 'Fox News', bias: 'right', category: 'world', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
  { name: 'Fox News', bias: 'right', category: 'us', url: 'https://moxie.foxnews.com/google-publisher/us.xml' },
  { name: 'Fox News', bias: 'right', category: 'science', url: 'https://moxie.foxnews.com/google-publisher/science.xml' },
  { name: 'Fox News', bias: 'right', category: 'tech', url: 'https://moxie.foxnews.com/google-publisher/tech.xml' },
  { name: 'Fox News', bias: 'right', category: 'opinion', url: 'https://moxie.foxnews.com/google-publisher/opinion.xml' },
  { name: 'New York Post', bias: 'right', category: 'news', url: 'https://nypost.com/feed/' },
  { name: 'New York Post', bias: 'right', category: 'business', url: 'https://nypost.com/business/feed/' },
  { name: 'Daily Wire', bias: 'right', category: 'news', url: 'https://www.dailywire.com/feeds/rss.xml' },
  { name: 'The Federalist', bias: 'right', category: 'news', url: 'https://thefederalist.com/feed/' },
  { name: 'National Review', bias: 'right', category: 'news', url: 'https://www.nationalreview.com/feed/' },
  { name: 'Breitbart', bias: 'right', category: 'news', url: 'https://feeds.feedburner.com/breitbart' },
  { name: 'Daily Caller', bias: 'right', category: 'news', url: 'https://dailycaller.com/feed/' },

  // CENTER-RIGHT
  { name: 'Reason', bias: 'center-right', category: 'news', url: 'https://reason.com/feed/' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'world', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'opinion', url: 'https://feeds.a.dj.com/rss/RSSOpinion.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'tech', url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml' },
  { name: 'Wall Street Journal', bias: 'center-right', category: 'lifestyle', url: 'https://feeds.a.dj.com/rss/RSSLifestyle.xml' },

  // CENTER-LEFT
  { name: 'Washington Post', bias: 'center-left', category: 'world', url: 'https://feeds.washingtonpost.com/rss/world' },
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
  { name: 'CNN', bias: 'center-left', category: 'tech', url: 'http://rss.cnn.com/rss/cnn_tech.rss' },
  { name: 'CNN', bias: 'center-left', category: 'health', url: 'http://rss.cnn.com/rss/cnn_health.rss' },
  { name: 'CNN', bias: 'center-left', category: 'business', url: 'http://rss.cnn.com/rss/money_latest.rss' },
  { name: 'The Atlantic', bias: 'center-left', category: 'news', url: 'https://www.theatlantic.com/feed/all/' },
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
  { name: 'ProPublica', bias: 'center-left', category: 'investigative', url: 'https://feeds.propublica.org/propublica/main' },
  { name: 'Rolling Stone', bias: 'center-left', category: 'culture', url: 'https://www.rollingstone.com/feed/' },

  // LEFT
  { name: 'Slate', bias: 'left', category: 'news', url: 'https://slate.com/feeds/all.rss' },
  { name: 'Mother Jones', bias: 'left', category: 'news', url: 'https://www.motherjones.com/feed/' },
  { name: 'The Intercept', bias: 'left', category: 'news', url: 'https://theintercept.com/feed/?rss' },
  { name: 'Salon', bias: 'left', category: 'news', url: 'https://www.salon.com/feed/' },
  { name: 'Huffington Post', bias: 'left', category: 'news', url: 'https://www.huffpost.com/section/front-page/feed' },
  { name: 'Huffington Post', bias: 'left', category: 'politics', url: 'https://www.huffpost.com/section/politics/feed' },
  { name: 'The Daily Beast', bias: 'left', category: 'news', url: 'https://feeds.thedailybeast.com/rss/articles' },

  // CENTER
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
  { name: 'Axios', bias: 'center', category: 'news', url: 'https://api.axios.com/feed/' },
  { name: 'Business Insider', bias: 'center', category: 'news', url: 'https://www.businessinsider.com/rss' },
  { name: 'Ars Technica', bias: 'center', category: 'tech', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { name: 'Ars Technica', bias: 'center', category: 'science', url: 'https://feeds.arstechnica.com/arstechnica/science' },
  { name: 'Ars Technica', bias: 'center', category: 'tech-policy', url: 'https://feeds.arstechnica.com/arstechnica/tech-policy' },
  { name: 'The Register', bias: 'center', category: 'tech', url: 'https://www.theregister.com/headlines.atom' },
  { name: 'TechCrunch', bias: 'center', category: 'ai', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'TechCrunch', bias: 'center', category: 'startups', url: 'https://techcrunch.com/category/startups/feed/' },
  { name: 'TechCrunch', bias: 'center', category: 'venture', url: 'https://techcrunch.com/category/venture/feed/' },
  { name: 'MIT Tech Review', bias: 'center', category: 'tech', url: 'https://www.technologyreview.com/feed/' },
  { name: 'ZDNet', bias: 'center', category: 'tech', url: 'https://www.zdnet.com/news/rss.xml' },
  { name: 'Android Authority', bias: 'center', category: 'tech', url: 'https://www.androidauthority.com/feed/' },
  { name: '9to5Mac', bias: 'center', category: 'tech', url: 'https://9to5mac.com/feed/' },
  { name: '9to5Google', bias: 'center', category: 'tech', url: 'https://9to5google.com/feed/' },
  { name: 'Nature', bias: 'center', category: 'science', url: 'https://www.nature.com/nature.rss' },
  { name: 'Scientific American', bias: 'center', category: 'science', url: 'http://rss.sciam.com/ScientificAmerican-Global' },
  { name: 'Phys.org', bias: 'center', category: 'science', url: 'https://phys.org/rss-feed/' },
  { name: 'Space.com', bias: 'center', category: 'science', url: 'https://www.space.com/feeds/all' },
  { name: 'Fortune', bias: 'center', category: 'business', url: 'https://fortune.com/feed/' },
  { name: 'ESPN', bias: 'center', category: 'sports', url: 'https://www.espn.com/espn/rss/news' },
  { name: 'Variety', bias: 'center', category: 'entertainment', url: 'https://variety.com/feed/' },
  { name: 'Foreign Policy', bias: 'center', category: 'world', url: 'https://foreignpolicy.com/feed/' },

  // INTERNATIONAL
  { name: 'Al Jazeera', bias: 'international', category: 'news', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'Deutsche Welle', bias: 'international', category: 'news', url: 'https://rss.dw.com/rdf/rss-en-all' },
  { name: 'Deutsche Welle', bias: 'international', category: 'world', url: 'https://rss.dw.com/rdf/rss-en-world' },
  { name: 'Deutsche Welle', bias: 'international', category: 'europe', url: 'https://rss.dw.com/rdf/rss-en-eu' },
  { name: 'Deutsche Welle', bias: 'international', category: 'asia', url: 'https://rss.dw.com/rdf/rss-en-asia' },
  { name: 'France 24', bias: 'international', category: 'news', url: 'https://www.france24.com/en/rss' },
  { name: 'Japan Times', bias: 'international', category: 'news', url: 'https://www.japantimes.co.jp/feed/' },
  { name: 'South China Morning Post', bias: 'international', category: 'news', url: 'https://www.scmp.com/rss/91/feed' },
  { name: 'South China Morning Post', bias: 'international', category: 'asia', url: 'https://www.scmp.com/rss/5/feed' },
  { name: 'South China Morning Post', bias: 'international', category: 'china', url: 'https://www.scmp.com/rss/4/feed' },
  { name: 'Times of India', bias: 'international', category: 'news', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  { name: 'Times of India', bias: 'international', category: 'world', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms' },
  { name: 'Sydney Morning Herald', bias: 'international', category: 'news', url: 'https://www.smh.com.au/rss/feed.xml' },
  { name: 'The Independent', bias: 'international', category: 'news', url: 'https://www.independent.co.uk/news/world/rss' },
  { name: 'The Independent', bias: 'international', category: 'tech', url: 'https://www.independent.co.uk/tech/rss' },
  { name: 'Sky News', bias: 'international', category: 'news', url: 'https://feeds.skynews.com/feeds/rss/home.xml' },
  { name: 'Sky News', bias: 'international', category: 'world', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
  { name: 'Sky News', bias: 'international', category: 'politics', url: 'https://feeds.skynews.com/feeds/rss/politics.xml' },
  { name: 'Sky News', bias: 'international', category: 'tech', url: 'https://feeds.skynews.com/feeds/rss/technology.xml' },
  { name: 'Sky News', bias: 'international', category: 'business', url: 'https://feeds.skynews.com/feeds/rss/business.xml' },
  { name: 'ABC Australia', bias: 'international', category: 'news', url: 'https://www.abc.net.au/news/feed/2942460/rss.xml' },
  { name: 'The Conversation', bias: 'international', category: 'analysis', url: 'https://theconversation.com/us/articles.atom' },
];

async function testFeed(url: string): Promise<boolean> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items?.filter(i => i.title && i.link).length || 0) > 0;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Testing ' + newSources.length + ' new feeds...');

  const batchSize = 15;
  let inserted = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < newSources.length; i += batchSize) {
    const batch = newSources.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async (s) => {
      const ok = await testFeed(s.url);
      return { ...s, ok };
    }));

    for (const r of results) {
      if (!r.ok) {
        console.log('FAIL: ' + r.name + ' / ' + r.category + ' - ' + r.url);
        failed++;
        continue;
      }

      try {
        const res = await query(
          \`INSERT INTO sources (name, feed_url, bias_label, category, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (feed_url) DO NOTHING
           RETURNING id\`,
          [r.name, r.url, r.bias, r.category]
        );
        if (res.rows.length > 0) {
          inserted++;
          console.log('OK:   ' + r.name + ' / ' + r.category);
        } else {
          skipped++;
        }
      } catch (e: any) {
        console.log('DB ERR: ' + r.name + ' - ' + e.message?.slice(0, 60));
        failed++;
      }
    }

    console.log('Progress: ' + Math.min(i + batchSize, newSources.length) + '/' + newSources.length);
  }

  const total = await query('SELECT COUNT(*) as c FROM sources WHERE is_active = true');
  console.log('\n=== DONE ===');
  console.log('Inserted: ' + inserted);
  console.log('Failed: ' + failed);
  console.log('Already existed: ' + skipped);
  console.log('Total active sources now: ' + total.rows[0].c);

  process.exit(0);
}

main();
