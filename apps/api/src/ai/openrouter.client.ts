import { env } from "../env.js";

type Message = { role:'system'|'user'|'assistant'; content:string };

export async function streamOpenRouter(input: { model:string; messages:Message[]; temperature:number; maxTokens:number; signal?:AbortSignal; onToken:(token:string)=>void }) {
  const started = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST', signal: input.signal,
    headers: { Authorization:`Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type':'application/json', 'HTTP-Referer':env.OPENROUTER_SITE_URL, 'X-Title':env.OPENROUTER_APP_NAME },
    body: JSON.stringify({ model:input.model, messages:input.messages, stream:true, temperature:input.temperature, max_tokens:input.maxTokens })
  });
  if (!res.ok || !res.body) throw new Error(`OpenRouter ${res.status}: ${await res.text().catch(()=> '')}`);
  const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf=''; let full='';
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    buf += decoder.decode(value, {stream:true});
    const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim(); if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.replace(/^data:\s*/, ''); if (payload === '[DONE]') return { text: full, latencyMs: Date.now()-started };
      try { const json = JSON.parse(payload); const token = json.choices?.[0]?.delta?.content ?? ''; if (token) { full += token; input.onToken(token); } } catch {}
    }
  }
  return { text: full, latencyMs: Date.now()-started };
}
