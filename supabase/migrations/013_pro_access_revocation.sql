-- Pro koduyla verilen erişimin güvenli şekilde geri alınabilmesi için
-- redeem öncesindeki membership durumunu sakla.

alter table public.pro_entitlements
  add column if not exists membership_id bigint;

alter table public.pro_entitlements
  add column if not exists membership_snapshot_before jsonb;

alter table public.pro_entitlements
  add constraint pro_entitlements_membership_id_fkey
  foreign key (membership_id)
  references public.memberships(id)
  on delete set null;

create index if not exists pro_entitlements_membership_idx
  on public.pro_entitlements(membership_id);

-- Redeem fonksiyonunu önceki membership durumunu saklayacak şekilde güncelle.
create or replace function public.redeem_pro_access_code(
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_normalized_code text;
  v_code_hash text;
  v_code public.pro_access_codes%rowtype;
  v_entitlement_id uuid;
  v_membership_id bigint;
  v_membership public.memberships%rowtype;
  v_membership_snapshot jsonb := null;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Giriş yapılması gerekiyor.';
  end if;

  if p_code is null or length(trim(p_code)) < 8 then
    raise exception 'Geçersiz Pro kodu.';
  end if;

  select email
    into v_user_email
  from auth.users
  where id = v_user_id;

  v_normalized_code :=
    upper(
      regexp_replace(
        trim(p_code),
        '\s+',
        '',
        'g'
      )
    );

  v_code_hash :=
    encode(
      digest(v_normalized_code, 'sha256'),
      'hex'
    );

  select *
    into v_code
  from public.pro_access_codes
  where code_hash = v_code_hash
  for update;

  if not found then
    raise exception 'Geçersiz veya kullanılamayan Pro kodu.';
  end if;

  if v_code.status <> 'active' then
    raise exception 'Bu Pro kodu artık kullanılamaz.';
  end if;

  if v_code.redeem_deadline is not null
     and v_code.redeem_deadline <= now() then

    update public.pro_access_codes
    set status = 'expired'
    where id = v_code.id;

    raise exception 'Bu Pro kodunun kullanım süresi dolmuş.';
  end if;

  if v_code.target_user_id is not null
     and v_code.target_user_id <> v_user_id then
    raise exception 'Bu Pro kodu başka bir kullanıcı için oluşturulmuş.';
  end if;

  if v_code.target_user_id is null
     and v_code.target_email is not null
     and lower(v_code.target_email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'Bu Pro kodu belirtilen kullanıcı hesabı için oluşturulmuş.';
  end if;

  v_starts_at := now();
  v_expires_at :=
    v_starts_at
    + make_interval(days => v_code.duration_days);

  -- Mevcut membership'i kilitle ve eski halini sakla.
  select *
    into v_membership
  from public.memberships
  where user_id = v_user_id
  for update;

  if found then
    v_membership_snapshot := jsonb_build_object(
      'id', v_membership.id,
      'plan', v_membership.plan,
      'status', v_membership.status,
      'started_at', v_membership.started_at,
      'starts_at', v_membership.starts_at,
      'expires_at', v_membership.expires_at,
      'provider', v_membership.provider,
      'provider_customer_id', v_membership.provider_customer_id,
      'provider_subscription_id', v_membership.provider_subscription_id,
      'source', v_membership.source,
      'access_code_id', v_membership.access_code_id
    );

    v_membership_id := v_membership.id;
  end if;

  insert into public.pro_entitlements (
    user_id,
    access_code_id,
    membership_id,
    membership_snapshot_before,
    plan,
    features,
    starts_at,
    expires_at,
    status
  )
  values (
    v_user_id,
    v_code.id,
    v_membership_id,
    v_membership_snapshot,
    v_code.plan,
    v_code.features,
    v_starts_at,
    v_expires_at,
    'active'
  )
  returning id into v_entitlement_id;

  if not found then
    insert into public.memberships (
      user_id,
      plan,
      status,
      started_at,
      starts_at,
      expires_at,
      source,
      access_code_id,
      created_at,
      updated_at
    )
    values (
      v_user_id,
      'premium',
      'active',
      v_starts_at,
      v_starts_at,
      v_expires_at,
      'access_code',
      v_code.id,
      now(),
      now()
    )
    returning id into v_membership_id;

  elsif v_membership.plan = 'free'
     or v_membership.status in ('inactive', 'canceled')
     or (
       v_membership.expires_at is not null
       and v_membership.expires_at <= now()
     ) then

    update public.memberships
    set
      plan = 'premium',
      status = 'active',
      started_at = coalesce(started_at, v_starts_at),
      starts_at = v_starts_at,
      expires_at = v_expires_at,
      source = 'access_code',
      access_code_id = v_code.id,
      updated_at = now()
    where id = v_membership.id
    returning id into v_membership_id;

  elsif v_membership.plan = 'premium'
     and v_membership.expires_at is not null then

    update public.memberships
    set
      status = 'active',
      expires_at =
        greatest(v_membership.expires_at, v_starts_at)
        + make_interval(days => v_code.duration_days),
      updated_at = now()
    where id = v_membership.id
    returning id into v_membership_id;

  else
    v_membership_id := v_membership.id;
  end if;

  update public.pro_entitlements
  set membership_id = v_membership_id
  where id = v_entitlement_id;

  insert into public.pro_code_redemptions (
    access_code_id,
    user_id,
    entitlement_id
  )
  values (
    v_code.id,
    v_user_id,
    v_entitlement_id
  );

  update public.pro_access_codes
  set
    status = 'redeemed',
    redeemed_by = v_user_id,
    redeemed_at = now(),
    membership_id = v_membership_id
  where id = v_code.id;

  return jsonb_build_object(
    'success', true,
    'plan', v_code.plan,
    'duration_days', v_code.duration_days,
    'starts_at', v_starts_at,
    'expires_at', v_expires_at,
    'entitlement_id', v_entitlement_id,
    'membership_id', v_membership_id
  );
end;
$$;

revoke all
on function public.redeem_pro_access_code(text)
from public;

grant execute
on function public.redeem_pro_access_code(text)
to authenticated;

-- Admin tarafından bir Pro erişimini geri alma.
create or replace function public.revoke_pro_entitlement(
  p_entitlement_id uuid,
  p_admin_user_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_entitlement public.pro_entitlements%rowtype;
  v_code public.pro_access_codes%rowtype;
  v_admin_active boolean;
  v_snapshot jsonb;
  v_membership_id bigint;
begin
  select is_active
    into v_admin_active
  from public.admin_users
  where user_id = p_admin_user_id;

  if coalesce(v_admin_active, false) <> true then
    raise exception 'Admin yetkisi gerekli.';
  end if;

  select *
    into v_entitlement
  from public.pro_entitlements
  where id = p_entitlement_id
  for update;

  if not found then
    raise exception 'Pro erişimi bulunamadı.';
  end if;

  if v_entitlement.status <> 'active' then
    raise exception 'Bu Pro erişimi zaten aktif değil.';
  end if;

  v_snapshot := v_entitlement.membership_snapshot_before;
  v_membership_id := v_entitlement.membership_id;

  if v_membership_id is not null then
    perform 1
    from public.memberships
    where id = v_membership_id
    for update;
  end if;

  if v_membership_id is not null
     and v_snapshot is not null then

    update public.memberships
    set
      plan = v_snapshot->>'plan',
      status = v_snapshot->>'status',
      started_at = (v_snapshot->>'started_at')::timestamptz,
      starts_at = (v_snapshot->>'starts_at')::timestamptz,
      expires_at = (v_snapshot->>'expires_at')::timestamptz,
      provider = v_snapshot->>'provider',
      provider_customer_id = v_snapshot->>'provider_customer_id',
      provider_subscription_id = v_snapshot->>'provider_subscription_id',
      source = v_snapshot->>'source',
      access_code_id = (v_snapshot->>'access_code_id')::uuid,
      updated_at = now()
    where id = v_membership_id;

  elsif v_membership_id is not null then

    update public.memberships
    set
      plan = 'free',
      status = 'inactive',
      started_at = null,
      starts_at = null,
      expires_at = null,
      source = null,
      access_code_id = null,
      updated_at = now()
    where id = v_membership_id
      and source = 'access_code'
      and access_code_id = v_entitlement.access_code_id;
  end if;

  update public.pro_entitlements
  set
    status = 'revoked',
    revoked_at = now(),
    revoked_by = p_admin_user_id,
    revoke_reason = p_reason
  where id = v_entitlement.id;

  select *
    into v_code
  from public.pro_access_codes
  where id = v_entitlement.access_code_id
  for update;

  if found then
    update public.pro_access_codes
    set
      status = 'revoked',
      revoked_by = p_admin_user_id,
      revoked_at = now(),
      revoke_reason = p_reason
    where id = v_code.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'entitlement_id', v_entitlement.id,
    'access_code_id', v_entitlement.access_code_id,
    'membership_id', v_membership_id
  );
end;
$$;

revoke all
on function public.revoke_pro_entitlement(uuid, uuid, text)
from public;
