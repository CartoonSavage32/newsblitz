import { Metadata } from 'next';
import { defaultMetadata } from '../metadata';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Latest News | NewsBlitz',
  description: 'Browse the latest news articles across AI, Health, Sports, Finance, Geopolitical, and Crypto. Get instant summaries of breaking news and trending stories.',
  openGraph: {
    ...defaultMetadata.openGraph,
    title: 'Latest News | NewsBlitz',
    description: 'Browse the latest news articles across all categories with instant AI-powered summaries.',
    url: `${defaultMetadata.metadataBase}/news`,
  },
};

