/**
 * Category mapping utilities
 * Maps category slugs to display names
 */

export const categoryMap: Record<string, string> = {
  'ai': 'AI',
  'health': 'Health',
  'sports': 'Sports',
  'finance': 'Finance',
  'geopolitical': 'Geopolitical',
  'crypto': 'Crypto',
};

/**
 * Get category name from slug
 */
export function getCategoryName(slug: string): string | null {
  return categoryMap[slug.toLowerCase()] || null;
}

/**
 * Get category slug from name
 */
export function getCategorySlug(name: string): string {
  return name.toLowerCase();
}

