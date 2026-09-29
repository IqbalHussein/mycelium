/**
 * Mermaid Sequence Diagram String Builder.
 *
 * Converts an array of NetworkRequest objects into a Mermaid.js
 * sequence diagram syntax string.
 */

import type { NetworkRequest } from '../../utils/types';

/** Maximum number of requests to include in the diagram. */
export const MAX_DIAGRAM_REQUESTS = 30;

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
 * Escapes characters that Mermaid treats as syntax inside message text.
 * `;` ends a statement and `#` starts an entity code, so both are
 * replaced with their Mermaid entity codes.
 */
export function escapeMessageText(text: string): string {
  return text.replace(/[#;]/g, (ch) => `#${ch.charCodeAt(0)};`);
}

/**
 * Maps each hostname to a unique Mermaid participant alias. Hosts that
 * sanitize to the same alias (e.g. "a-b.com" and "a_b.com") get a
 * numeric suffix so they stay separate participants.
 */
function assignAliases(hosts: Iterable<string>): Map<string, string> {
  const aliases = new Map<string, string>();
  const used = new Set<string>(['Browser']);
  for (const host of hosts) {
    if (aliases.has(host)) continue;
    const base = sanitizeParticipant(host);
    let alias = base;
    for (let n = 2; used.has(alias); n++) {
      alias = `${base}_${n}`;
    }
    used.add(alias);
    aliases.set(host, alias);
  }
  return aliases;
}

/**
 * Returns, for each message arrow in the diagram (in render order), the
 * index into the capped request list it belongs to. Response arrows map
 * to the same request as their request arrow.
 */
export function buildMessageIndex(requests: NetworkRequest[]): number[] {
  const capped = requests.slice(-MAX_DIAGRAM_REQUESTS);
  const index: number[] = [];
  capped.forEach((req, i) => {
    index.push(i);
    if (req.statusCode !== undefined) index.push(i);
  });
  return index;
}

/**
 * Builds a complete Mermaid sequence diagram string from requests.
 * Caps at the last MAX_DIAGRAM_REQUESTS entries.
 *
 * @param requests - Array of network requests.
 * @returns Mermaid syntax string.
 */
export function buildSequenceDiagram(requests: NetworkRequest[]): string {
  // Only show the last N requests
  const capped = requests.slice(-MAX_DIAGRAM_REQUESTS);

  if (capped.length === 0) {
    return 'sequenceDiagram\n    Note over Browser: Waiting for traffic...';
  }

  const aliases = assignAliases(capped.map((req) => extractParticipant(req.url)));

  const lines: string[] = ['sequenceDiagram'];

  // Declare participants
  lines.push('    participant Browser');
  for (const [host, alias] of aliases) {
    lines.push(`    participant ${alias} as ${host}`);
  }

  // Draw arrows for each request
  for (const req of capped) {
    const alias = aliases.get(extractParticipant(req.url))!;
    const path = extractPath(req.url);
    const label = escapeMessageText(`${req.method} ${path}`);

    // Request arrow
    lines.push(`    Browser->>${alias}: ${label}`);

    // Response arrow (if we have status code)
    if (req.statusCode !== undefined) {
      lines.push(`    ${alias}-->>Browser: ${req.statusCode}`);
    }
  }

  return lines.join('\n');
}
