import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.robinsonaisystems.com';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/products`, lastModified: now },
    { url: `${base}/contact`, lastModified: now },
  ];
}

