# Aether Roleplay Platform

Production-structured immersive AI roleplay platform with persistent memory, emotional relationship simulation, streaming responses, model routing, authentication, PWA support and cinematic frontend.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind, Framer Motion, Zustand
- Backend: Fastify, TypeScript, PostgreSQL, Redis, JWT auth, SSE + WebSocket streaming
- AI: OpenRouter streaming, model router, prompt orchestration, response quality scoring
- Memory: short-term, long-term, emotional, narrative and relationship memory with compression jobs
- Persistence: PostgreSQL + pgvector-ready schema

## Quick start

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:schema
pnpm --filter @aether/shared build
pnpm dev
```

Open:

- Web: http://localhost:3000
- API health: http://localhost:4000/health

## Production docker

```bash
cp .env.example .env
# Fill JWT_SECRET and OPENROUTER_API_KEY
docker compose up --build
```

## Required environment variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aether_roleplay
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_64_character_random_secret_for_production
OPENROUTER_API_KEY=replace_with_openrouter_key
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Aether Roleplay
API_PORT=4000
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000/v1/chat/ws
```

## Architecture

`apps/api` owns authentication, session persistence, AI orchestration, memory retrieval/compression, relationship state evolution, scene continuity and streaming transport.

`apps/web` owns the cinematic chat interface, PWA shell, local message state, responsive layout and stream rendering.

`packages/shared` owns cross-app types and validation schemas.
