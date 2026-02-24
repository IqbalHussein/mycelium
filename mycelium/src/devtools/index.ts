/**
 * Mycelium DevTools Entry Point (The Bridge).
 * Creates the "Mycelium" panel in Chrome DevTools.
 */

chrome.devtools.panels.create(
  'Mycelium',
  '',
  'index.html',
  (panel: chrome.devtools.panels.ExtensionPanel) => {
    console.log('Mycelium panel created', panel);
  },
);
