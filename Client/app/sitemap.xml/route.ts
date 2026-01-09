import { normalizeUrl } from '@/lib/utils/slug';
import { NextResponse } from 'next/server';

/**
 * Sitemap Index - Main entry point
 * Returns XML sitemap index that references child sitemaps
 * 
 * SEO Benefits:
 * - Reduces sitemap size and improves parsing speed
 * - Allows Google to prioritize fresh content (articles sitemap)
 * - Separates static pages from dynamic content
 * - Enables pagination without bloating the main sitemap
 * 
 * This structure is optimal for Google News-style sites because:
 * - Static pages change infrequently (sitemap-pages.xml)
 * - Articles are volatile and update every 3 hours (sitemap-articles.xml)
 * - Google can crawl each sitemap independently based on update frequency
 */
export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
    const baseUrl = normalizeUrl(siteUrl);
    const now = new Date().toISOString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap-pages.xml`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap-articles.xml`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

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

