import type { StreamEvent } from "@aether/shared";
import { API, tokenStore } from "./api";

export async function streamChat(input: { sessionId:string; characterId:string; content:string; onEvent:(event:StreamEvent)=>void }) {
  const token = tokenStore.get(); if (!token) throw new Error('Missing auth token');
  const res = await fetch(`${API.base}/chat/stream`, { method:'POST', headers: { 'Content-Type':'application/json', Accept:'text/event-stream', Authorization:`Bearer ${token}` }, body: JSON.stringify({ sessionId: input.sessionId, characterId: input.characterId, content: input.content }) });
  if (!res.ok || !res.body) throw new Error('Stream failed');
  const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer='';
  while (true) {
    const {value, done} = await reader.read(); if (done) break;
    buffer += decoder.decode(value, {stream:true});
    const chunks = buffer.split('\n\n'); buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      const line = chunk.split('\n').find(l=>l.startsWith('data:')); if (!line) continue;
      try { input.onEvent(JSON.parse(line.replace(/^data:\s*/, ''))); } catch {}
    }
  }
}
