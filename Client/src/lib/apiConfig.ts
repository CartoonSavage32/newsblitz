// API routes are now in the same Next.js app
export const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
export const NEWS_DATA_API_URL = API_BASE_URL;