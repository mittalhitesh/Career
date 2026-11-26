import { classifyHttpError, classifyNetworkOrCorsError } from '../errors.js';

function normalizeBaseUrl(url) {
  return (url || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
}

/**
 * Passes messages through as-is. The system prompt is handled on the API
 * side, not in the frontend. Profile context (if any) is prepended as an
 * additional user-context message so the model can personalise advice.
 */
function buildMessagesPayload(messages, profile) {
  const out = [];

  if (profile) {
    const parts = [];
    if (profile.education) parts.push(`Education/Stage: ${profile.education}`);
    if (profile.interests) parts.push(`Interests/Target: ${profile.interests}`);
    if (profile.location) parts.push(`Location: ${profile.location}`);
    if (parts.length > 0) {
      out.push({ role: 'user', content: `[Student context — do not repeat this back]\n${parts.join('\n')}` });
      out.push({ role: 'assistant', content: 'Understood, I will keep this context in mind.' });
    }
  }

  out.push(...messages.map((m) => ({ role: m.role, content: m.content })));
  return out;
}

export async function sendOpenAIMessage({ config, messages, profile, signal, onToken }) {
  const baseUrl = normalizeBaseUrl(config.openaiBaseUrl);
  const endpoint = `${baseUrl}/chat/completions`;
  const model = (config.openaiModel || 'gpt-4o-mini').trim();

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildMessagesPayload(messages, profile),
        stream: true,
        temperature: 0.7,
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'OpenAI-compatible API');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'OpenAI-compatible API');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!response.body || contentType.includes('application/json')) {
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || '';
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
        if (payload === '[DONE]') return fullText;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            onToken?.(delta);
          }
        } catch {
          // Ignore malformed keepalive chunks
        }
      }
    }
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'OpenAI-compatible API');
  }

  return fullText;
}

export async function testOpenAIConnection({ config, signal }) {
  const baseUrl = normalizeBaseUrl(config.openaiBaseUrl);
  const model = (config.openaiModel || 'gpt-4o-mini').trim();
  const endpoint = `${baseUrl}/chat/completions`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with OK' }],
        max_tokens: 8,
        stream: false,
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'OpenAI-compatible API');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'OpenAI-compatible API');
  }

  return { ok: true, message: `Connected to ${model} at ${baseUrl}.` };
}
