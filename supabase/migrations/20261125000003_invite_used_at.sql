-- An invite stays used even if the person who used it later deletes their
-- account (used_by goes null then; used_at does not).
create or replace function public.check_invite(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.invites where code = upper(btrim(p_code)) and used_at is null);
$$;

create or replace function public.complete_signup(p_code text, p_real_name text, p_display_mode public.display_mode)
returns public.profiles
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(p_code));
  v_name text := regexp_replace(btrim(coalesce(p_real_name, '')), '\s+', ' ', 'g');
  v_inviter uuid;
  v_phone text;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if found then
    return v_profile;
  end if;

  if char_length(v_name) < 2 then
    raise exception 'name_required';
  end if;

  select inviter_id into v_inviter from public.invites where code = v_code and used_at is null for update;
  if not found then
    raise exception 'invite_invalid';
  end if;

  select phone into v_phone from auth.users where id = v_uid;

  insert into public.profiles (id, phone, real_name, display_mode, invited_by, accepted_terms_at)
  values (v_uid, nullif(v_phone, ''), v_name, coalesce(p_display_mode, 'real'), v_inviter, now())
  returning * into v_profile;

  update public.invites set used_by = v_uid, used_at = now() where code = v_code;
  perform private.mint_invites(v_uid, 5);
  return v_profile;
end;
$$;

revoke execute on function public.check_invite(text) from public;
revoke execute on function public.complete_signup(text, text, public.display_mode) from public, anon;
grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.complete_signup(text, text, public.display_mode) to authenticated;
