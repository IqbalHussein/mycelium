/**
 * Toolbar — Top bar with Clear button, Pause/Resume toggle,
 * request count, and recording indicator (FR-05).
 */

interface ToolbarProps {
  requestCount: number;
  isPaused: boolean;
  onClear: () => void;
  onTogglePause: () => void;
}

export default function Toolbar({ requestCount, isPaused, onClear, onTogglePause }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-brand">
          <span className="brand-icon">🍄</span>
          <span className="brand-name">Mycelium</span>
        </div>
        <div className="toolbar-divider" />
        <div className={`recording-indicator ${isPaused ? 'paused' : 'recording'}`}>
          <span className="recording-dot" />
          <span className="recording-label">{isPaused ? 'Paused' : 'Recording'}</span>
        </div>
      </div>

      <div className="toolbar-right">
        <span className="request-count">{requestCount} request{requestCount !== 1 ? 's' : ''}</span>

        <button
          onClick={onTogglePause}
          className={`toolbar-btn ${isPaused ? 'btn-resume' : 'btn-pause'}`}
          title={isPaused ? 'Resume recording' : 'Pause recording'}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button onClick={onClear} className="toolbar-btn btn-clear" title="Clear diagram">
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
