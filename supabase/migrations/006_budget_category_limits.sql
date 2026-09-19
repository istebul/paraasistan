create table if not exists public.budget_category_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_category_limits_user_category_key
    unique (user_id, category),
  constraint budget_category_limits_amount_check
    check (amount >= 0)
);

alter table public.budget_category_limits enable row level security;

drop policy if exists "Users can view own category limits"
on public.budget_category_limits;

create policy "Users can view own category limits"
on public.budget_category_limits
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own category limits"
on public.budget_category_limits;

create policy "Users can insert own category limits"
on public.budget_category_limits
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own category limits"
on public.budget_category_limits;

create policy "Users can update own category limits"
on public.budget_category_limits
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own category limits"
on public.budget_category_limits;

create policy "Users can delete own category limits"
on public.budget_category_limits
for delete
using (auth.uid() = user_id);
