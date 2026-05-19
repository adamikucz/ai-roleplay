"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import { AuthGate } from "./AuthGate";
import { Sidebar } from "./Sidebar";
import { BotCreator } from "./BotCreator";
import {
  characters as fetchCharacters,
  createSession,
  listSessions,
  getSessionMessages,
  deleteSessionApi,
  recoverSessionApi
} from "@/lib/api";
import { streamChat } from "@/lib/streamChat";
import { useChatStore, type UiMessage } from "@/store/chat.store";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { RelationshipPanel } from "./RelationshipPanel";
import { SceneAtmosphere } from "./SceneAtmosphere";
import { SUPPORTED_MODELS, type SessionListItem } from "@aether/shared";

function InnerChat() {
  const st = useChatStore();
  const [booting, setBooting] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => st.characters.find(c => c.id === st.characterId) ?? null,
    [st.characters, st.characterId]
  );

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [st.messages]);

  // Boot: fetch characters and sessions
  useEffect(() => {
    let dead = false;
    async function boot() {
      try {
        const [charData, sessData] = await Promise.all([fetchCharacters(), listSessions()]);
        if (dead) return;
        st.setCharacters(charData.characters);
        st.setSessions(sessData.sessions);

        // If there are existing sessions, load the most recent one
        if (sessData.sessions.length > 0) {
          const latest = sessData.sessions.filter((s: SessionListItem) => !s.archived)[0];
          if (latest) {
            await loadSession(latest);
          }
        } else {
          // No sessions — auto-create one with the first character
          const first = charData.characters[0];
          if (first) {
            st.setCharacter(first.id);
            const s = await createSession(first.id, st.language);
            if (dead) return;
            st.setSession(s.id);
            st.addMessage({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: first.greeting,
              createdAt: Date.now()
            });
            // Refresh session list
            const updated = await listSessions();
            st.setSessions(updated.sessions);
          }
        }
      } catch (err) {
        console.error('Boot error:', err);
      }
      setBooting(false);
    }
    boot();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => { dead = true; };
  }, []);

  async function loadSession(session: SessionListItem) {
    st.setCharacter(session.characterId);
    st.setSession(session.id);

    try {
      const data = await getSessionMessages(session.id);
      const uiMessages: UiMessage[] = data.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.createdAt).getTime()
      }));

      // If no messages, add the greeting
      if (uiMessages.length === 0) {
        const char = st.characters.find(c => c.id === session.characterId);
        if (char?.greeting) {
          uiMessages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: char.greeting,
            createdAt: Date.now()
          });
        }
      }

      st.switchSession(session.id, uiMessages);
    } catch {
      st.switchSession(session.id, []);
    }
  }

  const handleNewChat = useCallback(async () => {
    if (!st.characters.length) return;

    // Use the currently selected character, or the first one
    const charId = st.characterId ?? st.characters[0]?.id;
    if (!charId) return;

    const character = st.characters.find(c => c.id === charId);
    const s = await createSession(charId, st.language);
    st.setSession(s.id);
    st.setCharacter(charId);
    st.setMessages([]);
    st.setMeta(null as any, null as any);

    if (character?.greeting) {
      st.addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: character.greeting,
        createdAt: Date.now()
      });
    }

    // Refresh sessions
    const updated = await listSessions();
    st.setSessions(updated.sessions);
    setMobileMenu(false);
  }, [st.characterId, st.characters, st.language]);

  const handleSwitchSession = useCallback(async (session: SessionListItem) => {
    await loadSession(session);
    setMobileMenu(false);
  }, [st.characters]);

  const handleDeleteSession = useCallback(async (id: string) => {
    await deleteSessionApi(id);
    const updated = await listSessions();
    st.setSessions(updated.sessions);
    if (st.sessionId === id) {
      const next = updated.sessions.filter((s: SessionListItem) => !s.archived)[0];
      if (next) {
        await loadSession(next);
      } else {
        st.reset();
      }
    }
  }, [st.sessionId]);

  const handleRecoverSession = useCallback(async (id: string) => {
    await recoverSessionApi(id);
    const updated = await listSessions();
    st.setSessions(updated.sessions);
  }, []);

  const handleBotCreated = useCallback(async (character: any) => {
    // Refresh characters
    const charData = await fetchCharacters();
    st.setCharacters(charData.characters);

    // Create a session with the new character
    const s = await createSession(character.id, st.language);
    st.setSession(s.id);
    st.setCharacter(character.id);
    st.setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: character.greeting,
      createdAt: Date.now()
    }]);

    // Refresh sessions
    const updated = await listSessions();
    st.setSessions(updated.sessions);
  }, [st.language]);

  async function send(content: string) {
    if (!st.sessionId || !st.characterId || st.isStreaming) return;

    st.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: Date.now()
    });
    st.startAssistantStream();

    await streamChat({
      sessionId: st.sessionId,
      characterId: st.characterId,
      content,
      language: st.language,
      modelPreference: st.selectedModel,
      onEvent: e => {
        if (e.type === 'status') st.setStatus(e.stage);
        if (e.type === 'token') st.appendToken(e.token);
        if (e.type === 'meta') st.setMeta(e.relationship, e.scene);
        if (e.type === 'done') st.finishStream();
        if (e.type === 'error') {
          st.appendToken(`\n\n[${e.message}]`);
          st.finishStream();
        }
      }
    }).catch(err => {
      st.appendToken(`\n\n[Błąd połączenia: ${err instanceof Error ? err.message : 'nieznany'}]`);
      st.finishStream();
    });

    // Refresh sessions to update the timestamp
    listSessions().then(d => st.setSessions(d.sessions)).catch(() => {});
  }

  if (booting) {
    return (
      <main className="grid h-screen place-items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 glass-panel px-8 py-6"
        >
          <Sparkles className="h-5 w-5 animate-pulse text-violet-400" />
          <span className="text-white/60">Wczytywanie świata...</span>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden">
      <SceneAtmosphere scene={st.scene} />
      <BotCreator onCreated={handleBotCreated} />

      <div className="relative z-10 flex h-screen gap-3 p-3 md:p-4">
        {/* Sidebar — desktop */}
        <div className="hidden md:flex">
          <Sidebar
            onNewChat={handleNewChat}
            onSwitchSession={handleSwitchSession}
            onDeleteSession={handleDeleteSession}
            onRecoverSession={handleRecoverSession}
          />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileMenu(false)}
              />
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed left-0 top-0 z-50 h-full w-[320px] md:hidden"
              >
                <Sidebar
                  onNewChat={handleNewChat}
                  onSwitchSession={handleSwitchSession}
                  onDeleteSession={handleDeleteSession}
                  onRecoverSession={handleRecoverSession}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden glass-panel">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="grid h-9 w-9 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white/70 md:hidden"
              >
                {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Character info */}
              <div className="avatar avatar-bot !h-9 !w-9 text-xs">
                {active?.avatarUrl ? (
                  <img src={active.avatarUrl} alt={active.name} />
                ) : (
                  active?.name?.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'AI'
                )}
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">{active?.name ?? 'Aether'}</h1>
                <p className="text-[0.7rem] text-white/40">{active?.tagline ?? 'Immersyjna rozmowa z AI'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={st.selectedModel}
                onChange={(e) => st.setSelectedModel(e.target.value)}
                className="bg-transparent border border-white/[0.08] text-white/60 hover:text-white/80 rounded-lg px-2.5 py-1 text-[11px] font-medium outline-none focus:border-white/20 transition cursor-pointer max-w-[120px] sm:max-w-xs"
              >
                {SUPPORTED_MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#0f0f12] text-white">
                    {m.label}
                  </option>
                ))}
              </select>

              <div className={`status-badge ${st.isStreaming ? 'streaming' : ''} hidden sm:inline-flex`}>
                <span className="dot" />
                {st.isStreaming ? st.status : 'online'}
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="scrollbar-soft flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
            <AnimatePresence initial={false}>
              {st.messages.map(m => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  characterName={active?.name}
                  avatarUrl={active?.avatarUrl}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <Composer disabled={st.isStreaming} onSend={send} />
        </section>

        {/* Relationship panel — desktop */}
        <aside className="hidden min-h-0 w-[340px] xl:block">
          <RelationshipPanel relationship={st.relationship} scene={st.scene} />
        </aside>
      </div>
    </main>
  );
}

export function ChatShell() {
  return (
    <AuthGate>
      <InnerChat />
    </AuthGate>
  );
}
