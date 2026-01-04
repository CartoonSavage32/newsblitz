"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * GA4 Pageview Tracker
 * Tracks page views automatically on route changes
 */
export function GA4Tracker() {
  const pathname = usePathname();
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;

  useEffect(() => {
    if (!ga4Id || typeof window === 'undefined' || !window.gtag) {
      return;
    }

    // Track pageview
    window.gtag('config', ga4Id, {
      page_path: pathname,
    });
  }, [pathname, ga4Id]);

  return null;
}

/**
 * Track custom event (e.g., "Read more" click)
 */
export function trackGA4Event(eventName: string, parameters?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, parameters);
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

