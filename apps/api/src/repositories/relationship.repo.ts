import { query } from "../db/pool.js";
import type { RelationshipState } from "@aether/shared";

export const DEFAULT_RELATIONSHIP: RelationshipState = {
  trust: 36, attachment: 28, comfort: 34, vulnerability: 16, jealousy: 4,
  emotionalEnergy: 70, conversationalRhythm: 52, intimacy: 12, tension: 18,
  protectiveness: 20, curiosity: 62
};

export async function getRelationshipState(userId: string, characterId: string): Promise<RelationshipState> {
  const result = await query<{ state: RelationshipState }>(`select state from relationship_states where user_id=$1 and character_id=$2 limit 1`, [userId, characterId]);
  if (result.rows[0]?.state) return result.rows[0].state;
  await upsertRelationshipState(userId, characterId, DEFAULT_RELATIONSHIP);
  return DEFAULT_RELATIONSHIP;
}

export async function upsertRelationshipState(userId: string, characterId: string, state: RelationshipState) {
  await query(
    `insert into relationship_states (user_id, character_id, state) values ($1,$2,$3)
     on conflict (user_id, character_id) do update set state=excluded.state, updated_at=now()`,
    [userId, characterId, JSON.stringify(state)]
  );
}
