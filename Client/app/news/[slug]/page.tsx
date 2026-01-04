import { ReadMoreButton } from '@/components/ReadMoreButton';
import { Badge } from '@/components/ui/badge';
import { extractIdFromSlug, generateArticleSlug } from '@/lib/utils/slug';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getArticleById, getRelatedArticles } from '../../../lib/news/repository';

// Generate metadata for SEO
// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const id = extractIdFromSlug(params.slug);
  if (!id) {
    return {
      title: 'Article Not Found | NewsBlitz',
    };
  }

  const article = await getArticleById(id);
  if (!article) {
    return {
      title: 'Article Not Found | NewsBlitz',
    };
  }

  // Truncate title for SEO (max ~60 chars)
  const seoTitle = article.title.length > 60
    ? `${article.title.substring(0, 57)}...`
    : article.title;

  // Truncate description for meta (140-160 chars)
  const metaDescription = article.description.length > 160
    ? `${article.description.substring(0, 157)}...`
    : article.description;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
  const articleUrl = `${siteUrl}/news/${params.slug}`;

  return {
    title: `${seoTitle} | NewsBlitz`,
    description: metaDescription,
    alternates: {
      canonical: article.readMoreUrl, // Canonical to original source (SEO best practice for aggregated content)
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      url: articleUrl,
      images: [
        {
          url: article.imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      publishedTime: article.date.toISOString(),
      authors: [article.publisher],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [article.imageUrl],
    },
    other: {
      'article:published_time': article.date.toISOString(),
      'article:author': article.publisher,
      'article:section': article.category,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const id = extractIdFromSlug(params.slug);
  if (!id) {
    notFound();
  }

  const article = await getArticleById(id);
  if (!article) {
    notFound();
  }

  // Fetch related articles from same category for SEO internal linking
  const relatedArticles = await getRelatedArticles(article.category, article.id, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
  const articleSlug = params.slug;
  const articleUrl = `${siteUrl}/news/${articleSlug}`;

  // Structured data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.imageUrl,
    datePublished: article.date.toISOString(),
    dateModified: article.date.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.publisher,
    },
    publisher: {
      '@type': 'Organization',
      name: 'NewsBlitz',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: article.category,
    // Canonical link to original source
    url: article.readMoreUrl,
  };

  // Breadcrumb structured data for SEO
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'News',
        item: `${siteUrl}/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.category,
        item: `${siteUrl}/news?category=${encodeURIComponent(article.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <>
      {/* Structured Data (JSON-LD) for SEO - placed in head via Next.js Script */}
      <Script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumbs for SEO */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/news" className="hover:text-foreground transition-colors">
                  News
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href={`/news?category=${encodeURIComponent(article.category)}`}
                  className="hover:text-foreground transition-colors"
                >
                  {article.category}
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground truncate max-w-xs" aria-current="page">
                {article.title}
              </li>
            </ol>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-primary text-primary-foreground">
                {article.category}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.date.toISOString()}>
                  {format(article.date, 'MMMM d, yyyy')}
                </time>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Published by: <strong className="text-foreground">{article.publisher}</strong></span>
            </div>
          </header>

          {/* Article Image */}
          <div className="mb-8">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Note:</strong> This is an AI-summarized version of the original article.
              </p>
            </div>

            <div className="text-lg leading-relaxed">
              {article.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          {/* Source Attribution & Read More */}
          <div className="border-t pt-8 mt-8">
            <div className="bg-muted/30 p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Source:</strong>{' '}
                <a
                  href={article.readMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {article.publisher}
                </a>
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                This summary was generated using AI and may not capture all details from the original article.
                Please read the full article for complete information.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <ReadMoreButton
                  url={article.readMoreUrl}
                  articleId={article.id}
                  articleTitle={article.title}
                />
              </div>
              {/* Link to original source for attribution */}
              <p className="text-xs text-muted-foreground">
                Original article:{' '}
                <a
                  href={article.readMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {article.readMoreUrl}
                </a>
              </p>
            </div>
          </div>

          {/* Related Articles Section - SEO Internal Linking */}
          {relatedArticles.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-4">More {article.category} News</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedArticles.map((related) => {
                  const relatedSlug = generateArticleSlug(related.title, related.id);
                  return (
                    <Link
                      key={related.id}
                      href={`/news/${relatedSlug}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="font-semibold mb-2 line-clamp-2">{related.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{related.description}</p>
                      <time className="text-xs text-muted-foreground mt-2 block">
                        {format(related.date, 'MMM d, yyyy')}
                      </time>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Link */}
          <div className="mt-8 pt-8 border-t">
            <Link
              href={`/news?category=${encodeURIComponent(article.category)}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← More {article.category} news
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

