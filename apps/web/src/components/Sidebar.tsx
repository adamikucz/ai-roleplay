"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus, Bot, ChevronLeft, ChevronRight,
  Trash2, ArchiveRestore, Globe, Sparkles
} from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { SUPPORTED_LANGUAGES } from "@aether/shared";
import type { SessionListItem } from "@aether/shared";

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'teraz';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

export function Sidebar({
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  onRecoverSession,
}: {
  onNewChat: () => void;
  onSwitchSession: (session: SessionListItem) => void;
  onDeleteSession: (id: string) => void;
  onRecoverSession: (id: string) => void;
}) {
  const st = useChatStore();
  const [collapsed, setCollapsed] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const activeSessions = st.sessions.filter(s => !s.archived);
  const archivedSessions = st.sessions.filter(s => s.archived);

  return (
    <motion.aside
      initial={{ width: 320 }}
      animate={{ width: collapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-full flex-col glass-panel overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Aether</h1>
              <p className="text-[0.65rem] text-white/40">Roleplay AI</p>
            </div>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Actions */}
      <div className={`flex gap-2 border-b border-white/[0.06] p-3 ${collapsed ? 'flex-col items-center' : ''}`}>
        <button
          onClick={onNewChat}
          className={`btn-primary ${collapsed ? '!p-2.5 !rounded-xl' : 'flex-1'}`}
          title="Nowy chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {!collapsed && <span>Nowy chat</span>}
        </button>
        {!collapsed && (
          <button
            onClick={() => st.setBotCreatorOpen(true)}
            className="btn-ghost !border-white/[0.06] !px-3"
            title="Stwórz bota"
          >
            <Bot className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => st.setBotCreatorOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
            title="Stwórz bota"
          >
            <Bot className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sessions List */}
      {!collapsed && (
        <div className="scrollbar-soft flex-1 overflow-y-auto px-2 py-3">
          {activeSessions.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-white/30">
              Brak chatów. Rozpocznij nową rozmowę!
            </div>
          )}

          <AnimatePresence>
            {activeSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className={`group mb-1 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                  session.id === st.sessionId
                    ? 'bg-violet-500/15 border border-violet-500/20 shadow-md'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
                onClick={() => onSwitchSession(session)}
              >
                <div className="avatar avatar-bot !h-9 !w-9 text-xs">
                  {getInitials(session.characterName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{session.characterName}</span>
                    <span className="ml-2 flex-shrink-0 text-[0.65rem] text-white/30">{timeAgo(session.updatedAt)}</span>
                  </div>
                  <p className="truncate text-xs text-white/40">{session.title}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  className="hidden h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-white/20 transition hover:bg-rose-500/15 hover:text-rose-400 group-hover:grid"
                  title="Usuń"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Archived */}
          {archivedSessions.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/25">
                Zarchiwizowane
              </div>
              {archivedSessions.map((session) => (
                <div
                  key={session.id}
                  className="group mb-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 opacity-50 transition hover:opacity-80 hover:bg-white/[0.03]"
                >
                  <div className="avatar !h-8 !w-8 text-[0.65rem]" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                    {getInitials(session.characterName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-sm text-white/60">{session.characterName}</span>
                  </div>
                  <button
                    onClick={() => onRecoverSession(session.id)}
                    className="hidden h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-emerald-500/15 hover:text-emerald-400 group-hover:grid"
                    title="Przywróć"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Language Selector (bottom) */}
      {!collapsed && (
        <div className="relative border-t border-white/[0.06] p-3">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white/70"
          >
            <Globe className="h-4 w-4" />
            <span>{SUPPORTED_LANGUAGES.find(l => l.code === st.language)?.label ?? 'Polski'}</span>
          </button>

          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-3 right-3 mb-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#12142e] p-1.5 shadow-2xl scrollbar-soft"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { st.setLanguage(lang.code); setLangOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      st.language === lang.code
                        ? 'bg-violet-500/15 text-violet-300'
                        : 'text-white/60 hover:bg-white/[0.05] hover:text-white/80'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  );
}
