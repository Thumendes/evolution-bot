/**
 * Generate a URL-safe slug from a string.
 * - Normalize unicode (NFD) and strip combining diacritics
 * - Lowercase
 * - Replace non-alphanumeric chars with hyphens
 * - Collapse consecutive hyphens
 * - Trim leading/trailing hyphens
 */
export function generateSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
