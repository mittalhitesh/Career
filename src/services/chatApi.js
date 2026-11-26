import { ChatApiError, ERROR_CODES } from './errors.js';
import { sendMockMessage, testMockConnection } from './providers/mockProvider.js';
import { sendGeminiMessage, testGeminiConnection } from './providers/geminiProvider.js';
import { sendOpenAIMessage, testOpenAIConnection } from './providers/openaiProvider.js';
import { sendWatsonxMessage, testWatsonxConnection } from './providers/watsonxProvider.js';
import { sendCustomBackendMessage, testCustomBackendConnection } from './providers/customBackendProvider.js';

export const PROVIDER_STORAGE_KEY = 'career_mitar_provider_settings_v1';

export function getEnvDefaults() {
  const env = import.meta.env || {};
  return {
    provider: env.VITE_DEFAULT_PROVIDER || 'mock',
    geminiApiKey: env.VITE_GEMINI_API_KEY || env.VITE_OPENAI_API_KEY || '',
    geminiModel: env.VITE_GEMINI_MODEL || 'gemini-3.8-flash',
    openaiApiKey: env.VITE_OPENAI_API_KEY || '',
    openaiBaseUrl: env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    watsonxApiKey: env.VITE_WATSONX_API_KEY || '',
    watsonxProjectId: env.VITE_WATSONX_PROJECT_ID || '',
    watsonxUrl: env.VITE_WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
    watsonxModelId: env.VITE_WATSONX_MODEL_ID || 'ibm/granite-3-8b-instruct',
    customBackendUrl: env.VITE_CUSTOM_BACKEND_URL || '',
    customHeaderName: env.VITE_CUSTOM_BACKEND_HEADER_NAME || '',
    customHeaderValue: env.VITE_CUSTOM_BACKEND_HEADER_VALUE || '',
  };
}

export function getEffectiveConfig(configOverride = null) {
  const defaults = getEnvDefaults();
  let stored = {};
  try {
    const raw = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = {};
  }

  // Only let non-empty stored values override .env defaults
  const nonEmptyStored = Object.fromEntries(
    Object.entries(stored).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  // If .env configures a real provider and localStorage wasn't explicitly reset to Mock, prefer .env
  if (
    nonEmptyStored.provider === 'mock' &&
    !nonEmptyStored._explicitMock &&
    defaults.provider !== 'mock' &&
    isProviderConfigComplete(defaults)
  ) {
    nonEmptyStored.provider = defaults.provider;
  }

  return {
    ...defaults,
    ...nonEmptyStored,
    ...(configOverride || {}),
  };
}

export function isProviderConfigComplete(config) {
  switch (config.provider) {
    case 'mock':
      return true;
    case 'gemini':
      return Boolean(config.geminiApiKey?.trim());
    case 'openai':
      return Boolean(config.openaiApiKey?.trim() && config.openaiBaseUrl?.trim());
    case 'watsonx':
      return Boolean(
        config.watsonxApiKey?.trim() &&
          config.watsonxProjectId?.trim() &&
          config.watsonxUrl?.trim()
      );
    case 'custom':
      return Boolean(config.customBackendUrl?.trim());
    default:
      return false;
  }
}

export async function sendMessage({ messages, profile = null, signal, onToken }) {
  const config = getEffectiveConfig();

  if (!isProviderConfigComplete(config)) {
    throw new ChatApiError(
      `Provider "${config.provider}" is missing required credentials. Update Settings or switch to Mock mode.`,
      { code: ERROR_CODES.AUTH_ERROR, retryable: false }
    );
  }

  switch (config.provider) {
    case 'mock':
      return sendMockMessage({ messages, signal, onToken });
    case 'gemini':
      return sendGeminiMessage({
        config,
        messages,
        profile,
        signal,
        onToken,
      });
    case 'openai':
      return sendOpenAIMessage({
        config,
        messages,
        profile,
        signal,
        onToken,
      });
    case 'watsonx':
      return sendWatsonxMessage({
        config,
        messages,
        profile,
        signal,
        onToken,
      });
    case 'custom':
      return sendCustomBackendMessage({
        config,
        messages,
        profile,
        signal,
        onToken,
      });
    default:
      throw new ChatApiError(`Unknown provider: ${config.provider}`, {
        code: ERROR_CODES.PROVIDER_ERROR,
      });
  }
}

export async function testProviderConnection(configOverride = null, signal) {
  const config = getEffectiveConfig(configOverride);

  if (!isProviderConfigComplete(config)) {
    throw new ChatApiError(
      `Please fill in all required fields for "${config.provider}" before testing.`,
      { code: ERROR_CODES.AUTH_ERROR }
    );
  }

  switch (config.provider) {
    case 'mock':
      return testMockConnection(signal);
    case 'gemini':
      return testGeminiConnection({ config, signal });
    case 'openai':
      return testOpenAIConnection({ config, signal });
    case 'watsonx':
      return testWatsonxConnection({ config, signal });
    case 'custom':
      return testCustomBackendConnection({ config, signal });
    default:
      throw new ChatApiError(`Unknown provider: ${config.provider}`, {
        code: ERROR_CODES.PROVIDER_ERROR,
      });
  }
}
