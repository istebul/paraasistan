-- Pro kodları ile memberships arasındaki referansları sağlamlaştır.
-- memberships.id bigint olduğu için erişim kodundaki membership_id de bigint olmalıdır.

alter table public.pro_access_codes
  alter column membership_id type bigint
  using membership_id::text::bigint;

alter table public.pro_access_codes
  drop constraint if exists pro_access_codes_membership_id_fkey;

alter table public.pro_access_codes
  add constraint pro_access_codes_membership_id_fkey
  foreign key (membership_id)
  references public.memberships(id)
  on delete set null;

alter table public.memberships
  drop constraint if exists memberships_access_code_id_fkey;

alter table public.memberships
  add constraint memberships_access_code_id_fkey
  foreign key (access_code_id)
  references public.pro_access_codes(id)
  on delete set null;

-- Bir erişim kodu yalnızca bir kez kullanılabilir.
create unique index if not exists pro_code_redemptions_access_code_unique_idx
  on public.pro_code_redemptions(access_code_id);

-- Admin ve Edge Function sorgularını hızlandır.
create index if not exists pro_access_codes_target_email_idx
  on public.pro_access_codes(lower(target_email));

create index if not exists pro_entitlements_user_status_idx
  on public.pro_entitlements(user_id, status);

create index if not exists pro_code_redemptions_access_code_idx
  on public.pro_code_redemptions(access_code_id);
