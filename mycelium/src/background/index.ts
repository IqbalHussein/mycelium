/**
 * Mycelium Background Service Worker (Orchestrator).
 *
 * Listens to chrome.webRequest events, filters out static assets (FR-02),
 * batches incoming requests and responses in a 500ms buffer (TR-05), and
 * relays them to the connected DevTools panel via a long-lived port.
 */

import { shouldFilterRequest } from '../utils/filters';
import type { BackgroundMessage, NetworkRequest, PanelMessage, ResponseUpdate } from '../utils/types';

interface TabState {
  port: chrome.runtime.Port;
  /** Requests intercepted since the last flush. */
  requests: NetworkRequest[];
  /** Responses for requests that were already flushed to the panel. */
  responses: ResponseUpdate[];
  flushTimer: ReturnType<typeof setInterval>;
}

const tabs = new Map<number, TabState>();
const BATCH_INTERVAL_MS = 500;

// ──────────────────────────────────────────────
// Port connection management
// ──────────────────────────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'mycelium') return;

  const extensionListener = (message: PanelMessage) => {
    if (message.name === 'init') {
      registerTab(message.tabId, port);
    }
    // Heartbeat — no-op, just keeps SW alive
  };

  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(() => {
    port.onMessage.removeListener(extensionListener);
    for (const [tabId, state] of tabs) {
      if (state.port === port) {
        unregisterTab(tabId);
        break;
      }
    }
  });
});

function registerTab(tabId: number, port: chrome.runtime.Port): void {
  // Re-init (e.g. DevTools reopened) replaces the old state and its timer
  unregisterTab(tabId);
  tabs.set(tabId, {
    port,
    requests: [],
    responses: [],
    flushTimer: setInterval(() => flush(tabId), BATCH_INTERVAL_MS),
  });
}

function unregisterTab(tabId: number): void {
  const state = tabs.get(tabId);
  if (!state) return;
  clearInterval(state.flushTimer);
  tabs.delete(tabId);
}

// ──────────────────────────────────────────────
// Batch buffer flush
// ──────────────────────────────────────────────

function flush(tabId: number): void {
  const state = tabs.get(tabId);
  if (!state) return;

  const messages: BackgroundMessage[] = [];
  if (state.requests.length > 0) {
    messages.push({ source: 'mycelium-bg', kind: 'requests', payload: state.requests });
  }
  if (state.responses.length > 0) {
    messages.push({ source: 'mycelium-bg', kind: 'responses', payload: state.responses });
  }
  if (messages.length === 0) return;

  state.requests = [];
  state.responses = [];

  try {
    for (const message of messages) {
      state.port.postMessage(message);
    }
  } catch {
    // Port disconnected
    unregisterTab(tabId);
  }
}

// ──────────────────────────────────────────────
// FR-01: Traffic interception
// ──────────────────────────────────────────────

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, url, method, requestId, type, timeStamp } = details;

    // Ignore requests not from a tracked tab
    const state = tabs.get(tabId);
    if (!state) return undefined;

    // FR-02: Asset filtering
    if (shouldFilterRequest(url, type)) return undefined;

    state.requests.push({
      requestId,
      url,
      method,
      timestamp: timeStamp,
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
    const { tabId, requestId, responseHeaders, statusCode, url, type } = details;
    const state = tabs.get(tabId);
    if (!state || shouldFilterRequest(url, type)) return;

    const headers: Record<string, string> = {};
    if (responseHeaders) {
      for (const h of responseHeaders) {
        if (h.name && h.value) {
          headers[h.name.toLowerCase()] = h.value;
        }
      }
    }

    // If the request hasn't been flushed yet, attach the response directly;
    // otherwise queue an update for the panel to merge by requestId.
    const pending = state.requests.find((req) => req.requestId === requestId);
    if (pending) {
      pending.statusCode = statusCode;
      pending.responseHeaders = headers;
    } else {
      state.responses.push({ requestId, statusCode, responseHeaders: headers });
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders'],
);

console.log('Mycelium Background Service Worker Initialized');
