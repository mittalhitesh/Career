import { ChatApiError, ERROR_CODES, classifyHttpError, classifyNetworkOrCorsError } from '../errors.js';

function buildCustomHeaders(config) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const headerName = (config.customHeaderName || '').trim();
  const headerValue = (config.customHeaderValue || '').trim();
  if (headerName && headerValue) {
    headers[headerName] = headerValue;
  }
  return headers;
}

function parseSseOrChunk(chunkText) {
  // Handle SSE lines ("data: ...") or plain text chunks
  if (!chunkText.includes('data:')) return chunkText;

  let extracted = '';
  const lines = chunkText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload);
      const token =
        parsed?.token ??
        parsed?.delta ??
        parsed?.reply ??
        parsed?.choices?.[0]?.delta?.content ??
        '';
      if (typeof token === 'string') extracted += token;
    } catch {
      extracted += payload;
    }
  }
  return extracted;
}

export async function sendCustomBackendMessage({ config, messages, profile, signal, onToken }) {
  const url = (config.customBackendUrl || '').trim();
  if (!url) {
    throw new ChatApiError('Custom backend URL is missing. Configure it in Settings.', {
      code: ERROR_CODES.PROVIDER_ERROR,
    });
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: buildCustomHeaders(config),
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        profile: profile || null,
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'Custom Backend');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'Custom Backend');
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  // Auto-detect JSON { reply } vs. chunked/SSE stream
  if (contentType.includes('application/json') || !response.body) {
    const data = await response.json();
    const reply = data?.reply ?? data?.message ?? data?.content ?? '';
    if (typeof reply === 'string' && reply.length > 0) {
      onToken?.(reply);
    }
    return reply;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const rawChunk = decoder.decode(value, { stream: true });
      const text = parseSseOrChunk(rawChunk);
      if (text) {
        fullText += text;
        onToken?.(text);
      }
    }
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'Custom Backend');
  }

  return fullText;
}

export async function testCustomBackendConnection({ config, signal }) {
  const url = (config.customBackendUrl || '').trim();
  if (!url) {
    throw new ChatApiError('Custom backend URL is missing.', {
      code: ERROR_CODES.PROVIDER_ERROR,
    });
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: buildCustomHeaders(config),
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'ping' }],
        profile: null,
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'Custom Backend');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'Custom Backend');
  }

  return { ok: true, message: `Custom backend responded (HTTP ${response.status}).` };
}
