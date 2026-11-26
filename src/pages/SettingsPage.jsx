import { useState } from 'react';
import RouteMeta from '../components/RouteMeta.jsx';
import { AsciiBox, AsciiDivider, AsciiSpinner } from '../components/AsciiPrimitives.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { testProviderConnection } from '../services/chatApi.js';
import styles from './SettingsPage.module.css';

function PasswordInput({ id, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.passwordWrap}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide secret' : 'Show secret'}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, saveSettings, resetToMock, useEnvDefaults } = useSettings();
  const [draft, setDraft] = useState(settings);
  const [statusMsg, setStatusMsg] = useState(null);
  const [testState, setTestState] = useState({ loading: false, ok: null, message: '' });

  const updateField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setStatusMsg(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings(draft);
    setStatusMsg('Configuration saved to browser localStorage.');
  };

  const handleReset = () => {
    const next = resetToMock();
    setDraft(next);
    setTestState({ loading: false, ok: null, message: '' });
    setStatusMsg('Reset to Mock (Demo) provider.');
  };

  const handleUseEnv = () => {
    const next = useEnvDefaults();
    setDraft(next);
    setTestState({ loading: false, ok: null, message: '' });
    setStatusMsg('Cleared browser overrides and loaded .env defaults.');
  };

  const handleTest = async () => {
    setTestState({ loading: true, ok: null, message: '' });
    try {
      const result = await testProviderConnection(draft);
      setTestState({ loading: false, ok: true, message: result.message });
    } catch (err) {
      setTestState({
        loading: false,
        ok: false,
        message: err.message || 'Connection test failed.',
      });
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <RouteMeta
        title="Settings"
        description="Configure your AI provider for Career Mitar AI: Mock Demo, OpenAI-compatible, IBM Watsonx.ai, or Custom Backend."
      />

      <header className={styles.header}>
        <h1 className={styles.title}>AI Provider Settings</h1>
        <p className={styles.subtitle}>
          Choose how Career Mitar AI generates responses. All credentials stay in your browser.
        </p>
      </header>

      <div className={styles.grid}>
        <form onSubmit={handleSave} className={styles.formCard}>
          <div className={styles.field}>
            <label htmlFor="provider-select" className="label">
              Active Provider
            </label>
            <select
              id="provider-select"
              className="select"
              value={draft.provider}
              onChange={(e) => updateField('provider', e.target.value)}
            >
              <option value="mock">Mock (Demo — No API key required)</option>
              <option value="gemini">Google Gemini (Native API)</option>
              <option value="openai">OpenAI-Compatible (OpenAI, Groq, OpenRouter, Ollama)</option>
              <option value="watsonx">IBM Watsonx.ai (Granite / Llama)</option>
              <option value="custom">Custom Backend Proxy (Recommended for production)</option>
            </select>
          </div>

          {draft.provider === 'mock' && (
            <p className={styles.hint}>
              Mock mode streams realistic Indian career guidance locally. It also simulates a
              1-in-10 error (or when a prompt contains <code>[simulate-error]</code>) so you can
              test retry behavior.
            </p>
          )}

          {draft.provider === 'gemini' && (
            <>
              <div className={styles.field}>
                <label htmlFor="gemini-key" className="label">
                  Gemini API Key
                </label>
                <PasswordInput
                  id="gemini-key"
                  value={draft.geminiApiKey}
                  onChange={(e) => updateField('geminiApiKey', e.target.value)}
                  placeholder="AIza..."
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="gemini-model" className="label">
                  Gemini Model
                </label>
                <input
                  id="gemini-model"
                  type="text"
                  className="input"
                  value={draft.geminiModel}
                  onChange={(e) => updateField('geminiModel', e.target.value)}
                  placeholder="gemini-3.8-flash"
                />
              </div>
            </>
          )}

          {draft.provider === 'openai' && (
            <>
              <div className={styles.field}>
                <label htmlFor="openai-key" className="label">
                  API Key
                </label>
                <PasswordInput
                  id="openai-key"
                  value={draft.openaiApiKey}
                  onChange={(e) => updateField('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="openai-url" className="label">
                  Base URL
                </label>
                <input
                  id="openai-url"
                  type="url"
                  className="input"
                  value={draft.openaiBaseUrl}
                  onChange={(e) => updateField('openaiBaseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="openai-model" className="label">
                  Model Name
                </label>
                <input
                  id="openai-model"
                  type="text"
                  className="input"
                  value={draft.openaiModel}
                  onChange={(e) => updateField('openaiModel', e.target.value)}
                  placeholder="gpt-4o-mini"
                />
              </div>
            </>
          )}

          {draft.provider === 'watsonx' && (
            <>
              <div className={styles.field}>
                <label htmlFor="wx-key" className="label">
                  IBM Cloud API Key
                </label>
                <PasswordInput
                  id="wx-key"
                  value={draft.watsonxApiKey}
                  onChange={(e) => updateField('watsonxApiKey', e.target.value)}
                  placeholder="IBM Cloud IAM API key"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="wx-project" className="label">
                  Watsonx Project ID
                </label>
                <input
                  id="wx-project"
                  type="text"
                  className="input"
                  value={draft.watsonxProjectId}
                  onChange={(e) => updateField('watsonxProjectId', e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="wx-url" className="label">
                  Watsonx Region URL
                </label>
                <input
                  id="wx-url"
                  type="url"
                  className="input"
                  value={draft.watsonxUrl}
                  onChange={(e) => updateField('watsonxUrl', e.target.value)}
                  placeholder="https://us-south.ml.cloud.ibm.com"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="wx-model" className="label">
                  Model ID
                </label>
                <input
                  id="wx-model"
                  type="text"
                  className="input"
                  value={draft.watsonxModelId}
                  onChange={(e) => updateField('watsonxModelId', e.target.value)}
                  placeholder="ibm/granite-3-8b-instruct"
                />
              </div>
            </>
          )}

          {draft.provider === 'custom' && (
            <>
              <div className={styles.field}>
                <label htmlFor="cb-url" className="label">
                  Backend Endpoint URL
                </label>
                <input
                  id="cb-url"
                  type="url"
                  className="input"
                  value={draft.customBackendUrl}
                  onChange={(e) => updateField('customBackendUrl', e.target.value)}
                  placeholder="https://your-proxy.example.com/api/chat"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cb-hname" className="label">
                  Optional Auth Header Name
                </label>
                <input
                  id="cb-hname"
                  type="text"
                  className="input"
                  value={draft.customHeaderName}
                  onChange={(e) => updateField('customHeaderName', e.target.value)}
                  placeholder="X-API-Key or Authorization"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cb-hval" className="label">
                  Optional Auth Header Value
                </label>
                <PasswordInput
                  id="cb-hval"
                  value={draft.customHeaderValue}
                  onChange={(e) => updateField('customHeaderValue', e.target.value)}
                  placeholder="Bearer ... or secret token"
                />
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary">
              Save Configuration
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleTest}
              disabled={testState.loading}
            >
              {testState.loading ? <AsciiSpinner label="Testing" /> : 'Test Connection'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Reset to Mock
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleUseEnv}>
              Use .env Defaults
            </button>
          </div>

          {statusMsg && (
            <div className={styles.statusBanner} role="status">
              {statusMsg}
            </div>
          )}

          {testState.message && (
            <div
              className={`${styles.testBanner} ${
                testState.ok ? styles.testOk : styles.testErr
              }`}
              role="status"
            >
              <strong>{testState.ok ? 'OK:' : 'Failed:'}</strong> {testState.message}
            </div>
          )}
        </form>

        <aside className={styles.noticeCol}>
          <AsciiBox title="Browser Storage & CORS Notice">
            <h2 className={styles.noticeHeading}>How your keys are handled</h2>
            <p className={styles.noticeText}>
              Career Mitar AI is a frontend-only app. Any API keys you enter here are stored only in
              your browser&apos;s <code>localStorage</code> and sent directly from your browser to
              the provider you select.
            </p>
            <AsciiDivider label="About CORS" />
            <p className={styles.noticeText}>
              Some providers (including IBM Watsonx.ai and certain OpenAI-compatible hosts) block
              direct browser requests via CORS. If <strong>Test Connection</strong> reports a CORS
              or network error, deploy the tiny 15-line proxy in <code>docs/API_SETUP.md</code> and
              select <strong>Custom Backend Proxy</strong>.
            </p>
          </AsciiBox>
        </aside>
      </div>
    </div>
  );
}
