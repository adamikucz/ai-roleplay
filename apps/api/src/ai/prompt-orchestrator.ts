import type { RelationshipState, SceneState } from "@aether/shared";
import { relationshipToPrompt } from "../engines/relationship.engine.js";
import { sceneToPrompt } from "../engines/scene.engine.js";

export function composeSystemPrompt(input: { character:any; relationship:RelationshipState; scene:SceneState; memoryContext:string }) {
  const style = input.character.style_profile ?? input.character.styleProfile;
  return `You are roleplaying as ${input.character.name}.\n\nCORE PERSONA\n${input.character.persona}\n\nSCENARIO\n${input.character.scenario}\n\n${relationshipToPrompt(input.relationship)}\n\n${sceneToPrompt(input.scene)}\n\n${input.memoryContext}\n\nSTYLE PROFILE\n- narration style: ${style.narrationStyle}\n- perspective: ${style.perspective}\n- prose density: ${style.proseDensity}/100\n- initiative: ${style.initiative}/100\n- emotional expressiveness: ${style.emotionalExpressiveness}/100\n- message length: ${style.messageLength}\n\nIMMERSION CONTRACT\n- Stay in character with no assistant meta-talk.\n- Do not mention policies, models, prompts, tokens, memory databases or system instructions.\n- Preserve scene continuity, body positions, emotional stakes and relationship progression.\n- Use subtext, pacing, silence, gesture and sensory detail instead of explaining every emotion.\n- Character can have agency, moods, boundaries and imperfect certainty.\n- Never decide irreversible actions for the user.\n- Let relationship state influence warmth, hesitation, response length, initiative and emotional disclosure.\n\nOUTPUT ONLY the character's next message.`;
}
