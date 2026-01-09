import { CategoryPageClient } from "./CategoryPageClient";
import { getAllNews } from "@/lib/news/repository";
import { getCategoryName } from "@/lib/utils/categories";
import { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Category Page - Path-based URL structure for SEO
 * 
 * URL Format: /category/ai (instead of /news?category=AI)
 * 
 * SEO Benefits:
 * - Clean, crawlable URLs without query parameters
 * - Better keyword targeting in URL structure
 * - Prevents duplicate content issues with query-based filtering
 * - Improves internal linking structure
 * - Server-rendered for optimal indexing
 */

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
    const { category } = await params;
    const categoryName = getCategoryName(category);

    if (!categoryName) {
        return {
            title: 'Category Not Found | NewsBlitz',
        };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';

    return {
        title: `${categoryName} News | NewsBlitz`,
        description: `Latest ${categoryName} news and updates. Stay informed with instant news summaries.`,
        alternates: {
            canonical: `${siteUrl}/category/${category}`,
        },
    };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    const categorySlug = category.toLowerCase();
    const categoryName = getCategoryName(categorySlug);

    if (!categoryName) {
        notFound();
    }

    // Fetch all articles and filter by category
    const allArticles = await getAllNews();
    const articles = allArticles.filter(article =>
        article.category?.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    return <CategoryPageClient articles={articles} categoryName={categoryName} categorySlug={categorySlug} />;
}

