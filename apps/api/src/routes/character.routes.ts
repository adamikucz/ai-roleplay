import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { StyleProfileSchema } from "@aether/shared";
import { getAuthUser } from "../auth/require-auth.js";
import { createCharacter, listCharacters } from "../repositories/characters.repo.js";

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
}
