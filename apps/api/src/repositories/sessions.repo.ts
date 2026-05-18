import { query } from "../db/pool.js";
import type { SceneState } from "@aether/shared";

export async function createSession(input: { userId: string; characterId: string; title?: string; scene: SceneState; language?: string }) {
  const result = await query<{ id: string }>(
    `insert into sessions (user_id, character_id, title, scene_state, language) values ($1,$2,$3,$4,$5) returning id`,
    [input.userId, input.characterId, input.title ?? 'New Scene', JSON.stringify(input.scene), input.language ?? 'pl']
  );
  return result.rows[0]!;
}

export async function getSession(sessionId: string, userId: string) {
  const result = await query<any>(`select * from sessions where id=$1 and user_id=$2 limit 1`, [sessionId, userId]);
  return result.rows[0] ?? null;
}

export async function listSessions(userId: string) {
  const result = await query(
    `select s.id, s.title, s.character_id as "characterId", c.name as "characterName",
            s.scene_state as "sceneState", s.language, s.archived, s.updated_at as "updatedAt"
     from sessions s join characters c on c.id=s.character_id
     where s.user_id=$1 order by s.updated_at desc limit 80`, [userId]
  );
  return result.rows;
}

export async function updateSessionScene(input: { sessionId: string; userId: string; scene: SceneState; model?: string }) {
  await query(
    `update sessions set scene_state=$3, last_model=coalesce($4,last_model), updated_at=now() where id=$1 and user_id=$2`,
    [input.sessionId, input.userId, JSON.stringify(input.scene), input.model ?? null]
  );
}

export async function deleteSession(sessionId: string, userId: string) {
  await query(`delete from sessions where id=$1 and user_id=$2`, [sessionId, userId]);
}

export async function archiveSession(sessionId: string, userId: string) {
  await query(`update sessions set archived=true, updated_at=now() where id=$1 and user_id=$2`, [sessionId, userId]);
}

export async function recoverSession(sessionId: string, userId: string) {
  await query(`update sessions set archived=false, updated_at=now() where id=$1 and user_id=$2`, [sessionId, userId]);
}
