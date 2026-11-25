-- Used only by the `test-login` edge function (service role) to find the auth
-- user for a phone number. Not callable by app users.
create or replace function public.auth_user_id_by_phone(p_phone text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where phone = p_phone limit 1;
$$;

revoke execute on function public.auth_user_id_by_phone(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_phone(text) to service_role;
