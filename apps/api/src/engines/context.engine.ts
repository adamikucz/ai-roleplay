import { getRecentMessages } from "../repositories/messages.repo.js";
import { estimateTokens } from "../utils/tokens.js";

export async function reconstructContext(sessionId: string, tokenBudget = 7600) {
  const messages = await getRecentMessages(sessionId, 56);
  const selected: { role:'system'|'user'|'assistant'; content:string }[] = [];
  let used = 0;
  for (const m of [...messages].reverse()) {
    const cost = estimateTokens(m.content);
    if (used + cost > tokenBudget) break;
    selected.unshift({ role: m.role, content: m.content });
    used += cost;
  }
  return selected;
}
