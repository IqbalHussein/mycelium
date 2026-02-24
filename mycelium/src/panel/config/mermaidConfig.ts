/**
 * Mermaid.js configuration for Mycelium.
 * Exposed settings for theme, direction, and rendering options.
 */

import type { MermaidConfig } from 'mermaid';

/**
 * Detects if the Chrome DevTools is in dark mode.
 */
function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Returns the Mermaid configuration object.
 */
export function getMermaidConfig(): MermaidConfig {
  return {
    startOnLoad: false,
    theme: isDarkMode() ? 'dark' : 'default',
    sequence: {
      diagramMarginX: 16,
      diagramMarginY: 16,
      actorMargin: 60,
      messageMargin: 40,
      mirrorActors: false,
      wrap: true,
      useMaxWidth: true,
    },
    securityLevel: 'strict',
  };
}
