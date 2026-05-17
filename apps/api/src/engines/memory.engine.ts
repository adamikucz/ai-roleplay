import { createMemory, getMemoryClusters, getRelevantMemories, countShortTerm, pruneShortTerm, getCompressionCandidates, createMemoryCluster } from "../repositories/memories.repo.js";
import { compact } from "../utils/tokens.js";

export async function retrieveMemoryContext(input: { userId:string; characterId:string; sessionId:string }) {
  const [memories, clusters] = await Promise.all([
    getRelevantMemories({ ...input, limit: 30 }),
    getMemoryClusters({ ...input, limit: 8 })
  ]);
  const by = (type: string) => memories.filter(m=>m.type===type).map(m=>`- ${m.content}`).join("\n") || "- none";
  return `MEMORY CONTEXT\n\nCOMPRESSED CONTINUITY:\n${clusters.map(c=>`- [${c.cluster_type}] ${c.summary}`).join("\n") || "- none"}\n\nSHORT TERM:\n${by('short_term')}\n\nLONG TERM:\n${by('long_term')}\n\nEMOTIONAL MEMORY:\n${by('emotional')}\n\nNARRATIVE MEMORY:\n${by('narrative')}\n\nRELATIONSHIP MEMORY:\n${by('relationship')}\n\nSTYLE MEMORY:\n${by('style')}`;
}

export async function writeTurnMemories(input: { userId:string; characterId:string; sessionId:string; userMessage:string; assistantMessage:string }) {
  const importance = scoreImportance(input.userMessage, input.assistantMessage);
  const emotionalValence = scoreValence(input.userMessage, input.assistantMessage);
  await createMemory({ ...input, type:'short_term', content:`Recent exchange: user said "${compact(input.userMessage)}"; character replied "${compact(input.assistantMessage)}".`, importance, emotionalValence, decayAfter: new Date(Date.now()+1000*60*60*24*14) });
  if (importance >= 68) await createMemory({ ...input, type:'emotional', content:`Emotionally charged moment: ${compact(input.userMessage, 260)} / ${compact(input.assistantMessage, 260)}`, importance, emotionalValence });
  if (importance >= 78) await createMemory({ ...input, type:'relationship', content:`Relationship-shaping exchange: ${compact(input.userMessage, 300)} -> ${compact(input.assistantMessage, 300)}`, importance, emotionalValence });
  if (importance >= 84) await createMemory({ ...input, type:'long_term', content:`Persistent fact or promise: ${compact(input.userMessage, 340)}`, importance, emotionalValence });
  const count = await countShortTerm(input);
  if (count > 70) await compressShortTermMemories({ ...input, targetKeep: 44 });
}

export async function compressShortTermMemories(input: { userId:string; characterId:string; sessionId:string; targetKeep:number }) {
  const candidates = await getCompressionCandidates({ ...input, limit: 40 });
  if (candidates.length < 12) return;
  const summary = candidates.map((m,i)=>`${i+1}. ${m.content}`).join("\n");
  const avg = Math.round(candidates.reduce((a,b)=>a+b.importance,0)/candidates.length);
  await createMemoryCluster({ ...input, clusterType:'rolling_scene_continuity', summary: compact(`Compressed continuity from recent exchanges: ${summary}`, 1800), sourceIds: candidates.map(c=>c.id), importance: Math.max(55, avg) });
  await pruneShortTerm({ ...input, keep: input.targetKeep });
}

function scoreImportance(user: string, assistant: string) {
  const t = `${user}\n${assistant}`.toLowerCase(); let s = 42;
  if (/koch|love|nienawidzę|hate|sekret|secret|pamiętaj|remember|obiec|promise/.test(t)) s+=25;
  if (/boję|samot|smut|trauma|zauf|trust|hurt|tęskni|miss/.test(t)) s+=18;
  if (/zawsze|never|forever|umowa|granica|boundary/.test(t)) s+=12;
  if (t.length > 1000) s+=8;
  return Math.max(0, Math.min(100, s));
}
function scoreValence(user: string, assistant: string) {
  const t = `${user}\n${assistant}`.toLowerCase(); let s=0;
  if (/love|koch|safe|bezpiecz|happy|szczęśliw|przytul|comfort/.test(t)) s+=35;
  if (/hate|nienawidzę|angry|złość|sad|smut|hurt|ból|pain/.test(t)) s-=35;
  return Math.max(-100, Math.min(100, s));
}
