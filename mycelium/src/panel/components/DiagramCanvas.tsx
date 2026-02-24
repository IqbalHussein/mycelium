/**
 * DiagramCanvas — Renders the Mermaid.js sequence diagram SVG (FR-03).
 *
 * Converts the current requests state into a Mermaid syntax string
 * and calls mermaid.render() to generate the SVG.
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

export default function DiagramCanvas({ requests, onSelectRequest }: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

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

        // Attach click handlers to message labels
        const textElements = containerRef.current.querySelectorAll('.messageText');
        textElements.forEach((el, index) => {
          const cappedRequests = requests.slice(-30);
          if (index < cappedRequests.length) {
            (el as HTMLElement).style.cursor = 'pointer';
            el.addEventListener('click', () => {
              onSelectRequest(cappedRequests[index]);
            });
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagram render failed');
    }
  }, [requests, onSelectRequest]);

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
      <div ref={containerRef} className="diagram-svg-container" />
    </div>
  );
}
