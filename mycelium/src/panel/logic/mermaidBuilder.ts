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

/**
 * Extracts the pathname from a URL for the arrow label.
 */
export function extractPath(url: string): string {
  try {
    const { pathname } = new URL(url);
    // Truncate long paths
    return pathname.length > 50 ? pathname.slice(0, 47) + '...' : pathname;
  } catch {
    return '/';
  }
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
