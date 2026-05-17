export type ModelRoute = { primary:string; fallback:string[]; temperature:number; maxTokens:number; reason:string };
export function chooseModel(input: { preference?: string; emotionalIntensity:number; contextChars:number; lastModel?: string | null }): ModelRoute {
  if (input.preference) return { primary: input.preference, fallback:['anthropic/claude-3.5-sonnet','openai/gpt-4o-mini'], temperature:.86, maxTokens:1400, reason:'explicit_preference' };
  if (input.contextChars > 34000) return { primary:'google/gemini-2.0-flash-001', fallback:['anthropic/claude-3.5-sonnet','openai/gpt-4o-mini'], temperature:.82, maxTokens:1600, reason:'large_context' };
  if (input.emotionalIntensity > 72) return { primary:'anthropic/claude-3.5-sonnet', fallback:['openai/gpt-4o','google/gemini-2.0-flash-001'], temperature:.88, maxTokens:1500, reason:'high_emotional_intensity' };
  return { primary:'openai/gpt-4o-mini', fallback:['google/gemini-2.0-flash-001','anthropic/claude-3.5-sonnet'], temperature:.84, maxTokens:1200, reason:'balanced_latency_quality' };
}
