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

/** Response data for a request that was already sent to the panel. */
export interface ResponseUpdate {
  requestId: string;
  statusCode: number;
  responseHeaders: Record<string, string>;
}

/** Batch of newly intercepted requests. */
export interface RequestsMessage {
  source: 'mycelium-bg';
  kind: 'requests';
  payload: NetworkRequest[];
}

/** Batch of responses for requests the panel already has. */
export interface ResponsesMessage {
  source: 'mycelium-bg';
  kind: 'responses';
  payload: ResponseUpdate[];
}

/** Message sent from the background service worker to the panel. */
export type BackgroundMessage = RequestsMessage | ResponsesMessage;

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
