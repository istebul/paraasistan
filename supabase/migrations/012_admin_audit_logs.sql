-- Admin işlemlerinin değiştirilemez geçmişi.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  access_code_id uuid references public.pro_access_codes(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs(created_at desc);

create index if not exists admin_audit_logs_admin_user_idx
  on public.admin_audit_logs(admin_user_id);

create index if not exists admin_audit_logs_access_code_idx
  on public.admin_audit_logs(access_code_id);

alter table public.admin_audit_logs enable row level security;

-- Admin işlemleri servis rolü kullanan güvenli Edge Function
-- üzerinden yazılır ve okunur. Tarayıcıya doğrudan erişim verilmez.
