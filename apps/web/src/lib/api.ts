import type { LoginInput, RegisterInput, CreateCharacterFromDescriptionInput, SessionListItem, MessageHistoryItem } from "@aether/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const tokenStore = {
  get: () => typeof window === 'undefined' ? null : localStorage.getItem('aether_token'),
  set: (t: string) => localStorage.setItem('aether_token', t),
  clear: () => localStorage.removeItem('aether_token')
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  
  const headers: HeadersInit = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {})
  };

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json() as Promise<T>;
}

// Auth
export async function login(input: LoginInput) {
  const out = await request<any>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  tokenStore.set(out.token);
  return out;
}

export async function register(input: RegisterInput) {
  const out = await request<any>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
  tokenStore.set(out.token);
  return out;
}

export async function me() {
  return request<any>('/auth/me');
}

// Characters
export async function characters() {
  return request<{ characters: any[] }>('/characters');
}

export async function createCharacterFromDescription(input: CreateCharacterFromDescriptionInput) {
  return request<any>('/characters/from-description', { method: 'POST', body: JSON.stringify(input) });
}

// Sessions
export async function createSession(characterId: string, language?: string) {
  return request<{ id: string }>('/sessions', { method: 'POST', body: JSON.stringify({ characterId, language }) });
}

export async function listSessions() {
  return request<{ sessions: SessionListItem[] }>('/sessions');
}

export async function getSessionMessages(sessionId: string, page = 1) {
  return request<{ messages: MessageHistoryItem[]; total: number; page: number; totalPages: number }>(`/sessions/${sessionId}/messages?page=${page}`);
}

export async function deleteSessionApi(sessionId: string) {
  return request<{ ok: boolean }>(`/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function recoverSessionApi(sessionId: string) {
  return request<{ ok: boolean }>(`/sessions/${sessionId}/recover`, { method: 'POST' });
}

export const API = { base: API_BASE };
