/**
 * Mermaid Sequence Diagram String Builder.
 *
 * Converts an array of NetworkRequest objects into a Mermaid.js
 * sequence diagram syntax string.
 */

import type { NetworkRequest } from '../../utils/types';

/** Maximum number of requests to include in the diagram. */
const MAX_REQUESTS = 30;

/**
 * Extracts the hostname from a URL for use as a participant name.
 * Falls back to "Unknown" for invalid URLs.
 */
export function extractParticipant(url: string): string {
  try {
    const { hostname } = new URL(url);
    // Sanitize for Mermaid (replace dots and hyphens for valid identifiers)
    return hostname || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/** Maximum path length before center-truncation kicks in. */
const MAX_PATH_LENGTH = 30;

/**
 * Extracts the pathname from a URL for the arrow label.
 * Paths exceeding MAX_PATH_LENGTH are center-truncated to preserve
 * both the leading route prefix and the trailing identifier/hash,
 * keeping the diagram at a consistent width.
 */
export function extractPath(url: string): string {
  try {
    const { pathname } = new URL(url);
    return truncatePath(pathname, MAX_PATH_LENGTH);
  } catch {
    return '/';
  }
}

/**
 * Center-truncates a path string, keeping the first `keep` and last `keep`
 * characters with an ellipsis in the middle.
 *
 * Example: "/assets/js/chunk-a1b2c3d4e5f6.min.js" → "/assets/js/c…6.min.js"
 */
export function truncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) return path;

  // Split the budget evenly between head and tail, accounting for the ellipsis
  const keep = Math.floor((maxLength - 1) / 2);  // 1 char for "…"
  const head = path.slice(0, keep);
  const tail = path.slice(-keep);
  return `${head}…${tail}`;
}

/**
 * Sanitizes a hostname to be a valid Mermaid participant alias.
 * Replaces dots and hyphens with underscores.
 */
export function sanitizeParticipant(hostname: string): string {
  return hostname.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Builds a complete Mermaid sequence diagram string from requests.
 * Caps at the last MAX_REQUESTS entries.
 *
 * @param requests - Array of network requests.
 * @returns Mermaid syntax string.
 */
export function buildSequenceDiagram(requests: NetworkRequest[]): string {
  // Only show the last N requests
  const capped = requests.slice(-MAX_REQUESTS);

  if (capped.length === 0) {
    return 'sequenceDiagram\n    Note over Browser: Waiting for traffic...';
  }

  // Collect unique participants
  const participantSet = new Set<string>();
  for (const req of capped) {
    participantSet.add(extractParticipant(req.url));
  }

  const lines: string[] = ['sequenceDiagram'];

  // Declare participants
  lines.push('    participant Browser');
  for (const host of participantSet) {
    const alias = sanitizeParticipant(host);
    if (alias !== 'Browser') {
      lines.push(`    participant ${alias} as ${host}`);
    }
  }

  // Draw arrows for each request
  for (const req of capped) {
    const host = extractParticipant(req.url);
    const alias = sanitizeParticipant(host);
    const path = extractPath(req.url);
    const label = `${req.method} ${path}`;

    // Request arrow
    lines.push(`    Browser->>${alias}: ${label}`);

    // Response arrow (if we have status code)
    if (req.statusCode !== undefined) {
      lines.push(`    ${alias}-->>Browser: ${req.statusCode}`);
    }
  }

  return lines.join('\n');
}
