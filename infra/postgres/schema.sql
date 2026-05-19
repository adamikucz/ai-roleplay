create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  language text not null default 'pl',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists characters (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id) on delete set null,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  name text not null,
  tagline text,
  avatar_url text,
  description text,
  persona text not null,
  scenario text not null,
  greeting text not null,
  style_profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  title text not null default 'New Scene',
  scene_state jsonb not null,
  last_model text,
  language text not null default 'pl',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  model text,
  quality_score int not null default 0,
  token_count int not null default 0,
  emotional_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  type text not null check (type in ('short_term','long_term','emotional','narrative','relationship','style')),
  content text not null,
  importance int not null default 50 check (importance between 0 and 100),
  emotional_valence int not null default 0 check (emotional_valence between -100 and 100),
  embedding vector(1536),
  decay_after timestamptz,
  last_accessed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists memory_clusters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  cluster_type text not null,
  summary text not null,
  source_memory_ids uuid[] not null default '{}',
  importance int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists relationship_states (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, character_id)
);

create table if not exists generation_audits (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  model text not null,
  prompt_hash text not null,
  latency_ms int not null,
  quality_score int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_characters_visibility on characters(visibility, created_at desc);
create index if not exists idx_sessions_user on sessions(user_id, updated_at desc);
create index if not exists idx_messages_session on messages(session_id, created_at asc);
create index if not exists idx_memories_lookup on memories(user_id, character_id, session_id, type, importance desc);
create index if not exists idx_clusters_lookup on memory_clusters(user_id, character_id, session_id, importance desc);

insert into users (email, password_hash, display_name)
values (
  'demo@aether.local',
  '$2b$12$rRfAwKqwlTpyX1.ewMnv9eN.QeEDXxuOxddUf0iMAmfJAtLGxE0FK',
  'Demo User'
)
on conflict (email) do nothing;

insert into characters (visibility, name, tagline, persona, scenario, greeting, style_profile)
values (
  'public',
  'Evelyn Vale',
  'Kinematograficzna, ciągła emocjonalnie narracja.',
  'Evelyn jest inteligentna emocjonalnie, spostrzegawcza i ciepła, ale bez sztucznej i natychmiastowej poufałości. Jest spójna psychologicznie — pamięta małe detale, nosi w sobie nierozwiązane napięcie emocjonalne i reaguje poprzez mowę ciała, ciszę oraz bogate w podtekst dialogi. Posiada własną sprawczość, zmienne nastroje i wyraźne granice.',
  'Użytkownik i Evelyn przebywają w mrocznym, deszczowym mieście, w jej starym apartamencie. Ich relacja rozwija się z czasem na podstawie pamięci, zaufania, intymności, napięcia i wspólnych przeżyć. Świat i relacja nigdy się nie resetują bez fabularnego powodu.',
  'Deszcz cicho uderza o szybę. Evelyn podnosi wzrok zza krawędzi kanapy, a na jej twarzy maluje się mieszanka ulgi i ostrożnej ciekawości. – Wróciłeś – mówi cicho.',
  '{"proseDensity":76,"initiative":68,"emotionalExpressiveness":82,"messageLength":"adaptive","narrationStyle":"cinematic","perspective":"third_person_limited"}'::jsonb
)
on conflict do nothing;
