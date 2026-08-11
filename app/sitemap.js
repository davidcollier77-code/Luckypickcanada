const siteUrl = 'https://luckypickcanada.ca';

export default function sitemap() {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/map`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/stories`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/lucky-meter`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.8 },
  ];
}
