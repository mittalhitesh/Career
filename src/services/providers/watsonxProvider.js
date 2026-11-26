import { ChatApiError, ERROR_CODES, classifyHttpError, classifyNetworkOrCorsError } from '../errors.js';

/**
 * Central IBM Watsonx.ai constants — update these if IBM changes paths or versions.
 * Last verified: 2024-10-08 API version.
 */
export const WATSONX_CONSTANTS = {
  IAM_TOKEN_URL: 'https://iam.cloud.ibm.com/identity/token',
  API_VERSION: '2024-10-08',
  CHAT_PATH: '/ml/v1/text/chat',
  CHAT_STREAM_PATH: '/ml/v1/text/chat_stream',
};

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

let cachedToken = {
  apiKey: '',
  accessToken: '',
  expiresAt: 0,
};

function normalizeWatsonxUrl(url) {
  return (url || 'https://us-south.ml.cloud.ibm.com').trim().replace(/\/+$/, '');
}

async function getIamBearerToken(apiKey, signal) {
  if (!apiKey) {
    throw new ChatApiError('IBM Watsonx API key is missing.', {
      code: ERROR_CODES.AUTH_ERROR,
      retryable: false,
    });
  }

  const now = Date.now();
  if (
    cachedToken.accessToken &&
    cachedToken.apiKey === apiKey &&
    now < cachedToken.expiresAt - REFRESH_BUFFER_MS
  ) {
    return cachedToken.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
    apikey: apiKey,
  });

  let response;
  try {
    response = await fetch(WATSONX_CONSTANTS.IAM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'IBM IAM');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'IBM IAM');
  }

  const data = await response.json();
  if (!data?.access_token) {
    throw new ChatApiError('IBM IAM did not return an access token.', {
      code: ERROR_CODES.AUTH_ERROR,
      retryable: false,
    });
  }

  const expiresInSec = Number(data.expires_in) || 3600;
  cachedToken = {
    apiKey,
    accessToken: data.access_token,
    expiresAt: now + expiresInSec * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Passes messages through as-is — the system prompt is handled on the API side.
 * Profile context (if any) is prepended as a user-context exchange.
 */
function buildWatsonxMessages(messages, profile) {
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

export async function sendWatsonxMessage({ config, messages, profile, signal, onToken }) {
  const token = await getIamBearerToken(config.watsonxApiKey, signal);
  const baseUrl = normalizeWatsonxUrl(config.watsonxUrl);
  const endpoint = `${baseUrl}${WATSONX_CONSTANTS.CHAT_STREAM_PATH}?version=${WATSONX_CONSTANTS.API_VERSION}`;
  const modelId = (config.watsonxModelId || 'ibm/granite-3-8b-instruct').trim();

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model_id: modelId,
        project_id: config.watsonxProjectId,
        messages: buildWatsonxMessages(messages, profile),
        max_tokens: 1500,
        temperature: 0.7,
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'IBM Watsonx.ai');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'IBM Watsonx.ai');
  }

  if (!response.body) {
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
          const delta =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.choices?.[0]?.message?.content ??
            '';
          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            onToken?.(delta);
          }
        } catch {
          // Ignore non-JSON SSE lines (event:/id:)
        }
      }
    }
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'IBM Watsonx.ai');
  }

  return fullText;
}

export async function testWatsonxConnection({ config, signal }) {
  const token = await getIamBearerToken(config.watsonxApiKey, signal);
  const baseUrl = normalizeWatsonxUrl(config.watsonxUrl);
  const endpoint = `${baseUrl}${WATSONX_CONSTANTS.CHAT_PATH}?version=${WATSONX_CONSTANTS.API_VERSION}`;
  const modelId = (config.watsonxModelId || 'ibm/granite-3-8b-instruct').trim();

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model_id: modelId,
        project_id: config.watsonxProjectId,
        messages: [{ role: 'user', content: 'Reply with OK' }],
        max_tokens: 8,
      }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkOrCorsError(err, 'IBM Watsonx.ai');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw classifyHttpError(response.status, errText, 'IBM Watsonx.ai');
  }

  return { ok: true, message: `Connected to Watsonx.ai (${modelId}).` };
}
