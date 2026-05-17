import type { FastifyInstance } from "fastify";
import { prepareSse, sendEvent } from "../ai/sse.js";
import { getAuthUser, } from "../auth/require-auth.js";
import { verifyAuthToken } from "../auth/jwt.js";
import { generateTurn } from "../services/generation.service.js";

export async function chatRoutes(app: FastifyInstance) {
  app.post('/chat/stream', async (request, reply) => {
    prepareSse(reply);
    try {
      const user = getAuthUser(request);
      await generateTurn({ userId: user.id, payload: request.body, emit: event => sendEvent(reply, event) });
    } catch (error) {
      sendEvent(reply, { type:'error', message: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      reply.raw.end();
    }
  });

  app.get('/chat/ws', { websocket: true }, (socket, request) => {
    socket.on('message', async raw => {
      const controller = new AbortController();
      try {
        const parsed = JSON.parse(raw.toString());
        const token = String(parsed.token ?? '');
        const user = verifyAuthToken(token);
        await generateTurn({ userId: user.id, payload: parsed.payload, signal: controller.signal, emit: event => socket.send(JSON.stringify(event)) });
      } catch (error) {
        socket.send(JSON.stringify({ type:'error', message: error instanceof Error ? error.message : 'Unknown websocket error' }));
      }
    });
    socket.on('close', () => {});
  });
}
