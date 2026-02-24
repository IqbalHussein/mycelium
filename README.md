# 🍄 Mycelium

**Visualize async network traffic as Sequence Diagrams — right inside Chrome DevTools.**

Mycelium intercepts `fetch` and `XHR` requests, filters out static noise, and renders the logical flow between the browser and external services as a live [Mermaid.js](https://mermaid.js.org/) sequence diagram.

---

## Why Mycelium?

The Chrome Network tab shows requests chronologically in a waterfall. When a single user action triggers a cascade of API calls to multiple microservices, it's hard to see _which action caused which chain of requests_. Mycelium solves this by rendering a **Sequence Diagram** that emphasizes the logical relationship between the browser and each service.

## Features

- **Live Sequence Diagram** — Mermaid.js SVG renders in real-time as traffic flows
- **Smart Filtering** — Static assets (images, CSS, fonts) are automatically excluded
- **Request Inspector** — Click any arrow in the diagram to view headers and status details
- **Pause / Resume** — Freeze the diagram to inspect a complex flow without it shifting
- **Clear** — One-click reset to start a fresh capture session
- **Dark / Light Mode** — Automatically matches your DevTools theme
- **Performance** — 500ms batching buffer prevents UI flicker; diagram capped at 30 requests
## Architecture

```
Browser ──webRequest──▶ Service Worker (Orchestrator)
                              │
                         500ms batch buffer
                              │
                        Long-lived Port
                              │
                        DevTools Panel (React)
                              │
                     ┌────────┴────────┐
                     │                 │
              Mermaid.js SVG    Request Inspector
```

| Layer            | Location          | Role                                                               |
| :--------------- | :---------------- | :----------------------------------------------------------------- |
| **Orchestrator** | `src/background/` | Intercepts `webRequest`, filters assets, batches & relays to panel |
| **Bridge**       | `src/devtools/`   | Creates the "Mycelium" panel in DevTools                           |
| **Visualizer**   | `src/panel/`      | React app — renders diagram & inspector UI                         |
| **Shared**       | `src/utils/`      | Types, filter denylist, messaging helpers                          |

## Tech Stack

| Tool                              | Purpose                    |
| :-------------------------------- | :------------------------- |
| **TypeScript**                    | Language (strict mode)     |
| **React 19**                      | Panel UI                   |
| **Mermaid.js**                    | Sequence diagram rendering |
| **Tailwind CSS v4**               | Styling                    |
| **Vite** + **@crxjs/vite-plugin** | Build pipeline             |
| **Vitest**                        | Unit testing               |
| **Manifest V3**                   | Chrome Extension standard  |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Google Chrome](https://www.google.com/chrome/)

### Install & Build

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### Load in Chrome

1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Open DevTools (`F12`) on any website → click the **Mycelium** tab

### Development

```bash
# Start dev server with HMR
npm run dev

# Run unit tests
npm run test

# Type-check
npm run type-check

# Lint
npm run lint
```

## Project Structure

```
src/
├── background/
│   └── index.ts              # Service Worker — webRequest interception + batch buffer
├── devtools/
│   └── index.ts              # Creates the DevTools panel
├── panel/
│   ├── App.tsx               # Main layout (70/30 split view)
│   ├── components/
│   │   ├── DiagramCanvas.tsx  # Mermaid.js SVG renderer
│   │   ├── RequestInspector.tsx  # Header/detail side-drawer
│   │   └── Toolbar.tsx       # Clear, Pause/Resume, recording indicator
│   ├── config/
│   │   └── mermaidConfig.ts  # Mermaid theme & rendering settings
│   └── logic/
│       ├── correlationEngine.ts  # Groups requests into logical flows
│       └── mermaidBuilder.ts     # String-builder for Mermaid syntax
├── utils/
│   ├── filters.ts            # Asset filter denylist (extensible)
│   ├── messaging.ts          # Port connection + heartbeat helpers
│   └── types.ts              # Shared TypeScript interfaces
├── index.css                 # Tailwind + DevTools dark/light theme
└── main.tsx                  # React entry point
```

## Configuration

| Setting                   | Location                            | Default                                 |
| :------------------------ | :---------------------------------- | :-------------------------------------- |
| Filter denylist           | `src/utils/filters.ts`              | `.png .css .woff .jpg .gif .svg .ico …` |
| Mermaid theme / direction | `src/panel/config/mermaidConfig.ts` | Auto dark/light                         |
| Heartbeat interval        | `src/utils/messaging.ts`            | 25 seconds                              |
| Batch flush interval      | `src/background/index.ts`           | 500ms                                   |
| Max diagram requests      | `src/panel/logic/mermaidBuilder.ts` | 30                                      |

## Permissions

| Permission   | Reason                                           |
| :----------- | :----------------------------------------------- |
| `webRequest` | Intercept network requests for diagram rendering |
| `storage`    | Reserved for future settings persistence         |
| `<all_urls>` | Monitor traffic to all domains                   |

All processing happens locally in the browser. **No data is sent externally.**

## License

MIT
