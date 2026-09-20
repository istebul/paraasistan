-- ParaAsistan Admin Panel + tek kullanımlık Pro erişim altyapısı.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.memberships
  add column if not exists starts_at timestamptz;

alter table public.memberships
  add column if not exists expires_at timestamptz;

alter table public.memberships
  add column if not exists source text;

alter table public.memberships
  add column if not exists access_code_id uuid;

create table if not exists public.pro_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  code_hint text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_email text,
  plan text not null default 'premium',
  duration_days integer not null check (duration_days > 0 and duration_days <= 3650),
  features jsonb not null default '{}'::jsonb,
  redeem_deadline timestamptz,
  status text not null default 'active'
    check (status in ('active', 'redeemed', 'expired', 'revoked')),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  membership_id uuid,
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoke_reason text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_code_id uuid unique references public.pro_access_codes(id) on delete set null,
  plan text not null default 'premium',
  features jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'expired')),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoke_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.pro_access_codes(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  entitlement_id uuid references public.pro_entitlements(id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create index if not exists pro_access_codes_target_user_idx
  on public.pro_access_codes (target_user_id);

create index if not exists pro_access_codes_status_idx
  on public.pro_access_codes (status);

create index if not exists pro_access_codes_created_at_idx
  on public.pro_access_codes (created_at desc);

create index if not exists pro_entitlements_user_idx
  on public.pro_entitlements (user_id);

create index if not exists pro_entitlements_expires_at_idx
  on public.pro_entitlements (expires_at);

create index if not exists pro_code_redemptions_user_idx
  on public.pro_code_redemptions (user_id);

create index if not exists memberships_access_code_idx
  on public.memberships (access_code_id);

alter table public.admin_users enable row level security;
alter table public.pro_access_codes enable row level security;
alter table public.pro_entitlements enable row level security;
alter table public.pro_code_redemptions enable row level security;

-- Admin tabloları ve kod tabloları doğrudan tarayıcıdan okunup yazılamaz.
-- Admin işlemleri yalnızca güvenli Edge Function üzerinden yapılacaktır.

drop policy if exists pro_entitlements_select_own on public.pro_entitlements;

create policy pro_entitlements_select_own
on public.pro_entitlements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists pro_code_redemptions_select_own on public.pro_code_redemptions;

create policy pro_code_redemptions_select_own
on public.pro_code_redemptions
for select
to authenticated
using (auth.uid() = user_id);
