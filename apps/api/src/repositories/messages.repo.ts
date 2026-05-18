import { query } from "../db/pool.js";
import { estimateTokens } from "../utils/tokens.js";

export async function createMessage(input: {
  sessionId: string; role: 'system'|'user'|'assistant'; content: string; model?: string; qualityScore?: number; emotionalTags?: string[];
}) {
  const result = await query<{ id: string }>(
    `insert into messages (session_id, role, content, model, quality_score, token_count, emotional_tags)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [input.sessionId, input.role, input.content, input.model ?? null, input.qualityScore ?? 0, estimateTokens(input.content), input.emotionalTags ?? []]
  );
  return result.rows[0]!;
}

export async function getRecentMessages(sessionId: string, limit = 42) {
  const result = await query<{ id:string; role:'system'|'user'|'assistant'; content:string; created_at:string }>(
    `select id, role, content, created_at from messages where session_id=$1 order by created_at desc limit $2`,
    [sessionId, limit]
  );
  return result.rows.reverse();
}

export async function getSessionTranscript(sessionId: string, limit = 120) {
  const result = await query<{ role:string; content:string }>(
    `select role, content from messages where session_id=$1 order by created_at desc limit $2`, [sessionId, limit]
  );
  return result.rows.reverse();
}

export async function getSessionMessagesPage(sessionId: string, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const [countResult, result] = await Promise.all([
    query<{ total: string }>(`select count(*)::text as total from messages where session_id=$1 and role != 'system'`, [sessionId]),
    query<{ id:string; role:'user'|'assistant'; content:string; createdAt:string }>(
      `select id, role, content, created_at as "createdAt" from messages where session_id=$1 and role != 'system' order by created_at asc limit $2 offset $3`,
      [sessionId, limit, offset]
    )
  ]);
  const total = Number(countResult.rows[0]?.total ?? 0);
  return { messages: result.rows, total, page, totalPages: Math.ceil(total / limit) };
}
