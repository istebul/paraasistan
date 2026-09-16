-- Prevent duplicate monthly transactions generated from recurring subscriptions.
alter table public.transactions
  add column if not exists subscription_id bigint references public.subscriptions(id) on delete set null;

alter table public.transactions
  add column if not exists recurring_month text;

create unique index if not exists transactions_recurring_subscription_month_idx
  on public.transactions (subscription_id, recurring_month)
  where subscription_id is not null and recurring_month is not null;
