/**
 * Mycelium Background Service Worker (Orchestrator).
 *
 * Listens to chrome.webRequest events, filters out static assets (FR-02),
 * batches incoming requests in a 500ms buffer (TR-05), and relays them
 * to the connected DevTools panel via a long-lived port.
 */

import { shouldFilterRequest } from '../utils/filters';
import type { NetworkRequest } from '../utils/types';

interface Connection {
  [tabId: number]: chrome.runtime.Port;
}

const connections: Connection = {};

/** Per-tab batching buffer. Flushes every 500ms. */
const batchBuffers: { [tabId: number]: NetworkRequest[] } = {};
const BATCH_INTERVAL_MS = 500;

/** Per-tab response header storage (populated by onCompleted). */
const pendingHeaders: { [requestId: string]: { headers: Record<string, string>; statusCode: number } } = {};

// ──────────────────────────────────────────────
// Port connection management
// ──────────────────────────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'mycelium') return;

  const extensionListener = (message: { name: string; tabId?: number }) => {
    if (message.name === 'init' && message.tabId !== undefined) {
      connections[message.tabId] = port;
      startBatchFlush(message.tabId);
      return;
    }
    // Heartbeat — no-op, just keeps SW alive
  };

  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(() => {
    port.onMessage.removeListener(extensionListener);

    const tabs = Object.keys(connections);
    for (const tabKey of tabs) {
      const tabId = Number(tabKey);
      if (connections[tabId] === port) {
        delete connections[tabId];
        delete batchBuffers[tabId];
        break;
      }
    }
  });
});

// ──────────────────────────────────────────────
// Batch buffer flush loop
// ──────────────────────────────────────────────

function startBatchFlush(tabId: number): void {
  if (!batchBuffers[tabId]) {
    batchBuffers[tabId] = [];
  }

  setInterval(() => {
    const buffer = batchBuffers[tabId];
    if (!buffer || buffer.length === 0) return;

    const port = connections[tabId];
    if (!port) return;

    // Merge any pending response headers
    const enriched = buffer.map((req) => {
      const headersData = pendingHeaders[req.requestId];
      if (headersData) {
        req.responseHeaders = headersData.headers;
        req.statusCode = headersData.statusCode;
        delete pendingHeaders[req.requestId];
      }
      return req;
    });

    try {
      port.postMessage({
        source: 'mycelium-bg',
        payload: enriched,
      });
    } catch {
      // Port disconnected
      delete connections[tabId];
      delete batchBuffers[tabId];
    }

    batchBuffers[tabId] = [];
  }, BATCH_INTERVAL_MS);
}

// ──────────────────────────────────────────────
// FR-01: Traffic interception
// ──────────────────────────────────────────────

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, url, method, requestId, type } = details;

    // Ignore requests not from a tracked tab
    if (tabId < 0 || !connections[tabId]) return undefined;

    // FR-02: Asset filtering
    if (shouldFilterRequest(url, type)) return undefined;

    // Push to batch buffer
    if (!batchBuffers[tabId]) {
      batchBuffers[tabId] = [];
    }

    batchBuffers[tabId].push({
      requestId,
      url,
      method,
      timestamp: Date.now(),
      type,
    });

    return undefined;
  },
  { urls: ['<all_urls>'] },
);

// ──────────────────────────────────────────────
// Capture response headers on completion
// ──────────────────────────────────────────────

chrome.webRequest.onCompleted.addListener(
  (details) => {
    const { tabId, requestId, responseHeaders, statusCode } = details;
    if (tabId < 0 || !connections[tabId]) return;

    const headers: Record<string, string> = {};
    if (responseHeaders) {
      for (const h of responseHeaders) {
        if (h.name && h.value) {
          headers[h.name.toLowerCase()] = h.value;
        }
      }
    }

    pendingHeaders[requestId] = { headers, statusCode };
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders'],
);

console.log('Mycelium Background Service Worker Initialized');
