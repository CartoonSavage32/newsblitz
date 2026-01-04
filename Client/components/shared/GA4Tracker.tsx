"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * GA4 Pageview Tracker Component
 * Tracks page views automatically on route changes
 * Uses Next.js App Router navigation events
 */
export function GA4Tracker() {
  const pathname = usePathname();
  // Support both env var names for backward compatibility
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  useEffect(() => {
    if (!ga4Id || typeof window === 'undefined' || !window.gtag) {
      return;
    }

    // Track pageview on route change
    window.gtag('config', ga4Id, {
      page_path: pathname,
    });
  }, [pathname, ga4Id]);

  return null;
}

