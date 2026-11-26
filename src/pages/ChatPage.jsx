import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RouteMeta from '../components/RouteMeta.jsx';
import { AsciiSpinner } from '../components/AsciiPrimitives.jsx';
import OnboardingModal from '../components/OnboardingModal.jsx';
import { useChat } from '../contexts/ChatContext.jsx';
import { useProfile } from '../contexts/ProfileContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const {
    sessions,
    activeSession,
    activeSessionId,
    isStreaming,
    error,
    clearError,
    isOnline,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    sendUserMessage,
    stopGeneration,
    regenerateLastReply,
    retryLastTurn,
  } = useChat();

  const { profile, hasProfileData } = useProfile();
  const { isConfigured, settings, providerLabel } = useSettings();

  const location = useLocation();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showJumpLatest, setShowJumpLatest] = useState(false);

  const feedRef = useRef(null);
  const textareaRef = useRef(null);
  const autoStickRef = useRef(true);
  const handledLocationKeyRef = useRef(null);

  // Handle initialPrompt passed from HomePage or ExplorePage
  useEffect(() => {
    const state = location.state;
    if (!state?.initialPrompt) return;
    if (handledLocationKeyRef.current === location.key) return;
    handledLocationKeyRef.current = location.key;

    const text = state.initialPrompt;
    const autoSend = Boolean(state.autoSend);

    // Clear router state so refresh doesn't re-trigger
    navigate(location.pathname, { replace: true, state: null });

    if (autoSend) {
      const sid = createSession();
      sendUserMessage(text, { sessionId: sid });
    } else {
      setInput(text);
      textareaRef.current?.focus();
    }
  }, [location.key, location.pathname, location.state, navigate, createSession, sendUserMessage]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  // Smart auto-scroll
  useEffect(() => {
    const el = feedRef.current;
    if (!el || !autoStickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [activeSession?.messages, isStreaming]);

  const handleScroll = () => {
    const el = feedRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 80;
    autoStickRef.current = nearBottom;
    setShowJumpLatest(!nearBottom && (activeSession?.messages?.length || 0) > 0);
  };

  const jumpToLatest = () => {
    const el = feedRef.current;
    if (!el) return;
    autoStickRef.current = true;
    el.scrollTop = el.scrollHeight;
    setShowJumpLatest(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    autoStickRef.current = true;
    await sendUserMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (msgId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const startRename = (session) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const commitRename = (sessionId) => {
    if (editingTitle.trim()) {
      renameSession(sessionId, editingTitle);
    }
    setEditingSessionId(null);
  };

  const messages = activeSession?.messages || [];
  const hasMessages = messages.length > 0;
  const showOnboardingBanner = !hasProfileData && !profile.skipped;

  return (
    <div className={styles.layout}>
      <RouteMeta
        title="Chat"
        description="Chat with Career Mitar AI for calm, India-specific career advice, skill roadmaps, and resume/interview guidance."
      />

      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
        aria-label="Chat sessions"
      >
        <div className={styles.sidebarHeader}>
          <button
            type="button"
            className={`btn btn-primary btn-sm ${styles.fullWidth}`}
            onClick={() => {
              createSession();
              setSidebarOpen(false);
            }}
          >
            + New Chat
          </button>
        </div>

        <div className={styles.sessionList}>
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                className={`${styles.sessionItem} ${isActive ? styles.sessionActive : ''}`}
              >
                {editingSessionId === s.id ? (
                  <input
                    type="text"
                    className={`input ${styles.renameInput}`}
                    value={editingTitle}
                    autoFocus
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => commitRename(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(s.id);
                      if (e.key === 'Escape') setEditingSessionId(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.sessionBtn}
                    onClick={() => {
                      selectSession(s.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className={styles.sessionTitle}>{s.title}</span>
                  </button>
                )}
                <div className={styles.sessionActions}>
                  <button
                    type="button"
                    className={styles.miniAction}
                    aria-label={`Rename ${s.title}`}
                    title="Rename"
                    onClick={() => startRename(s)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={styles.miniAction}
                    aria-label={`Delete ${s.title}`}
                    title="Delete"
                    onClick={() => deleteSession(s.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={`btn btn-sm ${styles.fullWidth}`}
            onClick={() => setOnboardingOpen(true)}
          >
            {hasProfileData ? 'Edit Student Context' : 'Add Student Context'}
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button
              type="button"
              className={`btn btn-sm ${styles.sidebarToggle}`}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              ☰ Chats
            </button>
            <h1 className={styles.sessionHeading}>{activeSession?.title || 'Chat'}</h1>
          </div>
          <div className={styles.toolbarRight}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setOnboardingOpen(true)}
            >
              {hasProfileData ? 'Context: Active' : 'Context: None'}
            </button>
          </div>
        </div>

        {/* Status Banners */}
        {!isOnline && (
          <div className={`${styles.banner} ${styles.bannerWarn}`} role="status">
            <span>You are offline. Reconnect to send messages.</span>
          </div>
        )}

        {!isConfigured && settings.provider !== 'mock' && (
          <div className={`${styles.banner} ${styles.bannerWarn}`} role="status">
            <span>
              <strong>{providerLabel}</strong> is not configured yet.
            </span>
            <Link to="/settings" className="btn btn-sm">
              Open Settings
            </Link>
          </div>
        )}

        {showOnboardingBanner && (
          <div className={styles.banner}>
            <span>
              Want tailored Indian college &amp; role advice? Add your optional student context.
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setOnboardingOpen(true)}
            >
              Personalize
            </button>
          </div>
        )}

        <div ref={feedRef} className={styles.feed} onScroll={handleScroll}>
          {!hasMessages ? (
            <div className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>Ask Career Mitar AI</h2>
              <p className={styles.emptyCopy}>
                Ask about Indian tech or non-tech roles, switching streams, GATE vs. jobs, resume
                feedback, or building a 6-month study plan.
              </p>
              <div className={styles.quickPrompts}>
                {[
                  'Compare Data Analyst vs. Software Engineer for a fresher in India',
                  'Review my 2nd-year B.Tech semester plan for internships',
                  'How do I prepare for off-campus fresher hiring in Bengaluru/Pune?',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="btn btn-sm"
                    onClick={() => sendUserMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages} aria-live="polite" aria-relevant="additions">
              {messages.map((msg, idx) => {
                const isLastAssistant =
                  msg.role === 'assistant' && idx === messages.length - 1;
                const showCaret = isLastAssistant && isStreaming;

                return (
                  <article
                    key={msg.id}
                    className={`${styles.message} ${
                      msg.role === 'user' ? styles.userMsg : styles.assistantMsg
                    }`}
                  >
                    <header className={styles.msgHeader}>
                      <span className={styles.msgRole}>
                        {msg.role === 'user' ? 'You' : 'Career Mitar'}
                      </span>
                      {msg.content && (
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => handleCopy(msg.id, msg.content)}
                        >
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </header>

                    <div className={styles.msgBody}>
                      {msg.role === 'user' ? (
                        <p className={styles.userText}>{msg.content}</p>
                      ) : msg.content ? (
                        <div className={styles.markdown}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                          {showCaret && <span className="streaming-caret" aria-hidden="true" />}
                        </div>
                      ) : (
                        <AsciiSpinner label="Thinking" />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {error && (
            <div className={styles.errorCard} role="alert">
              <div className={styles.errorText}>
                <strong>{error.code || 'ERROR'}:</strong> {error.message}
              </div>
              <div className={styles.errorActions}>
                <button type="button" className="btn btn-sm" onClick={retryLastTurn}>
                  Retry
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={clearError}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {showJumpLatest && (
          <button type="button" className={`btn btn-sm ${styles.jumpBtn}`} onClick={jumpToLatest}>
            ↓ Jump to latest reply
          </button>
        )}

        <footer className={styles.composerWrap}>
          {hasMessages && (
            <div className={styles.streamControls}>
              {isStreaming ? (
                <button type="button" className="btn btn-sm btn-danger" onClick={stopGeneration}>
                  ■ Stop generating
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={regenerateLastReply}
                  disabled={!isOnline}
                >
                  ↻ Regenerate reply
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSend} className={styles.composer}>
            <label htmlFor="chat-input" className="sr-only">
              Message Career Mitar AI
            </label>
            <textarea
              ref={textareaRef}
              id="chat-input"
              rows={1}
              className={`textarea ${styles.textarea}`}
              placeholder="Ask a career question… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || isStreaming || !isOnline}
            >
              Send
            </button>
          </form>
        </footer>
      </section>

      <OnboardingModal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
}
