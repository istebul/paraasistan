create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and is_active = true
  );
$$;

revoke all
on function public.is_current_user_admin()
from public;

grant execute
on function public.is_current_user_admin()
to authenticated;
