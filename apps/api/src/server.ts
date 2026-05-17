import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { characterRoutes } from "./routes/character.routes.js";
import { sessionRoutes } from "./routes/session.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { startMemoryMaintenanceJob } from "./jobs/memory-maintenance.job.js";

const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 * 5 });

app.get("/", async () => {
  return {
    ok: true,
    service: "aether-api",
    status: "running"
  };
});

app.get("/healthz", async () => {
  return {
    ok: true,
    service: "aether-api",
    uptime: process.uptime()
  };
});

await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
await app.register(sensible);
await app.register(rateLimit, { max: 240, timeWindow: '1 minute' });
await app.register(websocket, { options: { maxPayload: 1024 * 1024 * 2 } });

await app.register(authRoutes, { prefix: '/v1' });
await app.register(characterRoutes, { prefix: '/v1' });
await app.register(sessionRoutes, { prefix: '/v1' });
await app.register(chatRoutes, { prefix: '/v1' });

app.get('/health', async () => ({ ok: true, service: 'aether-api' }));

startMemoryMaintenanceJob();

await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
