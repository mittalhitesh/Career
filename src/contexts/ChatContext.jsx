import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage as apiSendMessage } from '../services/chatApi.js';
import { ERROR_CODES } from '../services/errors.js';
import { useProfile } from './ProfileContext.jsx';

const CHATS_STORAGE_KEY = 'career_mitar_chats_v1';

const ChatContext = createContext(null);

function createId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptySession(title = 'New Conversation') {
  const now = Date.now();
  return {
    id: createId('chat'),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function loadChatState() {
  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        return {
          sessions: parsed.sessions,
          activeSessionId: parsed.activeSessionId || parsed.sessions[0].id,
        };
      }
    }
  } catch {
    // ignore corrupted storage
  }
  const initial = createEmptySession();
  return {
    sessions: [initial],
    activeSessionId: initial.id,
  };
}

function deriveSessionTitle(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New Conversation';
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}…` : cleaned;
}

export function ChatProvider({ children }) {
  const { profile } = useProfile();
  const [state, setState] = useState(loadChatState);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const abortRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeSession =
    state.sessions.find((s) => s.id === state.activeSessionId) || state.sessions[0];

  const createSession = useCallback((title = 'New Conversation') => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsStreaming(false);
    }
    setError(null);
    const next = createEmptySession(title);
    setState((prev) => ({
      sessions: [next, ...prev.sessions],
      activeSessionId: next.id,
    }));
    return next.id;
  }, []);

  const selectSession = useCallback((sessionId) => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsStreaming(false);
    }
    setError(null);
    setState((prev) => ({
      ...prev,
      activeSessionId: sessionId,
    }));
  }, []);

  const renameSession = useCallback((sessionId, newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, title: trimmed, updatedAt: Date.now() } : s
      ),
    }));
  }, []);

  const deleteSession = useCallback((sessionId) => {
    setState((prev) => {
      const remaining = prev.sessions.filter((s) => s.id !== sessionId);
      if (remaining.length === 0) {
        const fresh = createEmptySession();
        return { sessions: [fresh], activeSessionId: fresh.id };
      }
      const nextActive =
        prev.activeSessionId === sessionId ? remaining[0].id : prev.activeSessionId;
      return { sessions: remaining, activeSessionId: nextActive };
    });
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const runAssistantTurn = useCallback(
    async (sessionId, conversationHistory, assistantMsgId) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setError(null);

      try {
        await apiSendMessage({
          messages: conversationHistory,
          profile,
          signal: controller.signal,
          onToken: (token) => {
            setState((prev) => ({
              ...prev,
              sessions: prev.sessions.map((s) => {
                if (s.id !== sessionId) return s;
                return {
                  ...s,
                  updatedAt: Date.now(),
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: m.content + token } : m
                  ),
                };
              }),
            }));
          },
        });
      } catch (err) {
        if (err?.code === ERROR_CODES.ABORTED) {
          // Keep whatever partial tokens arrived
          return;
        }
        setError(err);
        // Remove empty assistant placeholder on hard failure so retry is clean
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.filter(
                (m) => !(m.id === assistantMsgId && m.content.trim() === '')
              ),
            };
          }),
        }));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsStreaming(false);
      }
    },
    [profile]
  );

  const sendUserMessage = useCallback(
    async (text, { sessionId: targetSessionId } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const sid = targetSessionId || activeSession.id;
      const targetSession = state.sessions.find((s) => s.id === sid) || activeSession;

      const userMsg = {
        id: createId('msg'),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      };
      const assistantMsg = {
        id: createId('msg'),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      const isFirstMessage = targetSession.messages.length === 0;
      const nextHistory = [...targetSession.messages, userMsg];

      setState((prev) => ({
        ...prev,
        activeSessionId: sid,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sid) return s;
          return {
            ...s,
            title: isFirstMessage ? deriveSessionTitle(trimmed) : s.title,
            updatedAt: Date.now(),
            messages: [...s.messages, userMsg, assistantMsg],
          };
        }),
      }));

      await runAssistantTurn(sid, nextHistory, assistantMsg.id);
    },
    [activeSession, isStreaming, runAssistantTurn, state.sessions]
  );

  const regenerateLastReply = useCallback(async () => {
    if (isStreaming || !activeSession) return;
    const msgs = activeSession.messages;
    if (msgs.length === 0) return;

    // Trim trailing assistant message(s) back to the last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const baseHistory = msgs.slice(0, lastUserIndex + 1);
    const assistantMsg = {
      id: createId('msg'),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === activeSession.id
          ? { ...s, updatedAt: Date.now(), messages: [...baseHistory, assistantMsg] }
          : s
      ),
    }));

    await runAssistantTurn(activeSession.id, baseHistory, assistantMsg.id);
  }, [activeSession, isStreaming, runAssistantTurn]);

  const retryLastTurn = useCallback(async () => {
    await regenerateLastReply();
  }, [regenerateLastReply]);

  return (
    <ChatContext.Provider
      value={{
        sessions: state.sessions,
        activeSession,
        activeSessionId: activeSession?.id,
        isStreaming,
        error,
        clearError: () => setError(null),
        isOnline,
        createSession,
        selectSession,
        renameSession,
        deleteSession,
        sendUserMessage,
        stopGeneration,
        regenerateLastReply,
        retryLastTurn,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
