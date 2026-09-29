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
import { appendRequests, applyResponses } from './logic/requestState';
import { createPort, sendInit, startHeartbeat } from '../utils/messaging';
import type { NetworkRequest, BackgroundMessage } from '../utils/types';
import '../index.css';

export default function App() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  // Store the id, not the object, so the inspector picks up late responses
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const selectedRequest = requests.find((req) => req.requestId === selectedRequestId) ?? null;
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

      if (msg.kind === 'requests') {
        const incoming = msg.payload;
        setRequests((prev) => appendRequests(prev, incoming));
      } else {
        const updates = msg.payload;
        setRequests((prev) => applyResponses(prev, updates));
      }
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
    setSelectedRequestId(null);
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSelectRequest = useCallback((request: NetworkRequest) => {
    setSelectedRequestId(request.requestId);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelectedRequestId(null);
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
