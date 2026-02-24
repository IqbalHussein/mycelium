/**
 * Asset filtering denylist for Mycelium (FR-02).
 * Extensible list of file extensions and resource types to exclude
 * from the sequence diagram.
 */

/** File extensions to ignore (static assets). */
export const IGNORED_EXTENSIONS: string[] = [
  '.png', '.css', '.woff', '.woff2',
  '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.ttf', '.eot', '.map', '.js',
];

/** Chrome webRequest resource types to ignore. */
export const EXCLUDED_TYPES: string[] = [
  'image', 'stylesheet', 'font', 'media',
];

/**
 * Determines whether a request should be filtered out of the diagram.
 * @param url - The request URL.
 * @param resourceType - The chrome.webRequest resource type.
 * @returns true if the request should be dropped.
 */
export function shouldFilterRequest(url: string, resourceType: string): boolean {
  const cleanUrl = url.toLowerCase().split('?')[0];
  const isAsset = IGNORED_EXTENSIONS.some(ext => cleanUrl.endsWith(ext));
  const isExcludedType = EXCLUDED_TYPES.includes(resourceType);
  return isAsset || isExcludedType;
}
