import type { RelationshipState } from "@aether/shared";
import { clamp } from "../utils/tokens.js";

export function evolveRelationship(input: { previous: RelationshipState; userMessage: string; assistantMessage?: string }): RelationshipState {
  const text = input.userMessage.toLowerCase();
  const d = { trust:0, attachment:0, comfort:0, vulnerability:0, jealousy:0, emotionalEnergy:-1, conversationalRhythm:1, intimacy:0, tension:0, protectiveness:0, curiosity:0 };
  if (/koch|lubię cię|tęskni|przytul|love|miss|hug|ważn|care/.test(text)) { d.trust+=3; d.attachment+=4; d.comfort+=3; d.intimacy+=2; d.tension-=2; }
  if (/nienawidzę|zamknij|głup|idiot|hate|stupid|useless|shut up/.test(text)) { d.trust-=7; d.comfort-=6; d.attachment-=2; d.tension+=10; d.emotionalEnergy-=9; }
  if (/boję|samot|smut|źle mi|nie radzę|płacz|afraid|lonely|sad|hurt|pain/.test(text)) { d.trust+=2; d.vulnerability+=6; d.comfort+=2; d.attachment+=2; d.protectiveness+=5; }
  if (/sekret|zauf|secret|trust you|private|between us/.test(text)) { d.trust+=5; d.vulnerability+=3; d.intimacy+=4; d.attachment+=2; }
  if (/ktoś inny|z inną|z innym|jealous|zazdro/.test(text)) { d.jealousy+=6; d.tension+=4; d.attachment+=1; }
  if (/dlaczego|czemu|what if|imagine|wyobraź|opowiedz/.test(text)) { d.curiosity+=3; d.conversationalRhythm+=2; }
  return {
    trust: clamp(input.previous.trust+d.trust), attachment: clamp(input.previous.attachment+d.attachment), comfort: clamp(input.previous.comfort+d.comfort),
    vulnerability: clamp(input.previous.vulnerability+d.vulnerability), jealousy: clamp(input.previous.jealousy+d.jealousy), emotionalEnergy: clamp(input.previous.emotionalEnergy+d.emotionalEnergy),
    conversationalRhythm: clamp(input.previous.conversationalRhythm+d.conversationalRhythm), intimacy: clamp(input.previous.intimacy+d.intimacy), tension: clamp(input.previous.tension+d.tension),
    protectiveness: clamp(input.previous.protectiveness+d.protectiveness), curiosity: clamp(input.previous.curiosity+d.curiosity)
  };
}

export function relationshipToPrompt(s: RelationshipState) {
  return `RELATIONSHIP ENGINE STATE\ntrust=${s.trust}, attachment=${s.attachment}, comfort=${s.comfort}, vulnerability=${s.vulnerability}, jealousy=${s.jealousy}, emotionalEnergy=${s.emotionalEnergy}, rhythm=${s.conversationalRhythm}, intimacy=${s.intimacy}, tension=${s.tension}, protectiveness=${s.protectiveness}, curiosity=${s.curiosity}\nBehavioral mapping: low trust creates guardedness; high intimacy allows softer personal language; high tension shortens phrasing and adds charged silence; high vulnerability increases honest subtext; low energy reduces initiative; high curiosity increases gentle questions and initiative.`;
}
