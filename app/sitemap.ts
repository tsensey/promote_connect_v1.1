import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${APP_URL}/feed`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/annuaire`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${APP_URL}/chat`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${APP_URL}/agenda`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${APP_URL}/vitrine`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${APP_URL}/newsletter`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.4 },
    { url: `${APP_URL}/support`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.4 },
  ];

  return staticRoutes;
}
