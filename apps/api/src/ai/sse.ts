import type { FastifyReply, FastifyRequest } from "fastify";
import type { StreamEvent } from "@aether/shared";
import { env } from "../env.js";

export function prepareSse(reply: FastifyReply, request?: FastifyRequest) {
  const origin = request?.headers.origin;

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",

    // CORS for streamed responses written through raw.writeHead()
    "Access-Control-Allow-Origin": origin || env.WEB_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin"
  });
}

export function sendEvent(reply: FastifyReply, event: StreamEvent) {
  reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
}