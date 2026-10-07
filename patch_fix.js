const fs = require('fs');

function updateFile(filePath, search, replace) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content);
}

// 1. Fix about
updateFile('app/about/page.js',
  /export const metadata = {\n  title: 'About the Creator & Our Story \| Lucky Pick Canada',\n  description: 'Learn about the story behind Lucky Pick Canada, a solo creative project built in Nova Scotia to bring everyday positivity and a little fun to the web.',\n};/,
  `export const metadata = {\n  title: 'About the Creator & Our Story | Lucky Pick Canada',\n  description: 'Learn about the story behind Lucky Pick Canada, a solo creative project built in Nova Scotia to bring everyday positivity and a little fun to the web.',\n  alternates: { canonical: '/about' },\n};`
);

// 2. Fix privacy (noindex and remove from sitemap OR fix canonical?)
// The prompt says "3 non-indexable URLs are currently present in the sitemap, including /about... correct the sitemap/canonical/indexability configuration so the sitemap contains only appropriate indexable URLs."
// If I make /privacy and /terms noindex, I must remove them from the sitemap. Let's do that, as privacy/terms are typically not indexed to save crawl budget, or maybe they just need canonicals.
// Let's add noindex to them and remove from sitemap.
updateFile('app/privacy/page.js',
  /export const metadata = {\n  title: 'Privacy Policy \| Lucky Pick Canada',\n};/,
  `export const metadata = {\n  title: 'Privacy Policy | Lucky Pick Canada',\n  robots: {\n    index: false,\n    follow: true,\n  },\n};`
);

updateFile('app/terms/page.js',
  /export const metadata = {\n  title: 'Terms of Service \| Lucky Pick Canada',\n};/,
  `export const metadata = {\n  title: 'Terms of Service | Lucky Pick Canada',\n  robots: {\n    index: false,\n    follow: true,\n  },\n};`
);

// 3. Update sitemap to remove privacy and terms
updateFile('app/sitemap.js',
  /    { url: `\${siteUrl}\/privacy`, changeFrequency: 'monthly', priority: 0.5 },\n    { url: `\${siteUrl}\/terms`, changeFrequency: 'monthly', priority: 0.5 },\n/,
  ''
);

// 4. Fix duplicate meta descriptions for indexable pages
const oldDesc = "Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.";

// Crystal Ball
updateFile('app/crystal-ball/page.js', oldDesc, 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.');
updateFile('app/crystal-ball/page.js', oldDesc, 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.');
updateFile('app/crystal-ball/page.js', oldDesc, 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.');

// Lucky Meter
// For lucky-meter, let's use the one from layout: 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Lucky Meter and reveal your unique digital energy reading.'
updateFile('app/lucky-meter/page.js', oldDesc, 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Lucky Meter and reveal your unique digital energy reading.');
updateFile('app/lucky-meter/page.js', oldDesc, 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Lucky Meter and reveal your unique digital energy reading.');
updateFile('app/lucky-meter/page.js', oldDesc, 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Lucky Meter and reveal your unique digital energy reading.');

// Map
updateFile('app/map/page.js', oldDesc, 'Explore the Lucky Map of Canada to read community stories of luck and everyday magic from across the country.');
updateFile('app/map/page.js', oldDesc, 'Explore the Lucky Map of Canada to read community stories of luck and everyday magic from across the country.');
updateFile('app/map/page.js', oldDesc, 'Explore the Lucky Map of Canada to read community stories of luck and everyday magic from across the country.');

// Reveal
updateFile('app/reveal/page.tsx', oldDesc, 'Reveal your daily collectible digital card from Lucky Pick Canada and build your collection of lucky moments.');
updateFile('app/reveal/page.tsx', oldDesc, 'Reveal your daily collectible digital card from Lucky Pick Canada and build your collection of lucky moments.');
updateFile('app/reveal/page.tsx', oldDesc, 'Reveal your daily collectible digital card from Lucky Pick Canada and build your collection of lucky moments.');

console.log('done');
