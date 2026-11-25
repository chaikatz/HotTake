-- Tester sign-in (while SMS isn't switched on). Used only by the `test-login`
-- edge function with the service role; app users can't call any of this.
--
-- TURN OFF before real launch:  delete from private.settings where key = 'tester_code';

create table if not exists private.settings (
  key text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;

create or replace function public.auth_user_id_by_phone(p_phone text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where phone = p_phone limit 1;
$$;

-- null when tester sign-in is off; otherwise whether the code matches.
create or replace function public.tester_code_matches(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from private.settings where key = 'tester_code') then null
    else exists (select 1 from private.settings where key = 'tester_code' and value = btrim(p_code))
  end;
$$;

revoke execute on function public.auth_user_id_by_phone(text) from public, anon, authenticated;
revoke execute on function public.tester_code_matches(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_phone(text) to service_role;
grant execute on function public.tester_code_matches(text) to service_role;
