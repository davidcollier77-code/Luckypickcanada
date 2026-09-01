const siteUrl = 'https://luckypickcanada.ca';

export default function sitemap() {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/lucky-meter`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/map`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/crystal-ball`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/stories`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/terms`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
