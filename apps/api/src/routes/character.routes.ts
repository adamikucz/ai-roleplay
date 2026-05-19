import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { StyleProfileSchema, CreateCharacterFromDescriptionSchema } from "@aether/shared";
import { getAuthUser } from "../auth/require-auth.js";
import { createCharacter, listCharacters } from "../repositories/characters.repo.js";
import { generateCharacterFromDescription } from "../ai/character-generator.js";

const CreateCharacterSchema = z.object({
  visibility: z.enum(['private','public']).default('private'),
  name: z.string().min(1).max(80),
  tagline: z.string().max(160).optional(),
  avatarUrl: z.string().url().optional(),
  persona: z.string().min(20).max(16000),
  scenario: z.string().min(10).max(12000),
  greeting: z.string().min(1).max(4000),
  styleProfile: StyleProfileSchema
});

export async function characterRoutes(app: FastifyInstance) {
  app.get('/characters', async (request, reply) => {
    try { const user = getAuthUser(request); return { characters: await listCharacters(user.id) }; }
    catch { return reply.unauthorized('Unauthorized'); }
  });

  app.post('/characters', async (request, reply) => {
    try {
      const user = getAuthUser(request);
      const body = CreateCharacterSchema.parse(request.body);
      return await createCharacter({ ownerId: user.id, ...body });
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return reply.unauthorized('Unauthorized');
      throw error;
    }
  });

  app.post('/characters/from-description', async (request, reply) => {
    try {
      const user = getAuthUser(request);
      const body = CreateCharacterFromDescriptionSchema.parse(request.body);

      const generated = await generateCharacterFromDescription({
        name: body.name,
        description: body.description,
        language: body.language
      });

      const character = await createCharacter({
        ownerId: user.id,
        visibility: body.visibility,
        name: body.name,
        tagline: generated.tagline,
        avatarUrl: body.avatarUrl,
        description: body.description,
        persona: generated.persona,
        scenario: generated.scenario,
        greeting: generated.greeting,
        styleProfile: generated.styleProfile
      });

      return {
        id: character.id,
        name: body.name,
        tagline: generated.tagline,
        greeting: generated.greeting,
        persona: generated.persona,
        scenario: generated.scenario,
        styleProfile: generated.styleProfile
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return reply.unauthorized('Unauthorized');
      if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate-limited'))) {
        return reply.status(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Wszystkie darmowe modele OpenRouter są obecnie przeciążone (Rate Limit). Spróbuj ponownie za 10-15 sekund.'
        });
      }
      throw error;
    }
  });
}
