import { MetadataRoute } from 'next';
import { normalizeUrl } from '@/lib/utils/slug';

/**
 * Robots.txt Configuration
 * 
 * SEO Strategy:
 * - Disallow query-based URLs to prevent duplicate content issues
 * - Allow path-based category URLs (/category/ai) for proper indexing
 * - Reference sitemap index for efficient crawling
 * 
 * Why disallow query params?
 * - Query params create duplicate content (same content, different URLs)
 * - Path-based URLs are better for SEO and keyword targeting
 * - Prevents crawl waste on filtered views
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
  const baseUrl = normalizeUrl(siteUrl);

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/news/', '/category/'],
        disallow: [
          '/api/',
          '/_next/',
          '/news?*', // Disallow query-based category filtering
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/news/', '/category/'],
        disallow: [
          '/api/',
          '/_next/',
          '/news?*', // Disallow query-based category filtering
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

