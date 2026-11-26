# AI Provider Setup Guide

Career Mitar AI supports four AI providers configurable in `/settings` (stored in `localStorage` under `career_mitar_provider_settings_v1`) or via `VITE_*` variables in `.env`.

---

## 1. Mock (Demo) — Default

- **Requires API key?** No.
- Streams realistic, India-specific career guidance locally.
- Simulates a transient error roughly 1 in 10 non-test calls, or whenever your message includes `[simulate-error]`, so you can verify retry & error handling.

---

## 2. OpenAI-Compatible

Works with **OpenAI**, **Groq**, **OpenRouter**, **Together AI**, or local **Ollama** (`http://localhost:11434/v1`).

| Field | Example |
| --- | --- |
| API Key | `sk-...` (or `ollama` for local Ollama) |
| Base URL | `https://api.openai.com/v1` |
| Model | `gpt-4o-mini` |

Calls `POST {baseUrl}/chat/completions` with `stream: true` and parses Server-Sent Events (SSE).

---

## 3. IBM Watsonx.ai

Uses central constants (`IAM_TOKEN_URL`, `API_VERSION: 2024-10-08`, `/ml/v1/text/chat`, `/ml/v1/text/chat_stream`) and caches the IAM bearer token in memory (refreshing 5 minutes before expiry).

| Field | Example |
| --- | --- |
| IBM Cloud API Key | Your IAM API key |
| Project ID | Your Watsonx.ai Project UUID |
| Region URL | `https://us-south.ml.cloud.ibm.com` |
| Model ID | `ibm/granite-3-8b-instruct` |

> **CORS Note:** IBM IAM & Watsonx endpoints often block direct browser `fetch` calls due to CORS. For production or browser use, route requests through a **Custom Backend Proxy** (below).

---

## 4. Custom Backend Proxy (Recommended for Production)

Keeps API keys off the client and avoids browser CORS restrictions.

Career Mitar AI sends:
```json
POST <your-endpoint>
Content-Type: application/json
<optional-custom-header>: <optional-value>

{
  "messages": [{ "role": "user", "content": "..." }],
  "profile": { "education": "...", "interests": "...", "location": "..." }
}
```
It automatically accepts either a JSON `{ "reply": "..." }` response or a chunked/SSE stream.

### Minimal Node / Express Example (15 lines)
```js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: req.body.messages }),
  });
  const data = await r.json();
  res.json({ reply: data.choices?.[0]?.message?.content || '' });
});

app.listen(8787, () => console.log('Proxy on http://localhost:8787'));
```

### Minimal Python / Flask Example (15 lines)
```python
import os, requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.post("/api/chat")
def chat():
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
        json={"model": "gpt-4o-mini", "messages": request.json.get("messages", [])},
        timeout=60,
    )
    return jsonify({"reply": r.json()["choices"][0]["message"]["content"]})

app.run(port=8787)
```
