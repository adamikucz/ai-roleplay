import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAuthUser } from "../auth/require-auth.js";
import { createSession, listSessions, deleteSession, recoverSession } from "../repositories/sessions.repo.js";
import { getCharacter } from "../repositories/characters.repo.js";
import { getSessionMessagesPage } from "../repositories/messages.repo.js";
import { DEFAULT_SCENE } from "../engines/scene.engine.js";

export async function sessionRoutes(app: FastifyInstance) {
  app.get('/sessions', async (request, reply) => {
    try { const user = getAuthUser(request); return { sessions: await listSessions(user.id) }; }
    catch { return reply.unauthorized('Unauthorized'); }
  });

  app.post('/sessions', async (request, reply) => {
    try {
      const user = getAuthUser(request);
      const body = z.object({ characterId: z.string().uuid(), title: z.string().max(120).optional(), language: z.string().max(5).optional() }).parse(request.body);
      const character = await getCharacter(body.characterId, user.id);
      if (!character) return reply.notFound('Character not found');
      return await createSession({ userId: user.id, characterId: body.characterId, title: body.title, scene: DEFAULT_SCENE, language: body.language });
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return reply.unauthorized('Unauthorized');
      throw error;
    }
  });

  app.get('/sessions/:id/messages', async (request, reply) => {
    try {
      const user = getAuthUser(request);
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const query = z.object({ page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(100).default(50) }).parse(request.query);
      return await getSessionMessagesPage(id, query.page, query.limit);
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return reply.unauthorized('Unauthorized');
      throw error;
    }
  });

  app.delete('/sessions/:id', async (request, reply) => {
    try {
      const user = getAuthUser(request);
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      await deleteSession(id, user.id);
      return { ok: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return reply.unauthorized('Unauthorized');
      throw error;
    }
  });

  app.post('/sessions/:id/recover', async (request, reply) => {
    try {
      const user = getAuthUser(request);
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      await recoverSession(id, user.id);
      return { ok: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return reply.unauthorized('Unauthorized');
      throw error;
    }
  });
}
