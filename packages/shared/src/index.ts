import { z } from "zod";

export const IdSchema = z.string().uuid();

export const RelationshipStateSchema = z.object({
  trust: z.number().min(0).max(100),
  attachment: z.number().min(0).max(100),
  comfort: z.number().min(0).max(100),
  vulnerability: z.number().min(0).max(100),
  jealousy: z.number().min(0).max(100),
  emotionalEnergy: z.number().min(0).max(100),
  conversationalRhythm: z.number().min(0).max(100),
  intimacy: z.number().min(0).max(100),
  tension: z.number().min(0).max(100),
  protectiveness: z.number().min(0).max(100),
  curiosity: z.number().min(0).max(100)
});
export type RelationshipState = z.infer<typeof RelationshipStateSchema>;

export const SceneStateSchema = z.object({
  location: z.string(),
  timeOfDay: z.string(),
  mood: z.string(),
  weather: z.string(),
  visualAtmosphere: z.string(),
  activeConflict: z.string().nullable(),
  recentBeat: z.string().nullable(),
  continuityAnchor: z.string()
});
export type SceneState = z.infer<typeof SceneStateSchema>;

export const MemoryTypeSchema = z.enum(["short_term", "long_term", "emotional", "narrative", "relationship", "style"]);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const ChatRoleSchema = z.enum(["system", "user", "assistant"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const SUPPORTED_LANGUAGES = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
] as const;
export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const StyleProfileSchema = z.object({
  proseDensity: z.number().min(0).max(100),
  initiative: z.number().min(0).max(100),
  emotionalExpressiveness: z.number().min(0).max(100),
  messageLength: z.enum(["short", "medium", "long", "adaptive"]),
  narrationStyle: z.enum(["cinematic", "novelistic", "casual", "texting", "dramatic"]),
  perspective: z.enum(["first_person", "second_person", "third_person_limited"])
});
export type StyleProfile = z.infer<typeof StyleProfileSchema>;

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid().nullable(),
  visibility: z.enum(["private", "public"]),
  name: z.string(),
  tagline: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  description: z.string().nullable(),
  persona: z.string(),
  scenario: z.string(),
  greeting: z.string(),
  styleProfile: StyleProfileSchema,
  createdAt: z.string()
});
export type Character = z.infer<typeof CharacterSchema>;

export const ClientMessageSchema = z.object({
  sessionId: z.string().uuid(),
  characterId: z.string().uuid(),
  content: z.string().min(1).max(16000),
  modelPreference: z.string().optional(),
  language: z.string().min(2).max(5).optional()
});
export type ClientMessageInput = z.infer<typeof ClientMessageSchema>;

export const CreateCharacterFromDescriptionSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(10).max(8000),
  visibility: z.enum(['private', 'public']).default('private'),
  avatarUrl: z.string().url().optional(),
  language: z.string().min(2).max(5).default('pl')
});
export type CreateCharacterFromDescriptionInput = z.infer<typeof CreateCharacterFromDescriptionSchema>;

export type StreamEvent =
  | { type: "token"; token: string }
  | { type: "status"; stage: "thinking" | "memory" | "relationship" | "generating" | "saving" }
  | { type: "meta"; relationship: RelationshipState; scene: SceneState; model: string; quality: number }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string };

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(80)
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
});
export type LoginInput = z.infer<typeof LoginSchema>;

export type SessionListItem = {
  id: string;
  title: string;
  characterId: string;
  characterName: string;
  sceneState: SceneState;
  language: string;
  archived: boolean;
  updatedAt: string;
};

export type MessageHistoryItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};
