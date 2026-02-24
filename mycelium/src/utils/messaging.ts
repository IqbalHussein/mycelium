/**
 * Chrome runtime messaging helpers for Mycelium.
 * Wraps chrome.runtime.connect to maintain a persistent channel
 * between the DevTools panel and the background service worker.
 */

const PORT_NAME = 'mycelium';
const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Creates a long-lived port connection to the background service worker.
 */
export function createPort(): chrome.runtime.Port {
  return chrome.runtime.connect({ name: PORT_NAME });
}

/**
 * Sends the init message over the port to register the inspected tab.
 */
export function sendInit(port: chrome.runtime.Port, tabId: number): void {
  port.postMessage({ name: 'init', tabId });
}

/**
 * Starts a heartbeat interval that pings the service worker
 * to prevent it from going dormant (MV3 limitation).
 * @returns A cleanup function to stop the heartbeat.
 */
export function startHeartbeat(port: chrome.runtime.Port, intervalMs = HEARTBEAT_INTERVAL_MS): () => void {
  const id = setInterval(() => {
    try {
      port.postMessage({ name: 'heartbeat' });
    } catch {
      // Port disconnected — clear interval silently
      clearInterval(id);
    }
  }, intervalMs);

  return () => clearInterval(id);
}
