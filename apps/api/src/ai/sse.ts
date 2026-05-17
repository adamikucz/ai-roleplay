import type { FastifyReply, FastifyRequest } from "fastify";
import type { StreamEvent } from "@aether/shared";
import { env } from "../env.js";

export function prepareSse(reply: FastifyReply, request: FastifyRequest) {
  const origin = request.headers.origin;

  reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("X-Accel-Buffering", "no");

  // CORS dla ręcznie streamowanej odpowiedzi SSE
  reply.raw.setHeader("Access-Control-Allow-Origin", origin || env.WEB_ORIGIN);
  reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
  reply.raw.setHeader("Vary", "Origin");

  reply.raw.writeHead(200);
}

export function sendEvent(reply: FastifyReply, event: StreamEvent) {
  reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
}