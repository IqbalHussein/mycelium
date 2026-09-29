/**
 * Unit tests for the Mermaid sequence diagram builder.
 */

import { describe, it, expect } from 'vitest';
import {
  buildMessageIndex,
  buildSequenceDiagram,
  escapeMessageText,
  extractParticipant,
  extractPath,
  sanitizeParticipant,
  truncatePath,
} from './mermaidBuilder';
import type { NetworkRequest } from '../../utils/types';

function makeRequest(overrides: Partial<NetworkRequest> = {}): NetworkRequest {
  return {
    requestId: '1',
    url: 'https://api.example.com/users',
    method: 'GET',
    timestamp: Date.now(),
    type: 'xmlhttprequest',
    ...overrides,
  };
}

describe('extractParticipant', () => {
  it('extracts hostname from a valid URL', () => {
    expect(extractParticipant('https://api.example.com/users')).toBe('api.example.com');
  });

  it('returns "Unknown" for invalid URL', () => {
    expect(extractParticipant('not-a-url')).toBe('Unknown');
  });
});

describe('truncatePath', () => {
  it('returns short paths unchanged', () => {
    expect(truncatePath('/users/123', 30)).toBe('/users/123');
  });

  it('returns paths at exactly maxLength unchanged', () => {
    const path = '/a'.repeat(15); // 30 chars
    expect(truncatePath(path, 30)).toBe(path);
  });

  it('center-truncates long paths with ellipsis', () => {
    const path = '/assets/js/chunk-a1b2c3d4e5f6g7h8.min.js';
    const result = truncatePath(path, 30);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('…');
    // Should keep the beginning and end
    expect(result.startsWith('/assets')).toBe(true);
    expect(result.endsWith('.min.js')).toBe(true);
  });

  it('preserves start and end of CDN-hashed URLs', () => {
    const path = '/static/media/hero-image-abc123def456.webp';
    const result = truncatePath(path, 30);
    expect(result).toContain('…');
    expect(result.startsWith('/static')).toBe(true);
    expect(result.endsWith('.webp')).toBe(true);
  });
});

describe('extractPath', () => {
  it('extracts pathname from URL', () => {
    expect(extractPath('https://api.example.com/users/123')).toBe('/users/123');
  });

  it('center-truncates long paths', () => {
    const longPath = '/assets/js/chunk-' + 'x'.repeat(40) + '.min.js';
    const result = extractPath(`https://example.com${longPath}`);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('…');
  });

  it('returns "/" for invalid URL', () => {
    expect(extractPath('bad')).toBe('/');
  });
});

describe('sanitizeParticipant', () => {
  it('replaces dots and hyphens with underscores', () => {
    expect(sanitizeParticipant('api.example.com')).toBe('api_example_com');
  });

  it('handles already-clean names', () => {
    expect(sanitizeParticipant('localhost')).toBe('localhost');
  });
});

describe('buildSequenceDiagram', () => {
  it('returns a "waiting" message for empty requests', () => {
    const result = buildSequenceDiagram([]);
    expect(result).toContain('sequenceDiagram');
    expect(result).toContain('Waiting for traffic');
  });

  it('generates a valid diagram for a single request', () => {
    const result = buildSequenceDiagram([makeRequest()]);
    expect(result).toContain('sequenceDiagram');
    expect(result).toContain('participant Browser');
    expect(result).toContain('api_example_com');
    expect(result).toContain('GET /users');
  });

  it('includes response arrow when statusCode is present', () => {
    const result = buildSequenceDiagram([makeRequest({ statusCode: 200 })]);
    expect(result).toContain('-->>Browser: 200');
  });

  it('omits response arrow when statusCode is missing', () => {
    const result = buildSequenceDiagram([makeRequest()]);
    expect(result).not.toContain('-->>Browser');
  });

  it('caps diagram to last 30 requests', () => {
    const requests = Array.from({ length: 40 }, (_, i) =>
      makeRequest({ requestId: String(i), url: `https://api.example.com/r${i}` }),
    );
    const result = buildSequenceDiagram(requests);

    // Should contain request 39 (last) but not request 0 (first, beyond cap)
    expect(result).toContain('/r39');
    expect(result).not.toContain('/r0');
  });

  it('handles multiple unique hosts', () => {
    const result = buildSequenceDiagram([
      makeRequest({ url: 'https://auth.example.com/login' }),
      makeRequest({ url: 'https://api.example.com/users', requestId: '2' }),
    ]);
    expect(result).toContain('auth_example_com');
    expect(result).toContain('api_example_com');
  });
});

describe('escapeMessageText', () => {
  it('escapes semicolons and hashes as Mermaid entity codes', () => {
    expect(escapeMessageText('GET /a;jsessionid=1#x')).toBe('GET /a#59;jsessionid=1#35;x');
  });
});

describe('buildSequenceDiagram escaping and aliases', () => {
  it('escapes semicolons in paths so they do not end the statement', () => {
    const result = buildSequenceDiagram([makeRequest({ url: 'https://api.example.com/a;jsessionid=1' })]);
    expect(result).toContain('GET /a#59;jsessionid=1');
    expect(result).not.toMatch(/\/a;/);
  });

  it('gives hosts that sanitize identically distinct aliases', () => {
    const result = buildSequenceDiagram([
      makeRequest({ url: 'https://a-b.com/x' }),
      makeRequest({ url: 'https://a_b.com/y', requestId: '2' }),
    ]);
    expect(result).toContain('participant a_b_com as a-b.com');
    expect(result).toContain('participant a_b_com_2 as a_b.com');
    expect(result).toContain('Browser->>a_b_com_2: GET /y');
  });
});

describe('buildMessageIndex', () => {
  it('maps response arrows back to their request', () => {
    const requests = [
      makeRequest({ requestId: 'a', statusCode: 200 }),
      makeRequest({ requestId: 'b' }),
      makeRequest({ requestId: 'c', statusCode: 404 }),
    ];
    // a-req, a-res, b-req, c-req, c-res
    expect(buildMessageIndex(requests)).toEqual([0, 0, 1, 2, 2]);
  });

  it('indexes into the capped list', () => {
    const requests = Array.from({ length: 35 }, (_, i) => makeRequest({ requestId: String(i) }));
    const index = buildMessageIndex(requests);
    expect(index).toHaveLength(30);
    expect(index[29]).toBe(29);
  });
});
