import { query } from "../db/pool.js";

export async function listCharacters(userId: string) {
  const result = await query(
    `select id, owner_id as "ownerId", visibility, name, tagline, avatar_url as "avatarUrl", persona, scenario, greeting,
            style_profile as "styleProfile", created_at as "createdAt"
     from characters
     where visibility='public' or owner_id=$1
     order by created_at desc
     limit 100`,
    [userId]
  );
  return result.rows;
}

export async function getCharacter(characterId: string, userId: string) {
  const result = await query<any>(
    `select id, owner_id, visibility, name, tagline, avatar_url, persona, scenario, greeting,
            style_profile, created_at
     from characters
     where id=$1 and (visibility='public' or owner_id=$2)
     limit 1`,
    [characterId, userId]
  );
  return result.rows[0] ?? null;
}

export async function createCharacter(input: {
  ownerId: string; visibility: 'private'|'public'; name: string; tagline?: string; avatarUrl?: string;
  persona: string; scenario: string; greeting: string; styleProfile: unknown;
}) {
  const result = await query<{ id: string }>(
    `insert into characters (owner_id, visibility, name, tagline, avatar_url, persona, scenario, greeting, style_profile)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    [input.ownerId, input.visibility, input.name, input.tagline ?? null, input.avatarUrl ?? null, input.persona, input.scenario, input.greeting, JSON.stringify(input.styleProfile)]
  );
  return result.rows[0]!;
}
