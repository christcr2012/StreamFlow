import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.robinsonaisystems.com';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/why-robinson`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/approach`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/case-studies`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

