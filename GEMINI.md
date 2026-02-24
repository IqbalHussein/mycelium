# Project Overview

Mycelium is a Chrome DevTools extension designed to visualize asynchronous network traffic as dynamic Sequence Diagrams. It intercepts `fetch` and `XHR` requests, filters out static noise, and groups interactions into logical flows to help developers debug distributed systems and microservice architectures. The project solves the "Waterfall Limitation" of standard network tools by emphasizing the logical relationship between the browser and external services using a React-based UI and Mermaid.js rendering.

## Repository Structure

* `src/manifest.json` – The Manifest V3 configuration file defining permissions and entry points.
* `src/background/` – Contains the Service Worker (Orchestrator) logic for `webRequest` interception.
* `src/devtools/` – The entry point for the DevTools panel (The Bridge).
* `src/panel/` – The React application (The Visualizer) containing the UI and Mermaid.js components.
* `src/panel/components/` – Reusable React components (DiagramCanvas, RequestInspector).
* `src/panel/logic/` – Core utilities including the Heuristic Correlation Engine and Mermaid string builder.
* `src/utils/` – Shared helpers for message passing (`chrome.runtime.connect`) and type definitions.
* `public/` – Static assets (icons, HTML templates).
* `vite.config.ts` – Build configuration using `@crxjs/vite-plugin`.

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start development server (Hot Module Replacement)
npm run dev

# Run unit tests (Vitest)
npm run test

# Type check TypeScript
npm run type-check

# Build for production (outputs to dist/)
npm run build

# Lint code
npm run lint
```

## Code Style & Conventions

Language: TypeScript (Strict mode enabled).

Styling: Tailwind CSS for all UI components; adhere to "Chrome Dark Mode" aesthetics.

Naming: PascalCase for React components, camelCase for logic functions.

Formatting: Prettier default config.

Linting: ESLint with React hooks plugin.

Commit Messages: Conventional Commits (e.g., feat: add heartbeat mechanism, fix: mermaid rendering lag).

## Architechture Notes
Mycelium operates on a "Pub-Sub" model bridging the background Service Worker and the DevTools UI.

Code snippet

sequenceDiagram
    participant Browser
    participant SW as Service Worker (Orchestrator)
    participant Buffer as Batch Buffer
    participant Panel as DevTools Panel (React)
    
    Browser->>SW: 1. Intercept Request (webRequest)
    SW->>SW: 2. Filter Assets (Images/CSS)
    SW->>Buffer: 3. Push to Queue
    loop Every 500ms
        Buffer->>Panel: 4. Flush Batch (Long-lived Port)
    end
    Panel->>Panel: 5. Update React State
    Panel->>Panel: 6. Render Mermaid SVG

Orchestrator (Service Worker): Listens to chrome.webRequest. Filters noise immediately.

Batch Buffer: Mitigates UI flicker by grouping incoming requests into 500ms chunks before sending.

Communication Bridge: Uses chrome.runtime.connect to maintain a persistent channel. Requires a "Heartbeat" to prevent SW dormancy.

Visualizer (Panel): React component that converts raw request objects into Mermaid.js syntax strings.

## Testing Strategy

Unit Tests: Run via npm run test (Vitest). Focus on src/panel/logic/ to ensure the correlation engine correctly groups requests into flows.

Integration Tests: > TODO: Setup Playwright for Chrome Extension E2E testing.

Manual Testing: Load the unpacked extension in Chrome. Test against complex sites (e.g., Gmail, GitHub) to verify noise filtering and performance under load.

## Security & Compliance

Manifest V3: Strictly adhere to MV3 limitations. No remote code execution.

Data Privacy: All processing happens locally in the browser. No data is sent to external analytics.

CORS Handling: The UI must gracefully handle missing response bodies when blocked by browser security policies; display headers only in these cases.

Permissions: Minimal scope (webRequest, storage, devtools).

## Agent Guardrails

Manifest Integrity: Do not manually increment versions in manifest.json; this is handled by the release pipeline.

Dependency Lock: Do not modify package-lock.json unless adding a new dependency.

File Boundaries: Do not edit the public/icons folder.

Performance: Any changes to the message passing logic must preserve the 500ms batching buffer to avoid freezing the DevTools UI.

## Extensibility Hooks

Heartbeat: The keepAlive interval in the panel connection logic is configurable.

Filter Denylist: The list of ignored file extensions (.png, .css) is defined in src/utils/filters.ts and can be extended.

Mermaid Config: Visualization settings (theme, direction) are exposed in src/panel/config/mermaidConfig.ts.

## Further Reading

MyceliumPRD.md

[Chrome Extension Manifest V3 Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)

[Mermaid.js Documentation](https://mermaid.js.org/intro/)

[Vite Plugin for Chrome Extensions](https://vite.dev/guide/api-plugin)

[Typescript Documentation](https://www.typescriptlang.org/docs/)

[React Documentation](https://react.dev/learn)

[Tailwind CSS Documentation](https://tailwindcss.com/docs/installation/using-vite)

[Vitest Documentation](https://vitest.dev/guide/)

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

[Playwright](https://playwright.dev/docs/intro)