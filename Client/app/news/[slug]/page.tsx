import { ReadMoreButton } from '@/components/news/ReadMoreButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { extractIdFromSlug, generateArticleSlug, normalizeUrl } from '@/lib/utils/slug';
import { format } from 'date-fns';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getArticleWithExpiredStatus, getRelatedArticles } from '@/lib/news/repository';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) {
    return { title: 'Article Not Found | NewsBlitz' };
  }

  const { article, lifecycleState } = await getArticleWithExpiredStatus(id);
  if (!article) {
    return { title: 'Article Not Found | NewsBlitz' };
  }

  const seoTitle = article.title.length > 60
    ? `${article.title.substring(0, 57)}...`
    : article.title;

  const metaDescription = article.description.length > 160
    ? `${article.description.substring(0, 157)}...`
    : article.description;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
  const articleUrl = normalizeUrl(siteUrl, `news/${slug}`);

  const robotsDirective = lifecycleState === 'gone' 
    ? { index: false, follow: true }
    : { index: true, follow: true };

  return {
    title: `${seoTitle} | NewsBlitz`,
    description: metaDescription,
    alternates: { canonical: articleUrl },
    robots: robotsDirective,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      url: articleUrl,
      images: [{ url: article.imageUrl, width: 1200, height: 630, alt: article.title }],
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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) {
    notFound();
  }

  const { article, lifecycleState } = await getArticleWithExpiredStatus(id);
  if (!article) {
    notFound();
  }

  // Gone state: 410 page
  if (lifecycleState === 'gone') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Article No Longer Available</h1>
          <p className="text-muted-foreground mb-6">
            This article has been permanently removed and is no longer available.
          </p>
          <Button asChild>
            <Link href="/news">Browse Latest News</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Expired state: archived UI
  if (lifecycleState === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Article Archived</h1>
          <p className="text-muted-foreground mb-6">
            This article has been archived. It was originally published on{' '}
            {format(article.date, 'MMMM d, yyyy')}.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            <strong>{article.title}</strong>
          </p>
          <Button asChild>
            <Link href="/news">Browse Latest News</Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedArticles = await getRelatedArticles(article.category, article.id, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsblitz.app';
  const articleUrl = normalizeUrl(siteUrl, `news/${slug}`);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.imageUrl,
    datePublished: article.date.toISOString(),
    dateModified: article.date.toISOString(),
    author: { '@type': 'Organization', name: article.publisher },
    publisher: {
      '@type': 'Organization',
      name: 'NewsBlitz',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon-192x192.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    articleSection: article.category,
    url: article.readMoreUrl,
  };

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${siteUrl}/news` },
      { '@type': 'ListItem', position: 3, name: article.category, item: normalizeUrl(siteUrl, `category/${article.category.toLowerCase()}`) },
      { '@type': 'ListItem', position: 4, name: article.title, item: articleUrl },
    ],
  };

  return (
    <>
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
          <div className="mb-6">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/news">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
              </Link>
            </Button>
          </div>

          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/news" className="hover:text-foreground transition-colors">News</Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href={`/category/${article.category.toLowerCase()}`}
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

          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-primary text-primary-foreground">{article.category}</Badge>
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

          <div className="mb-8">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>

          <article className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Note:</strong> This is an AI-summarized version of the original article.
              </p>
            </div>
            <div className="text-lg leading-relaxed">
              {article.description.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </article>

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

          <div className="mt-8 pt-8 border-t">
            <Link
              href={`/category/${article.category.toLowerCase()}`}
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
