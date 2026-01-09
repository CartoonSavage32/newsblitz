import type { NewsArticle } from '@/lib/schema';
import { supabase } from '../supabase/client';

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
  expired?: boolean;
  expired_at?: string | null;
  gone_at?: string | null;
  deleted_at?: string | null;
};

/**
 * Article lifecycle states for SEO handling
 * ACTIVE: 0-48 hours (now < expired_at) - HTTP 200, in sitemap
 * EXPIRED: 48 hours - 7 days (expired_at <= now < gone_at) - HTTP 200, archived UI
 * GONE: 7-30 days (gone_at <= now < deleted_at) - HTTP 410, noindex
 * DELETED: 30+ days (now >= deleted_at) - physically deleted (404)
 */
export type ArticleLifecycleState = 'active' | 'expired' | 'gone' | 'deleted';

/**
 * Get all non-expired news articles
 * Excludes expired articles from regular listings (but they remain accessible via direct URL)
 */
export async function getAllNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('expired', false) // Only fetch non-expired articles
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
    .eq('expired', false) // Only fetch non-expired articles
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
 * Supports both full UUID and 8-char prefix lookup
 * Returns expired articles too (for 410 handling)
 */
export async function getArticleById(id: string, includeExpired: boolean = true): Promise<NewsArticle | null> {
  // Try exact match first (for full UUID)
  let query = supabase
    .from('news_articles')
    .select('*')
    .eq('id', id);
  
  // Only filter expired if we don't want to include them
  if (!includeExpired) {
    query = query.eq('expired', false);
  }
  
  let { data, error } = await query.single();

  // If not found and ID is 8 chars, try prefix match
  // UUIDs in Supabase are stored as text, so we can use text pattern matching
  if ((error || !data) && id.length === 8) {
    // Fetch articles and filter client-side for prefix match
    let prefixQuery = supabase
      .from('news_articles')
      .select('*')
      .limit(1000); // Reasonable limit
    
    if (!includeExpired) {
      prefixQuery = prefixQuery.eq('expired', false);
    }
    
    const { data: allData, error: allError } = await prefixQuery;

    if (!allError && allData) {
      // Find article with ID starting with the 8-char prefix
      const matched = allData.find((article: DBArticle) => article.id.startsWith(id));
      if (matched) {
        data = matched;
        error = null;
      }
    }
  }

  if (error || !data) {
    return null;
  }

  return transformDBArticleToNewsArticle(data as DBArticle);
}

/**
 * Determine article lifecycle state based on timestamps
 * ACTIVE: now < expired_at (0-48 hours)
 * EXPIRED: expired_at <= now < gone_at (48 hours - 7 days)
 * GONE: gone_at <= now < deleted_at (7-30 days)
 * DELETED: now >= deleted_at (30+ days, should be physically deleted)
 */
function getArticleLifecycleState(dbArticle: DBArticle): ArticleLifecycleState {
  const now = new Date();
  
  // If timestamps don't exist, fall back to expired boolean
  if (!dbArticle.expired_at) {
    return dbArticle.expired ? 'expired' : 'active';
  }
  
  const expiredAt = new Date(dbArticle.expired_at);
  const goneAt = dbArticle.gone_at ? new Date(dbArticle.gone_at) : null;
  const deletedAt = dbArticle.deleted_at ? new Date(dbArticle.deleted_at) : null;
  
  if (now < expiredAt) {
    return 'active';
  }
  
  if (goneAt && now < goneAt) {
    return 'expired';
  }
  
  if (deletedAt && now < deletedAt) {
    return 'gone';
  }
  
  return 'deleted';
}

/**
 * Get article with lifecycle state for SEO handling
 * Returns the article and its lifecycle state (active/expired/gone/deleted)
 * 
 * Lifecycle states:
 * - active: HTTP 200, normal page
 * - expired: HTTP 200, archived UI
 * - gone: HTTP 410, noindex
 * - deleted: Row should not exist (404)
 */
export async function getArticleWithExpiredStatus(id: string): Promise<{ 
  article: NewsArticle | null; 
  expired: boolean;
  lifecycleState: ArticleLifecycleState;
}> {
  // Try exact match first
  let { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('id', id)
    .single();

  // If not found and ID is 8 chars, try prefix match
  if ((error || !data) && id.length === 8) {
    const { data: allData, error: allError } = await supabase
      .from('news_articles')
      .select('*')
      .limit(1000);

    if (!allError && allData) {
      const matched = allData.find((article: DBArticle) => article.id.startsWith(id));
      if (matched) {
        data = matched;
        error = null;
      }
    }
  }

  if (error || !data) {
    return { article: null, expired: false, lifecycleState: 'deleted' };
  }

  const dbArticle = data as DBArticle;
  const lifecycleState = getArticleLifecycleState(dbArticle);
  const expired = lifecycleState !== 'active';
  const article = transformDBArticleToNewsArticle(dbArticle);

  return { article, expired, lifecycleState };
}

/**
 * Get related articles from the same category (excluding current article)
 * Used for SEO internal linking
 * Only returns non-expired articles
 */
export async function getRelatedArticles(category: string, excludeId: string, limit: number = 3): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('category', category)
    .eq('expired', false) // Only non-expired articles
    .neq('id', excludeId)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(transformDBArticleToNewsArticle);
}

/**
 * Get ACTIVE articles for sitemap generation
 * Only includes articles where now < expired_at (ACTIVE state)
 * Used for sitemap-articles.xml - NEVER include expired or gone articles
 * 
 * Sitemap inclusion rules:
 * - ACTIVE (0-48 hours): YES - include in sitemap
 * - EXPIRED (48 hours - 7 days): NO - removed from sitemap
 * - GONE (7-30 days): NO - removed from sitemap
 */
export async function getRecentArticlesForSitemap(): Promise<Array<{ id: string; title: string; date: Date }>> {
  const now = new Date().toISOString();

  // Only fetch articles where expired_at > now (ACTIVE state)
  // Also check expired boolean for backward compatibility
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, published_at, created_at, expired_at, expired')
    .or(`expired_at.gt.${now},and(expired_at.is.null,expired.eq.false)`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(10000); // Large limit, we'll paginate in sitemap

  if (error || !data) {
    return [];
  }

  return data.map((article: { id: string; title: string; published_at: string | null; created_at: string }) => ({
    id: article.id,
    title: article.title,
    date: article.published_at ? new Date(article.published_at) : new Date(article.created_at),
  }));
}

/**
 * Get all article IDs for sitemap generation
 * Only includes non-expired articles
 */
export async function getAllArticleIds(): Promise<Array<{ id: string; updated_at: string }>> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, published_at, created_at')
    .eq('expired', false) // Only non-expired articles
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error || !data) {
    return [];
  }

  return data.map((article: { id: string; published_at: string | null; created_at: string }) => ({
    id: article.id,
    updated_at: article.published_at || article.created_at,
  }));
}

