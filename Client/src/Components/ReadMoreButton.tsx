"use client";

import { ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface ReadMoreButtonProps {
  url: string;
  articleId: string;
  articleTitle: string;
}

export function ReadMoreButton({ url, articleId, articleTitle }: ReadMoreButtonProps) {
  const handleClick = () => {
    // Track "Read more" click event for GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'read_more_click', {
        article_id: articleId,
        article_title: articleTitle,
        source_url: url,
      });
    }
  };

  return (
    <Button
      asChild
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
      onClick={handleClick}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2"
      >
        Read Full Article
        <ExternalLink className="h-4 w-4" />
      </a>
    </Button>
  );
}

