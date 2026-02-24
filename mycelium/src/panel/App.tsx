/**
 * Mycelium Panel — Main App Component (The Visualizer).
 *
 * 70/30 split-view layout:
 *   Left:  Sequence Diagram Canvas
 *   Right: Request Inspector Drawer
 *
 * Manages state for requests, selected request, and pause toggle.
 * Connects to the background service worker via a long-lived port
 * with heartbeat to prevent SW dormancy.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import DiagramCanvas from './components/DiagramCanvas';
import RequestInspector from './components/RequestInspector';
import { createPort, sendInit, startHeartbeat } from '../utils/messaging';
import type { NetworkRequest, BackgroundMessage } from '../utils/types';
import '../index.css';

/** Maximum requests to keep in state. */
const MAX_REQUESTS = 30;

export default function App() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // Keep ref in sync so the message handler always has the latest value
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const port = createPort();
    sendInit(port, chrome.devtools.inspectedWindow.tabId);
    const stopHeartbeat = startHeartbeat(port);

    const messageListener = (msg: BackgroundMessage) => {
      if (msg.source !== 'mycelium-bg' || !msg.payload) return;

      // When paused, discard incoming messages so the diagram stays frozen
      if (isPausedRef.current) return;

      const incoming = Array.isArray(msg.payload) ? msg.payload : [msg.payload];

      setRequests((prev) => {
        const updated = [...prev, ...incoming];
        // Cap to last MAX_REQUESTS
        return updated.length > MAX_REQUESTS ? updated.slice(-MAX_REQUESTS) : updated;
      });
    };

    port.onMessage.addListener(messageListener);

    return () => {
      port.onMessage.removeListener(messageListener);
      stopHeartbeat();
      port.disconnect();
    };
  }, []);

  const handleClear = useCallback(() => {
    setRequests([]);
    setSelectedRequest(null);
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSelectRequest = useCallback((request: NetworkRequest) => {
    setSelectedRequest(request);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelectedRequest(null);
  }, []);

  return (
    <div className="app-container">
      <Toolbar
        requestCount={requests.length}
        isPaused={isPaused}
        onClear={handleClear}
        onTogglePause={handleTogglePause}
      />
      <div className="main-content">
        <div className="canvas-panel">
          <DiagramCanvas requests={requests} onSelectRequest={handleSelectRequest} />
        </div>
        <div className="inspector-panel">
          <RequestInspector request={selectedRequest} onClose={handleCloseInspector} />
        </div>
      </div>
    </div>
  );
}
