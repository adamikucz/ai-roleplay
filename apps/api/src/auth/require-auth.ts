import type { FastifyRequest } from "fastify";
import { verifyAuthToken, type AuthUser } from "./jwt.js";

export function getAuthUser(request: FastifyRequest): AuthUser {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new Error("Unauthorized");
  return verifyAuthToken(header.slice("Bearer ".length));
}
