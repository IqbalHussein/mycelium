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
