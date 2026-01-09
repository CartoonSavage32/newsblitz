import { generateCategorySlug, normalizeUrl } from '@/lib/utils/slug';
import { NextResponse } from 'next/server';

/**
 * Static Pages Sitemap
 * Contains all static pages and category pages
 * 
 * SEO Strategy:
 * - Static pages change infrequently, so they're separated from volatile article content
 * - Category pages use path-based URLs (/category/ai) instead of query params for better SEO
 * - No changefreq/priority on articles (removed per requirements)
 */
export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
    const baseUrl = normalizeUrl(siteUrl);

    // Static pages
    const staticPages = [
        { path: '', priority: 1 },
        { path: 'news', priority: 0.9 },
        { path: 'feedback', priority: 0.5 },
        { path: 'about', priority: 0.5 },
    ];

    // Category pages - path-based URLs for SEO
    const categories = ['AI', 'Health', 'Sports', 'Finance', 'Geopolitical', 'Crypto'];
    const categoryPages = categories.map((category) => ({
        path: `category/${generateCategorySlug(category)}`,
        priority: 0.8,
    }));

    const now = new Date().toISOString();

    const urls = [
        ...staticPages.map((page) => ({
            loc: page.path ? `${baseUrl}/${page.path}` : baseUrl,
            lastmod: now,
            priority: page.priority,
        })),
        ...categoryPages.map((page) => ({
            loc: `${baseUrl}/${page.path}`,
            lastmod: now,
            priority: page.priority,
        })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(
        (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`
    ).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

