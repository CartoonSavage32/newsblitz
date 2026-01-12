import type { NewsArticle } from '@/lib/schema';
import { supabase } from '../supabase/client';

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

// Lifecycle: active (0-48h) → expired (48h-7d) → gone (7-30d) → deleted
export type ArticleLifecycleState = 'active' | 'expired' | 'gone' | 'deleted';

// Get all non-expired articles, sorted newest first
export async function getAllNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('expired', false)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch news: ${error.message}`);
  }

  return (data || []).map(transformDBArticleToNewsArticle);
}

function transformDBArticleToNewsArticle(dbArticle: DBArticle): NewsArticle {
  const defaultImage = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM=";

  const imageUrl = dbArticle.image_url && dbArticle.image_url.trim() !== ''
    ? dbArticle.image_url
    : defaultImage;

  const articleDate = dbArticle.published_at
    ? new Date(dbArticle.published_at)
    : new Date(dbArticle.created_at);

  const readMoreUrl = dbArticle.article_url && dbArticle.article_url.trim() !== ''
    ? dbArticle.article_url
    : '#';

  return {
    id: dbArticle.id,
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

// Get articles by category, sorted newest first
export async function getNewsByCategory(category: string): Promise<DBArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('category', category)
    .eq('expired', false)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

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

// Get article by ID (supports 8-char prefix), includes expired for 410 handling
export async function getArticleById(id: string, includeExpired: boolean = true): Promise<NewsArticle | null> {
  let data: DBArticle | null = null;

  if (id.length === 8) {
    // 8-char prefix: fetch articles and find by prefix
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.eq('expired', false);
    }

    const { data: articles, error } = await query;
    if (!error && articles) {
      data = articles.find((a: DBArticle) => a.id.startsWith(id)) || null;
    }
  } else {
    // Full UUID - exact match
    let query = supabase
      .from('news_articles')
      .select('*')
      .eq('id', id);

    if (!includeExpired) {
      query = query.eq('expired', false);
    }

    const { data: exactMatch, error } = await query.single();
    if (!error && exactMatch) {
      data = exactMatch as DBArticle;
    }
  }

  if (!data) {
    return null;
  }

  return transformDBArticleToNewsArticle(data);
}

function getArticleLifecycleState(dbArticle: DBArticle): ArticleLifecycleState {
  const now = new Date();

  if (!dbArticle.expired_at) {
    return dbArticle.expired ? 'expired' : 'active';
  }

  const expiredAt = new Date(dbArticle.expired_at);
  const goneAt = dbArticle.gone_at ? new Date(dbArticle.gone_at) : null;
  const deletedAt = dbArticle.deleted_at ? new Date(dbArticle.deleted_at) : null;

  if (now < expiredAt) return 'active';
  if (goneAt && now < goneAt) return 'expired';
  if (deletedAt && now < deletedAt) return 'gone';
  return 'deleted';
}

// Get article with lifecycle state for SEO handling
export async function getArticleWithExpiredStatus(id: string): Promise<{
  article: NewsArticle | null;
  expired: boolean;
  lifecycleState: ArticleLifecycleState;
}> {
  let data: DBArticle | null = null;

  if (id.length === 8) {
    // 8-char prefix: fetch recent articles and find by prefix
    // Order by created_at desc to get newest first (more likely to match)
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && articles) {
      data = articles.find((a: DBArticle) => a.id.startsWith(id)) || null;
    }
  } else {
    // Full UUID - exact match
    const { data: exactMatch, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && exactMatch) {
      data = exactMatch as DBArticle;
    }
  }

  if (!data) {
    return { article: null, expired: false, lifecycleState: 'deleted' };
  }

  const dbArticle = data as DBArticle;
  const lifecycleState = getArticleLifecycleState(dbArticle);
  const expired = lifecycleState !== 'active';
  const article = transformDBArticleToNewsArticle(dbArticle);

  return { article, expired, lifecycleState };
}

// Get related articles for SEO internal linking
export async function getRelatedArticles(category: string, excludeId: string, limit: number = 3): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('category', category)
    .eq('expired', false)
    .neq('id', excludeId)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(transformDBArticleToNewsArticle);
}

// Get active articles for sitemap (only 0-48h old)
export async function getRecentArticlesForSitemap(): Promise<Array<{ id: string; title: string; date: Date }>> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, published_at, created_at, expired_at, expired')
    .or(`expired_at.gt.${now},and(expired_at.is.null,expired.eq.false)`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error || !data) {
    return [];
  }

  return data.map((article: { id: string; title: string; published_at: string | null; created_at: string }) => ({
    id: article.id,
    title: article.title,
    date: article.published_at ? new Date(article.published_at) : new Date(article.created_at),
  }));
}

// Get all article IDs for sitemap
export async function getAllArticleIds(): Promise<Array<{ id: string; updated_at: string }>> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, published_at, created_at')
    .eq('expired', false)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((article: { id: string; published_at: string | null; created_at: string }) => ({
    id: article.id,
    updated_at: article.published_at || article.created_at,
  }));
}
