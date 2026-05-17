import { query } from "../db/pool.js";
import { compressShortTermMemories } from "../engines/memory.engine.js";

export function startMemoryMaintenanceJob() {
  const run = async () => {
    const result = await query<{ user_id:string; character_id:string; session_id:string }>(
      `select user_id, character_id, session_id
       from memories
       where type='short_term' and session_id is not null
       group by user_id, character_id, session_id
       having count(*) > 70
       limit 25`
    );
    await Promise.allSettled(result.rows.map(row => compressShortTermMemories({ userId: row.user_id, characterId: row.character_id, sessionId: row.session_id, targetKeep: 44 })));
  };
  const timer = setInterval(() => { run().catch(() => undefined); }, 1000 * 60 * 15);
  timer.unref();
  run().catch(() => undefined);
}
