-- 013 içindeki membership oluşturma kontrolünü düzelt.
-- INSERT sonrası FOUND değişebildiği için açık bir boolean kullanılır.

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
  v_has_membership boolean := false;
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

  -- Kod satırını kilitle: aynı kod iki eşzamanlı istekte
  -- yalnızca bir kez kullanılabilir.
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

  -- Mevcut membership kaydını kilitle ve var olup olmadığını
  -- açık bir boolean ile sakla.
  select *
    into v_membership
  from public.memberships
  where user_id = v_user_id
  for update;

  v_has_membership := found;

  if v_has_membership then
    v_membership_id := v_membership.id;

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

  -- Membership yoksa yeni kayıt oluştur.
  if not v_has_membership then

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
    -- Süresiz mevcut premium üyelik korunur.
    v_membership_id := v_membership.id;
  end if;

  update public.pro_entitlements
  set membership_id = v_membership_id
  where id = v_entitlement_id;

  -- Bu unique index nedeniyle aynı access_code_id ikinci kez
  -- redemption olarak eklenemez.
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
