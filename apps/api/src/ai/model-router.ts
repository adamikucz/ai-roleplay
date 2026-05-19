export type ModelRoute = { primary:string; fallback:string[]; temperature:number; maxTokens:number; reason:string };
export function chooseModel(input: { preference?: string; emotionalIntensity:number; contextChars:number; lastModel?: string | null }): ModelRoute {
  const primary = input.preference || 'meta-llama/llama-3.3-70b-instruct:free';
  return { primary, fallback:['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-3-80b-instruct:free'], temperature:.85, maxTokens:1500, reason:'user_preference' };
}
