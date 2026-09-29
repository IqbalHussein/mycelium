/**
 * Unit tests for the panel's request state helpers.
 */

import { describe, it, expect } from 'vitest';
import { appendRequests, applyResponses } from './requestState';
import type { NetworkRequest } from '../../utils/types';

function makeRequest(requestId: string): NetworkRequest {
  return {
    requestId,
    url: `https://api.example.com/${requestId}`,
    method: 'GET',
    timestamp: 0,
    type: 'xmlhttprequest',
  };
}

describe('appendRequests', () => {
  it('caps the list to the last 30 requests', () => {
    const prev = Array.from({ length: 25 }, (_, i) => makeRequest(String(i)));
    const incoming = Array.from({ length: 10 }, (_, i) => makeRequest(String(25 + i)));
    const result = appendRequests(prev, incoming);
    expect(result).toHaveLength(30);
    expect(result[0].requestId).toBe('5');
    expect(result[29].requestId).toBe('34');
  });
});

describe('applyResponses', () => {
  it('merges a late response into its request by requestId', () => {
    const prev = [makeRequest('a'), makeRequest('b')];
    const result = applyResponses(prev, [
      { requestId: 'b', statusCode: 201, responseHeaders: { 'content-type': 'application/json' } },
    ]);
    expect(result[0]).toBe(prev[0]);
    expect(result[1].statusCode).toBe(201);
    expect(result[1].responseHeaders).toEqual({ 'content-type': 'application/json' });
  });

  it('returns the same array when no request matches', () => {
    const prev = [makeRequest('a')];
    expect(applyResponses(prev, [{ requestId: 'zzz', statusCode: 200, responseHeaders: {} }])).toBe(prev);
  });
});
