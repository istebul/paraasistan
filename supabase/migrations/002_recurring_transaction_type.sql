-- Recurring records can represent income or expense.
alter table public.subscriptions
  add column if not exists type text not null default 'expense';

alter table public.subscriptions
  drop constraint if exists subscriptions_type_check;

alter table public.subscriptions
  add constraint subscriptions_type_check
  check (type in ('income', 'expense'));
