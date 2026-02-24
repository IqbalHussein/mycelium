/**
 * Shared TypeScript interfaces and types for Mycelium.
 */

/** Represents a single intercepted network request. */
export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  timestamp: number;
  type: string;
  responseHeaders?: Record<string, string>;
  statusCode?: number;
}

/** Message sent from the background service worker to the panel. */
export interface BackgroundMessage {
  source: 'mycelium-bg';
  payload: NetworkRequest | NetworkRequest[];
}

/** Init message sent from the panel to the background service worker. */
export interface InitMessage {
  name: 'init';
  tabId: number;
}

/** Heartbeat message to keep the service worker alive. */
export interface HeartbeatMessage {
  name: 'heartbeat';
}

/** Union of all messages the panel can send to the background. */
export type PanelMessage = InitMessage | HeartbeatMessage;
