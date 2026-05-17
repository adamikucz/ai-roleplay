import jwt from "jsonwebtoken";
import { env } from "../env.js";

export type AuthUser = { id: string; email: string; displayName: string };

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "30d", issuer: "aether-roleplay" });
}

export function verifyAuthToken(token: string): AuthUser {
  return jwt.verify(token, env.JWT_SECRET, { issuer: "aether-roleplay" }) as AuthUser;
}
