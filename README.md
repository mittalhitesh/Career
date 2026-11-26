2# Career Mitar AI

A calm, local-first React 18 + Vite career companion for Indian students and early-career professionals.

- **Zero backend required** to start: works out-of-the-box in **Mock (Demo)** mode.
- **Bring Your Own AI**: switch between Mock, OpenAI-compatible APIs (OpenAI, Groq, OpenRouter, Ollama), IBM Watsonx.ai, or a Custom Backend Proxy in `/settings`.
- **14 Indian Career Tracks** (`/explore`) with realistic INR salary bands, timelines, and entry steps.
- **Interactive ASCII Roadmaps** (`/roadmap/:career`) with `localStorage`-persisted milestone checkboxes.
- **Plain CSS Design System**: CSS variables + CSS Modules (no Tailwind or UI kits), light/dark themes, Instrument Serif + Inter Tight + JetBrains Mono.

---

## Run Locally

### Prerequisites
- Node.js 18+ and npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Optional Environment Defaults
Copy `.env.example` to `.env` if you want build-time defaults (otherwise configure everything directly in the `/settings` UI):
```bash
cp .env.example .env
```

### 3. Start Dev Server
```bash
npm run dev
```
Open the local URL printed by Vite (usually `http://localhost:5173`).

---

## Build & Preview

```bash
npm run build
npm run preview
```

The production bundle is emitted to `dist/`.

---

## Deploy

Because Career Mitar AI is a static Single Page Application (SPA):

- **Vercel / Netlify / Cloudflare Pages**:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Configure a SPA fallback rewrite (`/* -> /index.html`) so direct visits to `/chat`, `/explore`, or `/roadmap/data-analyst` resolve cleanly.

See [docs/API_SETUP.md](./docs/API_SETUP.md) for provider setup instructions and minimal Node/Express + Python/Flask proxy examples.
