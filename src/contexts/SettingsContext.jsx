import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  PROVIDER_STORAGE_KEY,
  getEffectiveConfig,
  getEnvDefaults,
  isProviderConfigComplete,
} from '../services/chatApi.js';

const SettingsContext = createContext(null);

const PROVIDER_LABELS = {
  mock: 'Mock (Demo)',
  gemini: 'Google Gemini',
  openai: 'OpenAI-Compatible',
  watsonx: 'IBM Watsonx.ai',
  custom: 'Custom Backend',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getEffectiveConfig());

  const saveSettings = useCallback((nextSettings) => {
    setSettings(nextSettings);
    try {
      localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(nextSettings));
    } catch {
      // ignore storage errors
    }
  }, []);

  const resetToMock = useCallback(() => {
    const defaults = getEnvDefaults();
    const mockConfig = {
      ...defaults,
      provider: 'mock',
      _explicitMock: true,
    };
    saveSettings(mockConfig);
    return mockConfig;
  }, [saveSettings]);

  const useEnvDefaults = useCallback(() => {
    const defaults = getEnvDefaults();
    setSettings(defaults);
    try {
      localStorage.removeItem(PROVIDER_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    return defaults;
  }, []);

  const isConfigured = useMemo(() => isProviderConfigComplete(settings), [settings]);
  const providerLabel = PROVIDER_LABELS[settings.provider] || settings.provider;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saveSettings,
        resetToMock,
        useEnvDefaults,
        isConfigured,
        providerLabel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
