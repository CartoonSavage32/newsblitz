/**
 * Generate a URL-friendly slug from article title and ID
 * Format: title-slug-id
 * Ensures stable, deterministic slugs for SEO
 */
export function generateArticleSlug(title: string, id: string): string {
  // Create slug from title: lowercase, replace spaces/special chars with hyphens
  const titleSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Use first 8 chars of ID for uniqueness
  const idShort = id.substring(0, 8);

  // Combine: title-slug-id
  return `${titleSlug}-${idShort}`;
}

/**
 * Extract article ID from slug
 * Returns the ID portion (last segment after last hyphen)
 * Slug format: title-slug-8charid
 */
export function extractIdFromSlug(slug: string | undefined): string | null {
  if (!slug) return null;
  const parts = slug.split('-');
  if (parts.length < 2) return null;

  // Last part should be the 8-char ID
  const idPart = parts[parts.length - 1];
  
  // Return the last part if it's 8 chars (hex), otherwise return null
  // This matches the format used in generateArticleSlug
  if (idPart.length === 8 && /^[0-9a-f]+$/i.test(idPart)) {
    return idPart;
  }
  
  return null;
}

/**
 * Normalize URL to ensure single slashes and no trailing slash (except root)
 * Prevents double slashes and ensures clean URLs for SEO
 */
export function normalizeUrl(baseUrl: string, path: string = ''): string {
  // Remove trailing slash from baseUrl (except if it's just the domain)
  const cleanBase = baseUrl.replace(/\/+$/, '') || baseUrl;
  
  // Ensure path starts with single slash
  const cleanPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  
  // Combine and remove any double slashes (except after protocol)
  const combined = `${cleanBase}${cleanPath}`;
  return combined.replace(/([^:]\/)\/+/g, '$1');
}

/**
 * Generate category slug from category name
 * Converts category to lowercase URL-friendly format
 */
export function generateCategorySlug(category: string): string {
  return category.toLowerCase().trim();
}

