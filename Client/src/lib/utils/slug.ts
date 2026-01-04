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
 */
export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  if (parts.length < 2) return null;
  
  // Last part should be the ID
  const idPart = parts[parts.length - 1];
  return idPart.length === 8 ? idPart : null;
}

