import { supabase } from '../supabase/client';
import type { NewsArticle } from '../../src/shared/schema';

// Database article type (matches Supabase schema)
type DBArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  image_url: string | null;
  source: string;
  published_at: string | null;
  article_url: string;
  raw: Record<string, unknown>;
  created_at: string;
};

export async function getAllNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch news: ${error.message}`);
  }

  // Transform DBArticle to NewsArticle format expected by frontend
  return (data || []).map(transformDBArticleToNewsArticle);
}

/**
 * Transform database article to frontend NewsArticle format
 */
function transformDBArticleToNewsArticle(dbArticle: DBArticle): NewsArticle {
  // Default image if none provided (same as used in Python ingestion)
  const defaultImage = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM=";

  // Ensure imageUrl is never empty - use default if null, undefined, or empty string
  const imageUrl = dbArticle.image_url && dbArticle.image_url.trim() !== ''
    ? dbArticle.image_url
    : defaultImage;

  // Use published_at if available, otherwise fallback to created_at (never use today's date)
  const articleDate = dbArticle.published_at
    ? new Date(dbArticle.published_at)
    : new Date(dbArticle.created_at);

  // Ensure readMoreUrl is never empty
  const readMoreUrl = dbArticle.article_url && dbArticle.article_url.trim() !== ''
    ? dbArticle.article_url
    : '#';

  return {
    id: dbArticle.id, // Unique database ID for React keys
    news_number: dbArticle.raw?.news_number as number || 0,
    title: dbArticle.title,
    imageUrl: imageUrl,
    category: dbArticle.category,
    publisher: dbArticle.source,
    description: dbArticle.summary || '',
    date: articleDate,
    readMoreUrl: readMoreUrl,
  };
}

export async function getNewsByCategory(category: string): Promise<DBArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch news by category: ${error.message}`);
  }

  return (data || []) as DBArticle[];
}

export async function insertNewsArticle(article: Omit<DBArticle, 'id' | 'created_at'>): Promise<DBArticle> {
  const { data, error } = await supabase
    .from('news_articles')
    .insert(article)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert article: ${error.message}`);
  }

  return data;
}

export async function insertNewsArticles(articles: Omit<DBArticle, 'id' | 'created_at'>[]): Promise<DBArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .insert(articles)
    .select();

  if (error) {
    throw new Error(`Failed to insert articles: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single article by ID for SEO pages
 */
export async function getArticleById(id: string): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return transformDBArticleToNewsArticle(data as DBArticle);
}

/**
 * Get related articles from the same category (excluding current article)
 * Used for SEO internal linking
 */
export async function getRelatedArticles(category: string, excludeId: string, limit: number = 3): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('category', category)
    .neq('id', excludeId)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(transformDBArticleToNewsArticle);
}

/**
 * Get all article IDs for sitemap generation
 */
export async function getAllArticleIds(): Promise<Array<{ id: string; updated_at: string }>> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, published_at, created_at')
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error || !data) {
    return [];
  }

  return data.map((article) => ({
    id: article.id,
    updated_at: article.published_at || article.created_at,
  }));
}

