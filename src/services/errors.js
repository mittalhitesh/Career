export const ERROR_CODES = {
  AUTH_ERROR: 'AUTH_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  MODEL_ERROR: 'MODEL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SIMULATED_ERROR: 'SIMULATED_ERROR',
  ABORTED: 'ABORTED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
};

/**
 * Typed error class for all AI provider operations.
 */
export class ChatApiError extends Error {
  constructor(message, { code = ERROR_CODES.PROVIDER_ERROR, status = null, retryable = false, cause = null } = {}) {
    super(message);
    this.name = 'ChatApiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}

/**
 * Classifies an HTTP error response into a typed ChatApiError.
 */
export function classifyHttpError(status, bodyText = '', provider = 'provider') {
  const snippet = String(bodyText || '').slice(0, 240).trim();
  const detail = snippet ? ` (${snippet})` : '';

  if (status === 401 || status === 403) {
    return new ChatApiError(
      `Authentication failed for ${provider}. Check your API key or credentials in Settings.${detail}`,
      { code: ERROR_CODES.AUTH_ERROR, status, retryable: false }
    );
  }

  if (status === 429) {
    return new ChatApiError(
      `Rate limit reached on ${provider}. Wait a moment and try again.${detail}`,
      { code: ERROR_CODES.RATE_LIMIT, status, retryable: true }
    );
  }

  if (status === 400 || status === 404 || status === 422) {
    const isModelHint = /model|deployment|not found|invalid/i.test(snippet);
    return new ChatApiError(
      `${isModelHint ? 'Model or endpoint error' : 'Request rejected'} by ${provider} (HTTP ${status}).${detail}`,
      { code: ERROR_CODES.MODEL_ERROR, status, retryable: false }
    );
  }

  return new ChatApiError(
    `${provider} returned HTTP ${status}.${detail}`,
    { code: ERROR_CODES.PROVIDER_ERROR, status, retryable: status >= 500 }
  );
}

/**
 * Classifies fetch/network/CORS failures into a typed ChatApiError.
 */
export function classifyNetworkOrCorsError(err, provider = 'provider') {
  if (err instanceof ChatApiError) return err;

  if (err?.name === 'AbortError') {
    return new ChatApiError('Generation stopped.', {
      code: ERROR_CODES.ABORTED,
      retryable: false,
      cause: err,
    });
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new ChatApiError('You appear to be offline. Reconnect to the internet and try again.', {
      code: ERROR_CODES.NETWORK_ERROR,
      retryable: true,
      cause: err,
    });
  }

  const msg = String(err?.message || '');
  const looksLikeCorsOrFetch =
    err instanceof TypeError || /failed to fetch|networkerror|load failed|cors/i.test(msg);

  if (looksLikeCorsOrFetch) {
    return new ChatApiError(
      `Could not reach ${provider}. This is often caused by browser CORS restrictions on direct API calls, or a network block. Consider using a Custom Backend proxy in Settings.`,
      { code: ERROR_CODES.CORS_ERROR, retryable: true, cause: err }
    );
  }

  return new ChatApiError(msg || `Unexpected error from ${provider}.`, {
    code: ERROR_CODES.NETWORK_ERROR,
    retryable: true,
    cause: err,
  });
}
