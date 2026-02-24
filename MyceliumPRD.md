# Product Requirement Document: Mycelium

| **Project Name** | Mycelium |
| :--- | :--- |
| **Type** | Chrome Extension (DevTools) |
| **Version** | 1.0.0 (MVP) |
| **Status** | **Ready for Development** |
| **Owner** | Iqbal Hussein |

---

## 1. Problem Statement

### 1.1 Current Situation
Modern web applications rely on asynchronous interactions where a single user action triggers a cascade of Fetch/XHR requests to various microservices. Currently, developers use the standard Chrome Network Tab to debug these interactions.

### 1.2 User Pain Points
* **The "Waterfall" Limitation:** The standard Network tab visualizes requests chronologically. It is difficult to distinguish which specific frontend action triggered which chain of backend requests.
* **Noise:** Essential API calls are buried under hundreds of requests for static assets (images, CSS) and analytics trackers.

### 1.3 Impact
* Increased debugging time for distributed systems.
* Difficulty in visualizing the "logic flow" of a complex application.

---

## 2. Proposed Solution

### 2.1 Overview
**Mycelium** is a Chrome DevTools extension that intercepts network traffic and visualizes it as a **Sequence Diagram**. It filters out noise and groups requests into "Logical Flows" to show the relationship between the Browser and external services.

### 2.2 Success Metrics
* **Accuracy:** Correctly groups related requests into a sequence flow.
* **Performance:** Zero perceived lag in the DevTools panel during active recording.

---

## 3. Requirements

### 3.1 Functional Requirements (FR)

| ID | Requirement | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Traffic Interception** | Capture all outgoing `fetch` and `XHR` events from the active tab. | P0 |
| **FR-02** | **Asset Filtering** | Automatically exclude static assets (.png, .css, .woff) from the diagram. | P0 |
| **FR-03** | **Sequence Visualization** | Render a live Sequence Diagram using Mermaid.js syntax. | P0 |
| **FR-04** | **Detail Inspection** | Display Request/Response Headers in a side-drawer when a diagram node is clicked. | P1 |
| **FR-05** | **Session Reset** | A "Clear" button to wipe the current canvas state. | P1 |

### 3.2 Technical Requirements (TR)

| ID | Requirement | Details |
| :--- | :--- | :--- |
| **TR-01** | **Architecture** | Adhere to **Manifest V3** using a Service Worker for background orchestration. |
| **TR-02** | **Framework** | UI built with **React** for state-driven rendering. |
| **TR-03** | **Rendering Engine** | **Mermaid.js** for automated SVG layout and sequence generation. |
| **TR-04** | **Communication** | Use `chrome.runtime.connect` for long-lived port messaging between the Service Worker and DevTools. |
| **TR-05** | **Performance** | Implement a 500ms **Batching Buffer** for incoming messages to prevent UI flicker. |

### 3.3 Design Requirements (UX)

* **Theme:** Auto-detect and match Chrome DevTools Light/Dark mode.
* **Layout:** A vertical split-view. Left (70%): Diagram Canvas. Right (30%): Header/Body Inspector.

---

## 4. Implementation

### 4.1 Tech Stack & Dependencies
* **Language:** TypeScript.
* **Build Tool:** Vite with the `@crxjs/vite-plugin`.
* **UI:** React + Tailwind CSS.
* **Visualization:** `mermaid` (Library).

### 4.2 Core Logic: The Sequence Generator
The MVP will use a string-builder pattern to generate Mermaid syntax in real-time:
1. Capture Request (e.g., `POST /api/login` to `auth.com`).
2. Format as: `Browser->>auth.com: POST /api/login`.
3. Update React state with the new string.
4. Call `mermaid.render()` to refresh the SVG.

---

## 5. Risks and Mitigations

| Risk | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- |
| **Service Worker Dormancy** | High | Implement a "Heartbeat" ping from the DevTools panel to keep the Service Worker active. |
| **SVG Scaling** | Medium | Limit the MVP to the last 30 requests to prevent the diagram from becoming too tall to read. |
| **CORS Restrictions** | Medium | Focus metadata collection on Headers; accept that Response Bodies may be restricted on some domains. |