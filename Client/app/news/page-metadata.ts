import { Metadata } from 'next';

/**
 * Metadata for news listing page
 * Note: This is imported in a separate file because page.tsx is a client component
 */
export const newsPageMetadata: Metadata = {
  title: 'Latest News | NewsBlitz',
  description: 'Browse the latest news articles across AI, Health, Sports, Finance, Geopolitical, and Crypto. Get instant summaries of breaking news and trending stories.',
  openGraph: {
    title: 'Latest News | NewsBlitz',
    description: 'Browse the latest news articles across all categories with instant AI-powered summaries.',
  },
};

