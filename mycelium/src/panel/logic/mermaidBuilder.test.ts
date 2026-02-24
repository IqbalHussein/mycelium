/**
 * Unit tests for the Mermaid sequence diagram builder.
 */

import { describe, it, expect } from 'vitest';
import {
  buildSequenceDiagram,
  extractParticipant,
  extractPath,
  sanitizeParticipant,
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

describe('extractPath', () => {
  it('extracts pathname from URL', () => {
    expect(extractPath('https://api.example.com/users/123')).toBe('/users/123');
  });

  it('truncates long paths', () => {
    const longPath = '/a'.repeat(30);
    const result = extractPath(`https://example.com${longPath}`);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toContain('...');
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
