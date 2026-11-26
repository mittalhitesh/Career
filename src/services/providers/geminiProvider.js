import { classifyHttpError, classifyNetworkOrCorsError } from '../errors.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function buildGeminiContents(messages, profile) {
  const contents = [];

  if (profile) {
    const parts = [];
    if (profile.education) parts.push(`Education/Stage: ${profile.education}`);
    if (profile.interests) parts.push(`Interests/Target: ${profile.interests}`);
    if (profile.location) parts.push(`Location: ${profile.location}`);
    if (parts.length > 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `[Student context — do not repeat this back]\n${parts.join('\n')}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood, I will keep this context in mind.' }],
      });
    }
  }

  for (const m of messages) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }

  return contents;
}

export async function sendGeminiMessage({ config, messages, profile, signal, onToken }) {
  const model = (config.geminiModel || 'gemini-3.8-flash').trim();
  const endpoint = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify({
        contents: buildGeminiContents(messages, profile),
        generationConfig: {
          temperature: 0.7,
        },
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'Google Gemini API');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'Google Gemini API');
  }

  if (!response.body) {
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (reply) onToken?.(reply);
    return reply;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const parts = parsed?.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts)) {
            const delta = parts.map((p) => p.text || '').join('');
            if (delta) {
              fullText += delta;
              onToken?.(delta);
            }
          }
        } catch {
          // Ignore malformed SSE chunks
        }
      }
    }
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'Google Gemini API');
  }

  return fullText;
}

export async function testGeminiConnection({ config, signal }) {
  const model = (config.geminiModel || 'gemini-3.8-flash').trim();
  const endpoint = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with OK' }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'Google Gemini API');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'Google Gemini API');
  }

  return { ok: true, message: `Connected to Google Gemini (${model}).` };
}
