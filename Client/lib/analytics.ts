/**
 * Google Analytics 4 utility functions
 * Separated from component to support Fast Refresh
 */

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

/**
 * Track custom GA4 event (e.g., "Read more" click)
 * Can be called from any component
 */
export function trackGA4Event(eventName: string, parameters?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, parameters);
}

