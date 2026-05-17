import { query } from "../db/pool.js";
import type { MemoryType } from "@aether/shared";

export async function createMemory(input: { userId:string; characterId:string; sessionId?:string; type:MemoryType; content:string; importance:number; emotionalValence?:number; decayAfter?: Date }) {
  const result = await query<{ id:string }>(
    `insert into memories (user_id, character_id, session_id, type, content, importance, emotional_valence, decay_after)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [input.userId, input.characterId, input.sessionId ?? null, input.type, input.content, input.importance, input.emotionalValence ?? 0, input.decayAfter ?? null]
  );
  return result.rows[0]!;
}

export async function getRelevantMemories(input: { userId:string; characterId:string; sessionId:string; limit?:number }) {
  const result = await query<{ id:string; type:MemoryType; content:string; importance:number; emotional_valence:number }>(
    `select id,type,content,importance,emotional_valence from memories
     where user_id=$1 and character_id=$2 and (session_id=$3 or session_id is null)
       and (decay_after is null or decay_after > now())
     order by importance desc, last_accessed_at desc, created_at desc limit $4`,
    [input.userId, input.characterId, input.sessionId, input.limit ?? 28]
  );
  if (result.rows.length) await query(`update memories set last_accessed_at=now() where id = any($1::uuid[])`, [result.rows.map(r=>r.id)]);
  return result.rows;
}

export async function countShortTerm(input: { userId:string; characterId:string; sessionId:string }) {
  const r = await query<{ count:string }>(`select count(*)::text from memories where user_id=$1 and character_id=$2 and session_id=$3 and type='short_term'`, [input.userId,input.characterId,input.sessionId]);
  return Number(r.rows[0]?.count ?? 0);
}

export async function pruneShortTerm(input: { userId:string; characterId:string; sessionId:string; keep:number }) {
  await query(
    `delete from memories where id in (
      select id from memories where user_id=$1 and character_id=$2 and session_id=$3 and type='short_term'
      order by importance desc, created_at desc offset $4
    )`, [input.userId,input.characterId,input.sessionId,input.keep]
  );
}

export async function getCompressionCandidates(input: { userId:string; characterId:string; sessionId:string; limit:number }) {
  const result = await query<{ id:string; content:string; importance:number; emotional_valence:number }>(
    `select id, content, importance, emotional_valence from memories
     where user_id=$1 and character_id=$2 and session_id=$3 and type='short_term'
     order by created_at asc limit $4`, [input.userId,input.characterId,input.sessionId,input.limit]
  );
  return result.rows;
}

export async function createMemoryCluster(input: { userId:string; characterId:string; sessionId:string; clusterType:string; summary:string; sourceIds:string[]; importance:number }) {
  await query(
    `insert into memory_clusters (user_id, character_id, session_id, cluster_type, summary, source_memory_ids, importance)
     values ($1,$2,$3,$4,$5,$6,$7)`, [input.userId,input.characterId,input.sessionId,input.clusterType,input.summary,input.sourceIds,input.importance]
  );
}

export async function getMemoryClusters(input: { userId:string; characterId:string; sessionId:string; limit:number }) {
  const result = await query<{ cluster_type:string; summary:string; importance:number }>(
    `select cluster_type, summary, importance from memory_clusters where user_id=$1 and character_id=$2 and session_id=$3 order by importance desc, updated_at desc limit $4`,
    [input.userId,input.characterId,input.sessionId,input.limit]
  );
  return result.rows;
}
