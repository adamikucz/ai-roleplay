import type { FastifyReply } from "fastify";
import type { StreamEvent } from "@aether/shared";
export function prepareSse(reply: FastifyReply) {
  reply.raw.writeHead(200, { 'Content-Type':'text/event-stream; charset=utf-8', 'Cache-Control':'no-cache, no-transform', Connection:'keep-alive', 'X-Accel-Buffering':'no' });
}
export function sendEvent(reply: FastifyReply, event: StreamEvent) { reply.raw.write(`data: ${JSON.stringify(event)}\n\n`); }
