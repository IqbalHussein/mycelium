/**
 * RequestInspector — Side-drawer displaying request/response details (FR-04).
 *
 * Shows method, URL, status, and all available headers.
 * Gracefully handles missing response bodies (CORS restriction).
 */

import type { NetworkRequest } from '../../utils/types';

interface RequestInspectorProps {
  request: NetworkRequest | null;
  onClose: () => void;
}

export default function RequestInspector({ request, onClose }: RequestInspectorProps) {
  if (!request) {
    return (
      <div className="inspector-empty">
        <div className="inspector-empty-icon">📋</div>
        <p>Click a request in the diagram to inspect its details.</p>
      </div>
    );
  }

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h3>Request Details</h3>
        <button onClick={onClose} className="inspector-close" title="Close">
          ✕
        </button>
      </div>

      <div className="inspector-section">
        <div className="inspector-row">
          <span className={`method-badge method-${request.method.toLowerCase()}`}>
            {request.method}
          </span>
          {request.statusCode !== undefined && (
            <span className={`status-badge ${request.statusCode < 400 ? 'status-ok' : 'status-error'}`}>
              {request.statusCode}
            </span>
          )}
        </div>
        <div className="inspector-url" title={request.url}>
          {request.url}
        </div>
        <div className="inspector-meta">
          <span>Type: {request.type}</span>
          <span>Time: {new Date(request.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {request.responseHeaders && Object.keys(request.responseHeaders).length > 0 ? (
        <div className="inspector-section">
          <h4>Response Headers</h4>
          <div className="headers-table">
            {Object.entries(request.responseHeaders).map(([name, value]) => (
              <div key={name} className="header-row">
                <span className="header-name">{name}</span>
                <span className="header-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="inspector-section">
          <div className="inspector-notice">
            <span>🔒</span>
            <span>Response headers not available. This may be due to CORS restrictions.</span>
          </div>
        </div>
      )}
    </div>
  );
}
