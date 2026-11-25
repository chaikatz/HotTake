-- Hot Take: initial schema.
--
-- Tables follow the data model in SPEC.md. The spec's "users" table is
-- `profiles` here, keyed to Supabase's auth.users. Reads that need an
-- author's display name go through SECURITY DEFINER functions, so a member's
-- real name, phone and display choice never leave the database except as the
-- display name they chose ("Anonymous" or their real name).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.display_mode as enum ('real', 'anonymous');
create type public.reaction_type as enum ('agree', 'disagree');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  real_name text not null check (char_length(real_name) between 2 and 60),
  display_mode public.display_mode not null default 'real',
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.invites (
  code text primary key check (code ~ '^[A-Z0-9]{4,12}$'),
  inviter_id uuid references public.profiles (id) on delete cascade, -- null for founder codes
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_inviter_idx on public.invites (inviter_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'other',
  is_place boolean not null default false,
  address text,
  neighborhood text,
  city text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  external_id text unique, -- Apple Maps / OpenStreetMap id, for places
  parent_id uuid references public.subjects (id) on delete set null, -- e.g. a dish at a restaurant
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index subjects_name_idx on public.subjects (lower(name));
create index subjects_parent_idx on public.subjects (parent_id);

create table public.takes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  rating numeric(3, 1) not null check (rating >= 0 and rating <= 10),
  text text not null check (char_length(btrim(text)) between 1 and 280),
  created_at timestamptz not null default now()
);
create index takes_created_idx on public.takes (created_at desc);
create index takes_subject_idx on public.takes (subject_id);
create index takes_user_idx on public.takes (user_id);

create table public.take_photos (
  id uuid primary key default gen_random_uuid(),
  take_id uuid not null references public.takes (id) on delete cascade,
  storage_path text not null,
  position smallint not null check (position between 0 and 3),
  unique (take_id, position)
);

create table public.reactions (
  take_id uuid not null references public.takes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (take_id, user_id)
);
create index reactions_user_idx on public.reactions (user_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  take_id uuid not null references public.takes (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (take_id, reporter_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.subjects enable row level security;
alter table public.takes enable row level security;
alter table public.take_photos enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create or replace function private.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;

-- profiles: you see and edit only your own row (and only name + display choice).
create policy "own profile: read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated, anon;
grant update (real_name, display_mode) on public.profiles to authenticated;

-- invites: you see the codes you were given to share.
create policy "own invites: read" on public.invites for select to authenticated using (inviter_id = (select auth.uid()));

-- subjects: members read all; creation goes through upsert_subject().
create policy "subjects: members read" on public.subjects for select to authenticated using ((select private.is_member()));

-- takes: members read all; you create, edit and delete only your own.
create policy "takes: members read" on public.takes for select to authenticated using ((select private.is_member()));
create policy "takes: insert own" on public.takes for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));
create policy "takes: update own" on public.takes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "takes: delete own" on public.takes for delete to authenticated using (user_id = (select auth.uid()));

-- take_photos: members read; you attach/remove photos only on your own takes.
create policy "photos: members read" on public.take_photos for select to authenticated using ((select private.is_member()));
create policy "photos: insert own" on public.take_photos for insert to authenticated
  with check (exists (select 1 from public.takes t where t.id = take_id and t.user_id = (select auth.uid())));
create policy "photos: delete own" on public.take_photos for delete to authenticated
  using (exists (select 1 from public.takes t where t.id = take_id and t.user_id = (select auth.uid())));

-- reactions: members read; you manage only your own.
create policy "reactions: members read" on public.reactions for select to authenticated using ((select private.is_member()));
create policy "reactions: insert own" on public.reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));
create policy "reactions: update own" on public.reactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "reactions: delete own" on public.reactions for delete to authenticated using (user_id = (select auth.uid()));

-- reports: you file and see only your own.
create policy "reports: read own" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy "reports: insert own" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (select private.is_member()));

-- blocks: you manage only your own.
create policy "blocks: read own" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "blocks: insert own" on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "blocks: delete own" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Helpers (private schema: not exposed through the API)
-- ---------------------------------------------------------------------------

-- Takes the current user may see: not from someone they blocked or who
-- blocked them, and not one they reported.
create or replace function private.visible_takes() returns setof public.takes
language sql stable security definer set search_path = '' as $$
  select t.*
  from public.takes t
  where not exists (
      select 1 from public.blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = t.user_id)
         or (b.blocked_id = (select auth.uid()) and b.blocker_id = t.user_id)
    )
    and not exists (
      select 1 from public.reports r where r.take_id = t.id and r.reporter_id = (select auth.uid())
    );
$$;

create or replace function private.display_name(p public.profiles) returns text
language sql immutable set search_path = '' as $$
  select case when p.display_mode = 'anonymous' then 'Anonymous' else p.real_name end;
$$;

-- Metres between two points (haversine).
create or replace function private.distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8) returns float8
language sql immutable set search_path = '' as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create or replace function private.gen_invite_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(6);
  result text := '';
  i int;
begin
  for i in 0..5 loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return result;
end;
$$;

create or replace function private.mint_invites(p_inviter uuid, p_count int) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  made int := 0;
begin
  while made < p_count loop
    begin
      insert into public.invites (code, inviter_id) values (private.gen_invite_code(), p_inviter);
      made := made + 1;
    exception when unique_violation then
      -- try another code
    end;
  end loop;
end;
$$;

-- Escape % and _ for ILIKE.
create or replace function private.like_escape(s text) returns text
language sql immutable set search_path = '' as $$
  select replace(replace(replace(s, '\', '\\'), '%', '\%'), '_', '\_');
$$;

-- ---------------------------------------------------------------------------
-- Sign-up
-- ---------------------------------------------------------------------------

create or replace function public.check_invite(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.invites where code = upper(btrim(p_code)) and used_by is null);
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

  select inviter_id into v_inviter from public.invites where code = v_code and used_by is null for update;
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

-- ---------------------------------------------------------------------------
-- Subjects
-- ---------------------------------------------------------------------------

create or replace function public.upsert_subject(
  p_name text,
  p_category text,
  p_is_place boolean,
  p_address text default null,
  p_neighborhood text default null,
  p_city text default null,
  p_lat float8 default null,
  p_lng float8 default null,
  p_external_id text default null,
  p_parent_id uuid default null
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id uuid;
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if not private.is_member() then
    raise exception 'not_member';
  end if;
  if char_length(v_name) < 1 then
    raise exception 'subject_name_required';
  end if;

  if p_external_id is not null then
    select id into v_id from public.subjects where external_id = p_external_id;
    if found then return v_id; end if;
  end if;

  if p_is_place and p_lat is not null and p_lng is not null then
    -- The same place found through a different search: same name, within 80m.
    select id into v_id from public.subjects
    where is_place and lower(name) = lower(v_name) and lat is not null
      and private.distance_m(lat, lng, p_lat, p_lng) < 80
    limit 1;
    if found then return v_id; end if;
  elsif not p_is_place then
    select id into v_id from public.subjects
    where not is_place and lower(name) = lower(v_name) and parent_id is not distinct from p_parent_id
    limit 1;
    if found then return v_id; end if;
  end if;

  insert into public.subjects (name, category, is_place, address, neighborhood, city, lat, lng, external_id, parent_id, created_by)
  values (
    v_name,
    coalesce(nullif(btrim(p_category), ''), 'other'),
    coalesce(p_is_place, false),
    nullif(btrim(p_address), ''),
    nullif(btrim(p_neighborhood), ''),
    nullif(btrim(p_city), ''),
    p_lat,
    p_lng,
    p_external_id,
    p_parent_id,
    auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.search_subjects(p_query text)
returns table (
  id uuid, name text, category text, is_place boolean, neighborhood text, address text,
  parent_name text, avg_rating numeric, take_count int
)
language sql stable security definer set search_path = '' as $$
  with q as (select '%' || private.like_escape(btrim(p_query)) || '%' as pat, lower(btrim(p_query)) as low),
  stats as (
    select subject_id, round(avg(rating), 1) as avg_rating, count(*)::int as take_count
    from private.visible_takes() group by subject_id
  )
  select s.id, s.name, s.category, s.is_place, s.neighborhood, s.address, p.name, st.avg_rating, coalesce(st.take_count, 0)
  from public.subjects s
  cross join q
  left join public.subjects p on p.id = s.parent_id
  left join stats st on st.subject_id = s.id
  where private.is_member()
    and char_length(btrim(p_query)) >= 1
    and (s.name ilike q.pat or p.name ilike q.pat)
  order by (lower(s.name) = q.low) desc, (lower(s.name) like q.low || '%') desc,
           coalesce(st.take_count, 0) desc, s.name
  limit 12;
$$;

create or replace function public.subject_summary(p_subject_id uuid)
returns table (
  id uuid, name text, category text, is_place boolean, address text, neighborhood text, city text,
  lat float8, lng float8, parent_id uuid, parent_name text, avg_rating numeric, take_count int
)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.category, s.is_place, s.address, s.neighborhood, s.city, s.lat, s.lng,
         s.parent_id, p.name,
         (select round(avg(t.rating), 1) from private.visible_takes() t where t.subject_id = s.id),
         (select count(*)::int from private.visible_takes() t where t.subject_id = s.id)
  from public.subjects s
  left join public.subjects p on p.id = s.parent_id
  where s.id = p_subject_id and private.is_member();
$$;

create or replace function public.child_subjects(p_parent_id uuid)
returns table (id uuid, name text, category text, avg_rating numeric, take_count int)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.category, round(avg(t.rating), 1), count(t.id)::int
  from public.subjects s
  join private.visible_takes() t on t.subject_id = s.id
  where s.parent_id = p_parent_id and private.is_member()
  group by s.id
  order by avg(t.rating) desc, count(t.id) desc;
$$;

-- One pin per place: a dish's takes count toward its restaurant's pin.
create or replace function public.map_subjects()
returns table (id uuid, name text, category text, lat float8, lng float8, avg_rating numeric, take_count int)
language sql stable security definer set search_path = '' as $$
  with located as (
    select coalesce(case when parent.lat is not null then parent.id end, s.id) as pin_id, t.rating
    from private.visible_takes() t
    join public.subjects s on s.id = t.subject_id
    left join public.subjects parent on parent.id = s.parent_id
    where coalesce(parent.lat, s.lat) is not null
  )
  select p.id, p.name, p.category, p.lat, p.lng, round(avg(l.rating), 1), count(*)::int
  from located l
  join public.subjects p on p.id = l.pin_id
  where private.is_member() and p.lat is not null and p.lng is not null
  group by p.id;
$$;

-- ---------------------------------------------------------------------------
-- Takes
-- ---------------------------------------------------------------------------

-- Every take as the app draws it. Filters are optional and combine.
create or replace function public.take_cards(
  p_limit int default 20,
  p_before timestamptz default null,
  p_subject_id uuid default null,
  p_user_id uuid default null,
  p_ids uuid[] default null
)
returns table (
  id uuid, created_at timestamptz, rating numeric, text text,
  author_id uuid, author_name text, author_is_anonymous boolean, is_mine boolean,
  subject_id uuid, subject_name text, subject_category text, subject_is_place boolean,
  subject_neighborhood text, subject_address text, parent_id uuid, parent_name text,
  subject_avg numeric, subject_take_count int, is_spicy boolean,
  agree_count int, disagree_count int, my_reaction text, photos text[]
)
language sql stable security definer set search_path = '' as $$
  with page as (
    select t.*
    from private.visible_takes() t
    where private.is_member()
      and (p_before is null or t.created_at < p_before)
      and (p_subject_id is null or t.subject_id = p_subject_id)
      and (p_user_id is null or t.user_id = p_user_id)
      and (p_ids is null or t.id = any (p_ids))
    order by t.created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
  ),
  stats as (
    select v.subject_id, avg(v.rating) as avg_rating, count(*)::int as take_count
    from private.visible_takes() v
    where v.subject_id in (select subject_id from page)
    group by v.subject_id
  )
  select
    t.id, t.created_at, t.rating, t.text,
    t.user_id, private.display_name(pr), pr.display_mode = 'anonymous', t.user_id = (select auth.uid()),
    s.id, s.name, s.category, s.is_place, coalesce(s.neighborhood, parent.neighborhood), coalesce(s.address, parent.address),
    s.parent_id, parent.name,
    round(st.avg_rating, 1), st.take_count,
    (st.take_count >= 5 and abs(t.rating - st.avg_rating) >= 2),
    (select count(*)::int from public.reactions r where r.take_id = t.id and r.type = 'agree'),
    (select count(*)::int from public.reactions r where r.take_id = t.id and r.type = 'disagree'),
    (select r.type::text from public.reactions r where r.take_id = t.id and r.user_id = (select auth.uid())),
    coalesce((select array_agg(ph.storage_path order by ph.position) from public.take_photos ph where ph.take_id = t.id), '{}')
  from page t
  join public.profiles pr on pr.id = t.user_id
  join public.subjects s on s.id = t.subject_id
  left join public.subjects parent on parent.id = s.parent_id
  join stats st on st.subject_id = t.subject_id
  order by t.created_at desc;
$$;

create or replace function public.create_take(p_subject_id uuid, p_rating numeric, p_text text, p_photo_paths text[] default '{}')
returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_path text;
  v_pos int := 0;
begin
  if not private.is_member() then
    raise exception 'not_member';
  end if;
  if coalesce(array_length(p_photo_paths, 1), 0) > 4 then
    raise exception 'too_many_photos';
  end if;
  insert into public.takes (user_id, subject_id, rating, text)
  values (v_uid, p_subject_id, round(p_rating, 1), btrim(p_text))
  returning id into v_id;

  foreach v_path in array coalesce(p_photo_paths, '{}') loop
    if split_part(v_path, '/', 1) <> v_uid::text then
      raise exception 'bad_photo_path';
    end if;
    insert into public.take_photos (take_id, storage_path, position) values (v_id, v_path, v_pos);
    v_pos := v_pos + 1;
  end loop;
  return v_id;
end;
$$;

-- Agree / disagree toggle: tap again to take it back. Returns what's now set.
create or replace function public.react_to_take(p_take_id uuid, p_type public.reaction_type)
returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.reaction_type;
begin
  if not private.is_member() then
    raise exception 'not_member';
  end if;
  if exists (select 1 from public.takes where id = p_take_id and user_id = v_uid) then
    raise exception 'own_take';
  end if;
  select type into v_existing from public.reactions where take_id = p_take_id and user_id = v_uid;
  if v_existing = p_type then
    delete from public.reactions where take_id = p_take_id and user_id = v_uid;
    return null;
  end if;
  insert into public.reactions (take_id, user_id, type) values (p_take_id, v_uid, p_type)
  on conflict (take_id, user_id) do update set type = excluded.type, created_at = now();
  return p_type::text;
end;
$$;

create or replace function public.report_take(p_take_id uuid, p_reason text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.is_member() then
    raise exception 'not_member';
  end if;
  insert into public.reports (take_id, reporter_id, reason)
  values (p_take_id, auth.uid(), left(coalesce(nullif(btrim(p_reason), ''), 'Other'), 200))
  on conflict (take_id, reporter_id) do nothing;
end;
$$;

create or replace function public.block_user(p_user_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.is_member() then
    raise exception 'not_member';
  end if;
  if p_user_id = auth.uid() then
    return;
  end if;
  insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), p_user_id)
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- The Hot Take AI: candidate takes, SQL only (see supabase/functions/ask)
-- ---------------------------------------------------------------------------

create or replace function public.ai_candidate_takes(
  p_terms text[] default '{}',
  p_categories text[] default null,
  p_area_names text[] default null,
  p_lat float8 default null,
  p_lng float8 default null,
  p_radius_m float8 default null,
  p_limit int default 40
)
returns table (
  id uuid, rating numeric, text text, created_at timestamptz, author_name text,
  subject_name text, subject_category text, parent_name text, neighborhood text, address text, city text,
  distance_m float8, score int
)
language sql stable security definer set search_path = '' as $$
  with base as (
    select t.id, t.rating, t.text, t.created_at, private.display_name(pr) as author_name,
           s.name as subject_name, s.category, parent.name as parent_name,
           coalesce(s.neighborhood, parent.neighborhood) as neighborhood,
           coalesce(s.address, parent.address) as address,
           coalesce(s.city, parent.city) as city,
           coalesce(s.lat, parent.lat) as lat, coalesce(s.lng, parent.lng) as lng
    from private.visible_takes() t
    join public.profiles pr on pr.id = t.user_id
    join public.subjects s on s.id = t.subject_id
    left join public.subjects parent on parent.id = s.parent_id
    where private.is_member()
  ),
  scored as (
    select b.*,
      case when p_lat is not null and b.lat is not null then private.distance_m(b.lat, b.lng, p_lat, p_lng) end as dist,
      coalesce((
        select sum(
          (case when b.subject_name ilike '%' || private.like_escape(term) || '%' then 4 else 0 end) +
          (case when coalesce(b.parent_name, '') ilike '%' || private.like_escape(term) || '%' then 3 else 0 end) +
          (case when coalesce(b.neighborhood, '') ilike '%' || private.like_escape(term) || '%'
                  or coalesce(b.address, '') ilike '%' || private.like_escape(term) || '%'
                  or coalesce(b.city, '') ilike '%' || private.like_escape(term) || '%' then 3 else 0 end) +
          (case when b.category ilike private.like_escape(term) then 2 else 0 end) +
          (case when b.text ilike '%' || private.like_escape(term) || '%' then 1 else 0 end)
        )::int
        from unnest(coalesce(p_terms, '{}')) as term
      ), 0) as term_score,
      case when p_categories is not null and b.category = any (p_categories) then 2 else 0 end as cat_score,
      case when p_area_names is not null and exists (
        select 1 from unnest(p_area_names) a
        where coalesce(b.neighborhood, '') ilike '%' || private.like_escape(a) || '%'
           or coalesce(b.address, '') ilike '%' || private.like_escape(a) || '%'
      ) then true else false end as area_text_match
    from base b
  )
  select s.id, s.rating, s.text, s.created_at, s.author_name, s.subject_name, s.category, s.parent_name,
         s.neighborhood, s.address, s.city, s.dist, (s.term_score + s.cat_score)
  from scored s
  where
    -- area: within the radius, or the neighborhood named in the address
    (p_lat is null or (s.dist is not null and s.dist <= coalesce(p_radius_m, 1500)) or s.area_text_match)
    and (
      case
        when coalesce(array_length(p_terms, 1), 0) > 0 and p_categories is not null then s.term_score > 0 or s.cat_score > 0
        when coalesce(array_length(p_terms, 1), 0) > 0 then s.term_score > 0
        when p_categories is not null then s.cat_score > 0
        else true
      end
    )
  order by (s.term_score + s.cat_score) desc, s.rating desc, s.created_at desc
  limit least(greatest(coalesce(p_limit, 40), 1), 60);
$$;

-- ---------------------------------------------------------------------------
-- Function permissions: nothing is callable by default; grant what the app uses.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;
revoke execute on all functions in schema private from public, anon, authenticated;
revoke usage on schema private from public, anon, authenticated;

grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.complete_signup(text, text, public.display_mode) to authenticated;
grant execute on function public.upsert_subject(text, text, boolean, text, text, text, float8, float8, text, uuid) to authenticated;
grant execute on function public.search_subjects(text) to authenticated;
grant execute on function public.subject_summary(uuid) to authenticated;
grant execute on function public.child_subjects(uuid) to authenticated;
grant execute on function public.map_subjects() to authenticated;
grant execute on function public.take_cards(int, timestamptz, uuid, uuid, uuid[]) to authenticated;
grant execute on function public.create_take(uuid, numeric, text, text[]) to authenticated;
grant execute on function public.react_to_take(uuid, public.reaction_type) to authenticated;
grant execute on function public.report_take(uuid, text) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.ai_candidate_takes(text[], text[], text[], float8, float8, float8, int) to authenticated;

-- RLS policies call private.is_member(); authenticated needs to reach it.
grant usage on schema private to authenticated;
grant execute on function private.is_member() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: take photos (public read, write only into your own folder)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('take-photos', 'take-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "take photos: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'take-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "take photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'take-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
