import type { SceneState } from "@aether/shared";
import { compact } from "../utils/tokens.js";

export const DEFAULT_SCENE: SceneState = {
  location: "a quiet rain-lit apartment",
  timeOfDay: "late evening",
  mood: "intimate, uncertain, cinematic",
  weather: "soft rain",
  visualAtmosphere: "blue-gray window light, warm lamp glow, slow shadows",
  activeConflict: null,
  recentBeat: null,
  continuityAnchor: "Evelyn is seated near the window when the conversation begins."
};

export function evolveScene(input: { previous: SceneState; userMessage: string; assistantMessage: string }): SceneState {
  const text = `${input.userMessage}\n${input.assistantMessage}`.toLowerCase();
  let next = { ...input.previous };
  if (/wyjdź|chodźmy|spacer|outside|street|las|miasto/.test(text)) {
    next.location = "outside beneath the wet night air";
    next.visualAtmosphere = "wet pavement, distant lamps, reflected neon, cold air";
    next.weather = "thin rain";
  }
  if (/kłótn|krzyk|angry|złość|nienawidzę|hate/.test(text)) {
    next.mood = "tense, fragile, emotionally charged";
    next.activeConflict = "unresolved emotional friction";
    next.visualAtmosphere = "sharper shadows, colder silence, compressed distance";
  }
  if (/przytul|bezpiecz|spokój|comfort|safe|ciepło/.test(text)) {
    next.mood = "warm, quiet, emotionally safer";
    next.activeConflict = next.activeConflict ? "the conflict softens but still lingers" : null;
    next.visualAtmosphere = "warmer lamplight, softer breathing, rain fading behind them";
  }
  next.recentBeat = `User: ${compact(input.userMessage, 150)} | Character: ${compact(input.assistantMessage, 180)}`;
  next.continuityAnchor = `${next.location}; ${next.mood}; ${next.recentBeat}`;
  return next;
}

export function sceneToPrompt(scene: SceneState) {
  return `ACTIVE SCENE\nlocation: ${scene.location}\ntime: ${scene.timeOfDay}\nweather: ${scene.weather}\nmood: ${scene.mood}\natmosphere: ${scene.visualAtmosphere}\nactive conflict: ${scene.activeConflict ?? "none"}\nrecent beat: ${scene.recentBeat ?? "opening beat"}\ncontinuity anchor: ${scene.continuityAnchor}\nMaintain physical continuity and emotional momentum.`;
}
