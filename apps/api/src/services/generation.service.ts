import { ClientMessageSchema, type StreamEvent } from "@aether/shared";
import { getCharacter } from "../repositories/characters.repo.js";
import { getSession, updateSessionScene } from "../repositories/sessions.repo.js";
import { createMessage } from "../repositories/messages.repo.js";
import { getRelationshipState, upsertRelationshipState } from "../repositories/relationship.repo.js";
import { evolveRelationship } from "../engines/relationship.engine.js";
import { retrieveMemoryContext, writeTurnMemories } from "../engines/memory.engine.js";
import { reconstructContext } from "../engines/context.engine.js";
import { composeSystemPrompt } from "../ai/prompt-orchestrator.js";
import { chooseModel } from "../ai/model-router.js";
import { streamOpenRouter } from "../ai/openrouter.client.js";
import { scoreResponse } from "../ai/response-quality.js";
import { evolveScene } from "../engines/scene.engine.js";
import { query } from "../db/pool.js";
import { sha256 } from "../utils/hash.js";

export async function generateTurn(input: { userId:string; payload:unknown; signal?:AbortSignal; emit:(event:StreamEvent)=>void }) {
  const body = ClientMessageSchema.parse(input.payload);
  input.emit({ type:'status', stage:'memory' });
  const [character, session] = await Promise.all([getCharacter(body.characterId, input.userId), getSession(body.sessionId, input.userId)]);
  if (!character) throw new Error('Character not found');
  if (!session) throw new Error('Session not found');
  await createMessage({ sessionId: body.sessionId, role:'user', content: body.content });
  input.emit({ type:'status', stage:'relationship' });
  const previous = await getRelationshipState(input.userId, body.characterId);
  const relationship = evolveRelationship({ previous, userMessage: body.content });
  await upsertRelationshipState(input.userId, body.characterId, relationship);
  const [memoryContext, contextMessages] = await Promise.all([
    retrieveMemoryContext({ userId: input.userId, characterId: body.characterId, sessionId: body.sessionId }),
    reconstructContext(body.sessionId)
  ]);
  const system = composeSystemPrompt({ character, relationship, scene: session.scene_state, memoryContext });
  const emotionalIntensity = relationship.tension*.32 + relationship.intimacy*.23 + relationship.vulnerability*.23 + relationship.attachment*.12 + relationship.jealousy*.10;
  const route = chooseModel({ preference: body.modelPreference, emotionalIntensity, contextChars: JSON.stringify(contextMessages).length, lastModel: session.last_model });
  const messages = [{ role:'system' as const, content: system }, ...contextMessages];
  input.emit({ type:'status', stage:'generating' });
  let generated = ''; let latencyMs = 0; let usedModel = route.primary; let lastError: unknown;
  for (const model of [route.primary, ...route.fallback]) {
    try {
      usedModel = model;
      const result = await streamOpenRouter({ model, messages, temperature: route.temperature, maxTokens: route.maxTokens, signal: input.signal, onToken: token => input.emit({ type:'token', token }) });
      generated = result.text; latencyMs = result.latencyMs; break;
    } catch (e) { lastError = e; }
  }
  if (!generated.trim()) throw lastError instanceof Error ? lastError : new Error('Generation failed');
  const quality = scoreResponse({ response: generated, relationship, userMessage: body.content });
  input.emit({ type:'status', stage:'saving' });
  const message = await createMessage({ sessionId: body.sessionId, role:'assistant', content: generated, model: usedModel, qualityScore: quality });
  const scene = evolveScene({ previous: session.scene_state, userMessage: body.content, assistantMessage: generated });
  await Promise.all([
    updateSessionScene({ sessionId: body.sessionId, userId: input.userId, scene, model: usedModel }),
    writeTurnMemories({ userId: input.userId, characterId: body.characterId, sessionId: body.sessionId, userMessage: body.content, assistantMessage: generated }),
    query(`insert into generation_audits (session_id, model, prompt_hash, latency_ms, quality_score) values ($1,$2,$3,$4,$5)`, [body.sessionId, usedModel, sha256(system), latencyMs, quality])
  ]);
  input.emit({ type:'meta', relationship, scene, model: usedModel, quality });
  input.emit({ type:'done', messageId: message.id });
}
