import { MetadataRoute } from 'next';
import { normalizeUrl } from '@/lib/utils/slug';

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.vercel.app';
  const baseUrl = normalizeUrl(siteUrl);

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/news/', '/category/'],
        disallow: [
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
