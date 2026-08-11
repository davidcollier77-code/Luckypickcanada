const siteUrl = 'https://luckypickcanada.ca';

export default function sitemap() {
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/map`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/stories`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/lucky-meter`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.8 },
  ];
}
