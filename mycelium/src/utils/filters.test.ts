/**
 * Unit tests for the asset filter utility (FR-02).
 */

import { describe, it, expect } from 'vitest';
import { shouldFilterRequest, IGNORED_EXTENSIONS, EXCLUDED_TYPES } from './filters';

describe('shouldFilterRequest', () => {
  describe('filters static asset URLs', () => {
    const assetCases = [
      ['https://example.com/logo.png', 'image'],
      ['https://cdn.example.com/styles.css', 'stylesheet'],
      ['https://fonts.gstatic.com/font.woff', 'font'],
      ['https://fonts.gstatic.com/font.woff2', 'font'],
      ['https://example.com/photo.jpg', 'image'],
      ['https://example.com/photo.jpeg', 'image'],
      ['https://example.com/anim.gif', 'image'],
      ['https://example.com/icon.svg', 'xmlhttprequest'],
      ['https://example.com/favicon.ico', 'other'],
    ] as const;

    for (const [url, type] of assetCases) {
      it(`filters ${url}`, () => {
        expect(shouldFilterRequest(url, type)).toBe(true);
      });
    }
  });

  describe('filters by excluded resource type', () => {
    for (const type of EXCLUDED_TYPES) {
      it(`filters type "${type}"`, () => {
        expect(shouldFilterRequest('https://example.com/api/data', type)).toBe(true);
      });
    }
  });

  describe('allows API / XHR requests through', () => {
    const passCases = [
      ['https://api.example.com/users', 'xmlhttprequest'],
      ['https://example.com/api/login', 'xmlhttprequest'],
      ['https://example.com/graphql', 'fetch'],
      ['https://example.com/api/v2/data?format=json', 'xmlhttprequest'],
    ] as const;

    for (const [url, type] of passCases) {
      it(`allows ${url}`, () => {
        expect(shouldFilterRequest(url, type)).toBe(false);
      });
    }
  });

  describe('handles URLs with query strings', () => {
    it('strips query before checking extension', () => {
      expect(shouldFilterRequest('https://cdn.example.com/bg.png?v=123', 'image')).toBe(true);
    });

    it('does not false-positive on query params containing extensions', () => {
      expect(shouldFilterRequest('https://api.example.com/search?file=test.png', 'xmlhttprequest')).toBe(false);
    });
  });

  it('has a non-empty IGNORED_EXTENSIONS list', () => {
    expect(IGNORED_EXTENSIONS.length).toBeGreaterThan(0);
  });
});
