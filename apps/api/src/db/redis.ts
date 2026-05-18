import Redis from "ioredis";
import { env } from "../env.js";

const RedisClient = (Redis as any).default ?? Redis;

export const redis = new RedisClient(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true
});
