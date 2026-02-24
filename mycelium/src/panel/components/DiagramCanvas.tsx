/**
 * DiagramCanvas — Renders the Mermaid.js sequence diagram SVG (FR-03).
 *
 * Uses a single delegated click listener on the container ref to map
 * SVG element clicks back to the application's request state, rather
 * than attaching per-element handlers that leak on re-render.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import mermaid from 'mermaid';
import { buildSequenceDiagram } from '../logic/mermaidBuilder';
import { getMermaidConfig } from '../config/mermaidConfig';
import type { NetworkRequest } from '../../utils/types';

interface DiagramCanvasProps {
  requests: NetworkRequest[];
  onSelectRequest: (request: NetworkRequest) => void;
}

/** Maximum requests shown in the diagram (must match mermaidBuilder). */
const MAX_DIAGRAM_REQUESTS = 30;

export default function DiagramCanvas({ requests, onSelectRequest }: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  // Keep the latest requests in a ref so the delegated handler always
  // reads the current list — avoids stale closures across renders.
  const requestsRef = useRef<NetworkRequest[]>(requests);
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  // ── Delegated click handler ──────────────────────────────────
  // Walks up the DOM from the click target to find a Mermaid
  // .messageText node, resolves its index within the SVG, and maps
  // it back to the corresponding capped request.
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const container = containerRef.current;
      if (!container) return;

      // Walk up the DOM tree to find the nearest .messageText element
      const messageNode = findAncestorWithClass(target, 'messageText', container);
      if (!messageNode) return;

      // Determine the index of this messageText within all messageTexts
      const allMessages = container.querySelectorAll('.messageText');
      const index = Array.from(allMessages).indexOf(messageNode);
      if (index === -1) return;

      const cappedRequests = requestsRef.current.slice(-MAX_DIAGRAM_REQUESTS);
      if (index < cappedRequests.length) {
        onSelectRequest(cappedRequests[index]);
      }
    },
    [onSelectRequest],
  );

  // ── Render Mermaid SVG ───────────────────────────────────────
  const renderDiagram = useCallback(async () => {
    if (!containerRef.current) return;

    const diagramStr = buildSequenceDiagram(requests);
    renderIdRef.current += 1;
    const id = `mycelium-diagram-${renderIdRef.current}`;

    try {
      mermaid.initialize(getMermaidConfig());
      const { svg } = await mermaid.render(id, diagramStr);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        setError(null);

        // Mark message labels as interactive (cursor + highlight)
        const textElements = containerRef.current.querySelectorAll('.messageText');
        textElements.forEach((el) => {
          (el as HTMLElement).style.cursor = 'pointer';
          el.classList.add('interactive-label');
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagram render failed');
    }
  }, [requests]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  return (
    <div className="diagram-canvas">
      {error && (
        <div className="diagram-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {/* Single delegated click listener on the container */}
      <div
        ref={containerRef}
        className="diagram-svg-container"
        onClick={handleContainerClick}
      />
    </div>
  );
}

/**
 * Walks up the DOM from `el` looking for the first ancestor (or self)
 * that has the given CSS class. Stops at `boundary` to prevent
 * escaping the container.
 */
function findAncestorWithClass(
  el: HTMLElement,
  className: string,
  boundary: HTMLElement,
): Element | null {
  let current: HTMLElement | null = el;
  while (current && current !== boundary) {
    if (current.classList?.contains(className)) return current;
    current = current.parentElement;
  }
  return null;
}
