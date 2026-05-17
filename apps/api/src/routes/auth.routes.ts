import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { LoginSchema, RegisterSchema } from "@aether/shared";
import { createUser, findUserByEmail } from "../repositories/users.repo.js";
import { signAuthToken } from "../auth/jwt.js";
import { getAuthUser } from "../auth/require-auth.js";

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);
    const existing = await findUserByEmail(body.email);
    if (existing) return reply.conflict('Email already registered');
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await createUser({ email: body.email, passwordHash, displayName: body.displayName });
    const publicUser = { id: user.id, email: user.email, displayName: user.display_name };
    return { user: publicUser, token: signAuthToken(publicUser) };
  });

  app.post('/auth/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);
    const user = await findUserByEmail(body.email);
    if (!user) return reply.unauthorized('Invalid credentials');
    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) return reply.unauthorized('Invalid credentials');
    const publicUser = { id: user.id, email: user.email, displayName: user.display_name };
    return { user: publicUser, token: signAuthToken(publicUser) };
  });

  app.get('/auth/me', async (request, reply) => {
    try { return { user: getAuthUser(request) }; } catch { return reply.unauthorized('Unauthorized'); }
  });
}
