import type { LoginInput, RegisterInput } from "@aether/shared";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
export const tokenStore = { get: () => typeof window === 'undefined' ? null : localStorage.getItem('aether_token'), set: (t:string) => localStorage.setItem('aether_token', t), clear: () => localStorage.removeItem('aether_token') };
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(await res.text().catch(()=>`HTTP ${res.status}`));
  return res.json() as Promise<T>;
}
export async function login(input: LoginInput) { const out = await request<any>('/auth/login', { method:'POST', body:JSON.stringify(input) }); tokenStore.set(out.token); return out; }
export async function register(input: RegisterInput) { const out = await request<any>('/auth/register', { method:'POST', body:JSON.stringify(input) }); tokenStore.set(out.token); return out; }
export async function me() { return request<any>('/auth/me'); }
export async function characters() { return request<any>('/characters'); }
export async function createSession(characterId: string) { return request<{id:string}>('/sessions', { method:'POST', body:JSON.stringify({ characterId }) }); }
export const API = { base: API_BASE };
