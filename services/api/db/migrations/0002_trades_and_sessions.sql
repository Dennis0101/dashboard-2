-- Trade proof v2 + auth sessions (conceptual migration)

-- 1) Trades: explicit grouping for ENTRY/EXIT proof
create table if not exists trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references app_users(id) on delete cascade,
  bot_id uuid null,
  symbol text not null,
  timeframe text not null,
  side text not null check (side in ('LONG','SHORT')),
  status text not null check (status in ('OPEN','CLOSED','HALTED','REJECTED')),

  entry_ts timestamptz null,
  entry_price numeric null,
  exit_ts timestamptz null,
  exit_price numeric null,

  qty numeric null,

  -- transparency: break down components
  realized_pnl numeric null,
  fees numeric null,
  funding numeric null,
  net_pnl numeric null,

  entry_reason_code text null,
  entry_reason_detail text null,
  exit_reason_code text null,
  exit_reason_detail text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Link trade_events -> trades
alter table trade_events
  add column if not exists trade_id uuid null references trades(id) on delete set null;

create index if not exists trade_events_user_created_idx on trade_events(user_id, created_at desc);
create index if not exists trades_user_created_idx on trades(user_id, created_at desc);

-- 3) Audit log (append-only)
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references app_users(id) on delete cascade,
  actor text not null, -- 'user' | 'system' | 'admin' (admin should be rare)
  action text not null,
  target_type text null,
  target_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4) Refresh tokens (hashed, rotatable)
create table if not exists refresh_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null,
  device_id text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  replaced_by uuid null references refresh_tokens(id) on delete set null
);

create index if not exists refresh_tokens_user_idx on refresh_tokens(user_id, created_at desc);
create unique index if not exists refresh_tokens_token_hash_uq on refresh_tokens(token_hash);

-- 5) RLS
alter table trades enable row level security;
alter table audit_log enable row level security;
alter table refresh_tokens enable row level security;

drop policy if exists trades_rls on trades;
create policy trades_rls on trades
  using (user_id = current_setting('app.user_id')::uuid)
  with check (user_id = current_setting('app.user_id')::uuid);

drop policy if exists audit_log_rls on audit_log;
create policy audit_log_rls on audit_log
  using (user_id = current_setting('app.user_id')::uuid)
  with check (user_id = current_setting('app.user_id')::uuid);

drop policy if exists refresh_tokens_rls on refresh_tokens;
create policy refresh_tokens_rls on refresh_tokens
  using (user_id = current_setting('app.user_id')::uuid)
  with check (user_id = current_setting('app.user_id')::uuid);

