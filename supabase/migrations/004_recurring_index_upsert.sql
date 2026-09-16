-- Make the recurring pair directly usable by PostgREST upsert(onConflict).
drop index if exists public.transactions_recurring_subscription_month_idx;

create unique index transactions_recurring_subscription_month_idx
  on public.transactions (subscription_id, recurring_month);
