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
  const language = body.language ?? 'pl';

  input.emit({ type:'status', stage:'memory' });
  const [character, session] = await Promise.all([getCharacter(body.characterId, input.userId), getSession(body.sessionId, input.userId)]);
  if (!character) throw new Error('Character not found');
  if (!session) throw new Error('Session not found');

  await createMessage({ sessionId: body.sessionId, role:'user', content: body.content });

  input.emit({ type:'status', stage:'relationship' });
  const previousRelationship = await getRelationshipState(input.userId, body.characterId);
  
  const [memoryContext, contextMessages] = await Promise.all([
    retrieveMemoryContext({ userId: input.userId, characterId: body.characterId, sessionId: body.sessionId }),
    reconstructContext(body.sessionId)
  ]);

  const system = composeSystemPrompt({ character, relationship: previousRelationship, scene: session.scene_state, memoryContext, language });
  const emotionalIntensity = previousRelationship.tension*.32 + previousRelationship.intimacy*.23 + previousRelationship.vulnerability*.23 + previousRelationship.attachment*.12 + previousRelationship.jealousy*.10;
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

  input.emit({ type:'status', stage:'saving' });

  // Extract <relationship_update> XML tags
  let newRelationship = { ...previousRelationship };
  const updateMatch = generated.match(/<relationship_update>([\s\S]*?)<\/relationship_update>/);
  if (updateMatch) {
    const changes = updateMatch[1];
    const parseDelta = (key: string) => {
      const match = changes.match(new RegExp(`<${key}>([+-]?\\d+)<\/${key}>`));
      return match ? parseInt(match[1], 10) : 0;
    };
    
    // clamp function locally since we removed evolveRelationship
    const clamp = (v: number) => Math.max(0, Math.min(100, v));

    newRelationship = {
      trust: clamp(previousRelationship.trust + parseDelta('trust')),
      attachment: clamp(previousRelationship.attachment + parseDelta('attachment')),
      comfort: clamp(previousRelationship.comfort + parseDelta('comfort')),
      vulnerability: clamp(previousRelationship.vulnerability + parseDelta('vulnerability')),
      jealousy: clamp(previousRelationship.jealousy + parseDelta('jealousy')),
      emotionalEnergy: clamp(previousRelationship.emotionalEnergy + parseDelta('emotionalEnergy')),
      conversationalRhythm: clamp(previousRelationship.conversationalRhythm + parseDelta('conversationalRhythm')),
      intimacy: clamp(previousRelationship.intimacy + parseDelta('intimacy')),
      tension: clamp(previousRelationship.tension + parseDelta('tension')),
      protectiveness: clamp(previousRelationship.protectiveness + parseDelta('protectiveness')),
      curiosity: clamp(previousRelationship.curiosity + parseDelta('curiosity'))
    };
  }

  await upsertRelationshipState(input.userId, body.characterId, newRelationship);

  // Clean the generated text for saving (remove hidden tags)
  const cleanGenerated = generated
    .replace(/<inner_monologue>[\s\S]*?<\/inner_monologue>/g, '')
    .replace(/<relationship_update>[\s\S]*?<\/relationship_update>/g, '')
    .trim();

  const quality = scoreResponse({ response: cleanGenerated, relationship: newRelationship, userMessage: body.content });
  
  const message = await createMessage({ sessionId: body.sessionId, role:'assistant', content: cleanGenerated, model: usedModel, qualityScore: quality });
  const scene = evolveScene({ previous: session.scene_state, userMessage: body.content, assistantMessage: cleanGenerated });

  await Promise.all([
    updateSessionScene({ sessionId: body.sessionId, userId: input.userId, scene, model: usedModel }),
    writeTurnMemories({ userId: input.userId, characterId: body.characterId, sessionId: body.sessionId, userMessage: body.content, assistantMessage: cleanGenerated }),
    query(`insert into generation_audits (session_id, model, prompt_hash, latency_ms, quality_score) values ($1,$2,$3,$4,$5)`, [body.sessionId, usedModel, sha256(system), latencyMs, quality])
  ]);

  input.emit({ type:'meta', relationship: newRelationship, scene, model: usedModel, quality });
  input.emit({ type:'done', messageId: message.id });
}
