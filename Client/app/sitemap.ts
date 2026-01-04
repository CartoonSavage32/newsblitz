import { MetadataRoute } from 'next';
import { generateArticleSlug } from '../src/lib/utils/slug';
import { getAllNews } from '../lib/news/repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
  const baseUrl = siteUrl;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Category pages
  const categories = ['AI', 'Health', 'Sports', 'Finance', 'Geopolitical', 'Crypto'];
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/news?category=${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  // Article pages
  try {
    const articles = await getAllNews();
    const articlePages: MetadataRoute.Sitemap = articles.map((article) => {
      const slug = generateArticleSlug(article.title, article.id);
      return {
        url: `${baseUrl}/news/${slug}`,
        lastModified: article.date,
        changeFrequency: 'hourly',
        priority: 0.7,
      };
    });

    return [...staticPages, ...categoryPages, ...articlePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages even if articles fail to load
    return [...staticPages, ...categoryPages];
  }
}

