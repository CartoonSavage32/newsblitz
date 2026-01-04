import { Metadata } from 'next';

/**
 * Metadata for homepage
 * Note: This is imported in a separate file because page.tsx is a client component
 */
export const homepageMetadata: Metadata = {
  title: 'NewsBlitz - Instant News Summaries | Stay Informed',
  description: 'Get the latest news summaries from AI, Health, Sports, Finance, Geopolitical, and Crypto. Stay informed with concise, AI-powered news summaries delivered instantly.',
  openGraph: {
    title: 'NewsBlitz - Instant News Summaries',
    description: 'Get the latest news summaries from AI, Health, Sports, Finance, Geopolitical, and Crypto.',
  },
};

