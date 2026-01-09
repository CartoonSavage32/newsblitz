import { generateArticleSlug, normalizeUrl } from '@/lib/utils/slug';
import { NextResponse } from 'next/server';
import { getRecentArticlesForSitemap } from '@/lib/news/repository';

const MAX_URLS_PER_SITEMAP = 1000;

/**
 * Articles Sitemap
 * Contains ONLY ACTIVE articles (now < expired_at, i.e., 0-48 hours old)
 * Automatically paginates if more than 1000 URLs
 * 
 * SEO Strategy:
 * - Includes ONLY articles in ACTIVE state (now < expired_at)
 * - NEVER includes expired or gone articles
 * - Pagination ensures Google can process the sitemap efficiently
 * - No changefreq/priority per requirements (Google ignores these for news sites)
 * 
 * Sitemap Inclusion Rules:
 * - ACTIVE (0-48 hours): YES - include in sitemap
 * - EXPIRED (48h - 7d): NO - removed from sitemap
 * - GONE (7d - 30d): NO - removed from sitemap
 */
export async function GET(request: Request) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
    const baseUrl = normalizeUrl(siteUrl);

    // Check if this is a paginated request (e.g., sitemap-articles-1.xml)
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pageMatch = pathname.match(/sitemap-articles-(\d+)\.xml/);
    const pageNumber = pageMatch ? parseInt(pageMatch[1], 10) : 1;

    try {
        // Get ACTIVE articles only (now < expired_at)
        const articles = await getRecentArticlesForSitemap();

        // Paginate if needed
        const startIndex = (pageNumber - 1) * MAX_URLS_PER_SITEMAP;
        const endIndex = startIndex + MAX_URLS_PER_SITEMAP;
        const paginatedArticles = articles.slice(startIndex, endIndex);

        // If this is page 1 and there are more articles, we need to handle pagination
        // For now, we'll generate the first page. If more pages are needed, 
        // they should be referenced in the main sitemap index

        const urls = paginatedArticles.map((article) => {
            const slug = generateArticleSlug(article.title, article.id);
            return {
                loc: `${baseUrl}/news/${slug}`,
                lastmod: article.date.toISOString(),
            };
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(
            (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`
        ).join('\n')}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
    } catch (error) {
        console.error('Error generating articles sitemap:', error);
        // Return empty sitemap on error
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
            {
                headers: {
                    'Content-Type': 'application/xml',
                },
            }
        );
    }
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

