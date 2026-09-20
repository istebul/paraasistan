-- A recurring transaction must reference a subscription owned by
-- the same user as the transaction.

create or replace function public.check_recurring_transaction_ownership()
returns trigger
language plpgsql
as $$
declare
  subscription_user_id uuid;
begin
  if new.subscription_id is null then
    return new;
  end if;

  select user_id
    into subscription_user_id
  from public.subscriptions
  where id = new.subscription_id;

  if subscription_user_id is null then
    raise exception 'Bağlı abonelik bulunamadı.';
  end if;

  if subscription_user_id <> new.user_id then
    raise exception 'İşlem ile aboneliğin kullanıcıları eşleşmiyor.';
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_recurring_ownership_check
  on public.transactions;

create trigger transactions_recurring_ownership_check
before insert or update of subscription_id, user_id
on public.transactions
for each row
execute function public.check_recurring_transaction_ownership();
