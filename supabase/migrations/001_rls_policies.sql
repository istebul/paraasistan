-- ParaAsistan RLS baseline
-- Review existing policies before applying this migration in production.

alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.subscriptions enable row level security;
alter table public.budgets enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

 drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions"
  on public.transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals"
  on public.goals
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own subscriptions" on public.subscriptions;
create policy "Users can manage own subscriptions"
  on public.subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own budgets" on public.budgets;
create policy "Users can manage own budgets"
  on public.budgets
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own membership" on public.memberships;
create policy "Users can read own membership"
  on public.memberships
  for select
  to authenticated
  using (auth.uid() = user_id);
