import { create } from "zustand";
import type { RelationshipState, SceneState, SessionListItem } from "@aether/shared";

export type UiUser = { id:string; email:string; displayName:string };
export type UiCharacter = { id:string; name:string; tagline:string|null; greeting:string; avatarUrl:string|null; description?:string|null };
export type UiMessage = { id:string; role:'user'|'assistant'; content:string; streaming?:boolean; createdAt:number };

function detectLanguage(): string {
  if (typeof window === 'undefined') return 'pl';
  const stored = localStorage.getItem('aether_language');
  if (stored) return stored;
  const nav = navigator.language?.slice(0, 2) ?? 'pl';
  const supported = ['pl','en','de','es','fr','it','pt','uk','ru','ja','ko'];
  return supported.includes(nav) ? nav : 'pl';
}

type State = {
  user: UiUser|null;
  characters: UiCharacter[];
  characterId: string|null;
  sessionId: string|null;
  sessions: SessionListItem[];
  messages: UiMessage[];
  relationship: RelationshipState|null;
  scene: SceneState|null;
  isStreaming: boolean;
  status: string;
  language: string;
  selectedModel: string;
  sidebarOpen: boolean;
  botCreatorOpen: boolean;

  setUser: (u:UiUser|null) => void;
  setCharacters: (c:UiCharacter[]) => void;
  setCharacter: (id:string) => void;
  setSession: (id:string) => void;
  setSessions: (s:SessionListItem[]) => void;
  setMessages: (m:UiMessage[]) => void;
  addMessage: (m:UiMessage) => void;
  startAssistantStream: () => void;
  appendToken: (t:string) => void;
  finishStream: () => void;
  setMeta: (r:RelationshipState, s:SceneState) => void;
  setStatus: (s:string) => void;
  setLanguage: (l:string) => void;
  setSelectedModel: (m:string) => void;
  setSidebarOpen: (open:boolean) => void;
  setBotCreatorOpen: (open:boolean) => void;
  reset: () => void;
  switchSession: (id:string, messages:UiMessage[], relationship?:RelationshipState|null, scene?:SceneState|null) => void;
};

export const useChatStore = create<State>((set) => ({
  user: null,
  characters: [],
  characterId: null,
  sessionId: null,
  sessions: [],
  messages: [],
  relationship: null,
  scene: null,
  isStreaming: false,
  status: 'idle',
  language: detectLanguage(),
  selectedModel: typeof window !== 'undefined' ? localStorage.getItem('aether_model') || 'meta-llama/llama-3.3-70b-instruct:free' : 'meta-llama/llama-3.3-70b-instruct:free',
  sidebarOpen: false,
  botCreatorOpen: false,

  setUser: user => set({ user }),
  setCharacters: characters => set({ characters }),
  setCharacter: characterId => set({ characterId }),
  setSession: sessionId => set({ sessionId }),
  setSessions: sessions => set({ sessions }),
  setMessages: messages => set({ messages }),

  addMessage: m => set(st => ({ messages: [...st.messages, m] })),

  startAssistantStream: () => set(st => ({
    isStreaming: true,
    messages: [...st.messages, { id: crypto.randomUUID(), role: 'assistant', content: '', streaming: true, createdAt: Date.now() }]
  })),

  appendToken: t => set(st => ({
    messages: st.messages.map((m, i) => i === st.messages.length - 1 && m.streaming ? { ...m, content: m.content + t } : m)
  })),

  finishStream: () => set(st => ({
    isStreaming: false,
    status: 'idle',
    messages: st.messages.map(m => m.streaming ? { ...m, streaming: false } : m)
  })),

  setMeta: (relationship, scene) => set({ relationship, scene }),
  setStatus: status => set({ status }),

  setLanguage: (language) => {
    if (typeof window !== 'undefined') localStorage.setItem('aether_language', language);
    set({ language });
  },

  setSelectedModel: (selectedModel) => {
    if (typeof window !== 'undefined') localStorage.setItem('aether_model', selectedModel);
    set({ selectedModel });
  },

  setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
  setBotCreatorOpen: botCreatorOpen => set({ botCreatorOpen }),

  reset: () => set({
    sessionId: null, messages: [], relationship: null, scene: null,
    isStreaming: false, status: 'idle'
  }),

  switchSession: (id, messages, relationship, scene) => set({
    sessionId: id,
    messages,
    relationship: relationship ?? null,
    scene: scene ?? null,
    isStreaming: false,
    status: 'idle'
  })
}));
