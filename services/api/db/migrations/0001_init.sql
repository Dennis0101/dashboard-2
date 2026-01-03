-- Postgres schema baseline (conceptual; run via a migration tool in real env)

create extension if not exists "uuid-ossp";

-- Users (internal)
create table if not exists app_users (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  provider text not null,
  provider_subject text not null,
  email text null,
  unique(provider, provider_subject)
);

-- Subscription (server-enforced)
create table if not exists subscriptions (
  user_id uuid primary key references app_users(id) on delete cascade,
  tier text not null check (tier in ('basic','pro','vip')),
  updated_at timestamptz not null default now()
);

-- Exchange API keys (encrypted at rest; never returned in plaintext)
create table if not exists exchange_api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references app_users(id) on delete cascade,
  exchange text not null,
  encrypted_payload jsonb not null,
  encryption_version int not null default 1,
  masked_hint text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

-- Trade events (append-only; “proof on chart”)
create table if not exists trade_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references app_users(id) on delete cascade,
  bot_id uuid null,
  symbol text not null,
  timeframe text not null,
  event_type text not null check (event_type in ('ENTRY','EXIT','REJECT','HALT','INFO')),
  side text null check (side in ('LONG','SHORT')),
  price numeric null,
  qty numeric null,
  pnl numeric null,
  reason_code text null,
  reason_detail text null,
  exchange_ts timestamptz null,
  created_at timestamptz not null default now()
);

-- RLS: tenant isolation
alter table subscriptions enable row level security;
alter table exchange_api_keys enable row level security;
alter table trade_events enable row level security;

drop policy if exists subscriptions_rls on subscriptions;
create policy subscriptions_rls on subscriptions
  using (user_id = current_setting('app.user_id')::uuid)
  with check (user_id = current_setting('app.user_id')::uuid);

drop policy if exists exchange_api_keys_rls on exchange_api_keys;
create policy exchange_api_keys_rls on exchange_api_keys
  using (user_id = current_setting('app.user_id')::uuid)
  with check (user_id = current_setting('app.user_id')::uuid);

drop policy if exists trade_events_rls on trade_events;
create policy trade_events_rls on trade_events
  using (user_id = current_setting('app.user_id')::uuid)
  with check (user_id = current_setting('app.user_id')::uuid);

