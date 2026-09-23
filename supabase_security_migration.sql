-- =============================================================================
-- ChillWithYT: production security migration
-- Paste this entire file into Supabase Dashboard -> SQL Editor -> New query.
--
-- Prerequisite: client database writes must use Supabase Auth sessions.
-- Firebase IDs alone are not trusted by Supabase RLS.
-- This is safe to run on the schema already in supabase_schema.sql and also
-- works as a clean first-run schema. It does not delete application data.
-- =============================================================================

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Application tables. CREATE IF NOT EXISTS makes this a full bootstrap and
--    a non-destructive migration. Existing data and columns are retained.
-- -----------------------------------------------------------------------------

create table if not exists public.rooms (
  id text primary key default ('room-' || substr(md5(random()::text), 1, 10)),
  name text not null,
  description text not null default '',
  cover_url text not null default '',
  privacy text not null default 'public'
    check (privacy in ('public', 'private', 'invite_only')),
  owner_id text not null,
  owner_name text not null default 'Room Host',
  owner_avatar text not null default '',
  members_count integer not null default 1,
  max_members integer not null default 50,
  playback_mode text not null default 'host_controlled'
    check (playback_mode in ('host_controlled', 'dj_controlled', 'community_voting')),
  current_song jsonb,
  current_position numeric not null default 0,
  is_playing boolean not null default true,
  tags text[] not null default array['Live', 'Chill'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  user_id text not null,
  user_name text not null default 'Listener',
  user_avatar text not null default '',
  message text not null,
  song_ref jsonb,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.room_queue (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  song_id text not null,
  song_metadata jsonb not null default '{}'::jsonb,
  added_by text not null,
  added_by_name text not null default 'DJ',
  added_by_avatar text not null default '',
  position integer not null default 0,
  skip_votes integer not null default 0,
  keep_votes integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id text primary key default ('pl-' || substr(md5(random()::text), 1, 10)),
  name text not null,
  description text not null default '',
  cover_url text not null default '',
  owner_id text not null,
  owner_name text not null default 'User',
  songs_count integer not null default 0,
  total_duration integer not null default 0,
  privacy text not null default 'public'
    check (privacy in ('public', 'private')),
  is_collaborative boolean not null default false,
  songs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  username text unique not null,
  display_name text not null default '',
  avatar_url text not null default '',
  bio text not null default '',
  stats jsonb not null default '{"roomsCreated":0,"playlistsCount":0,"songsPlayed":0}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_items (
  id text primary key,
  title text not null,
  artist text not null,
  artwork text not null,
  duration integer not null default 210,
  source_id text not null,
  region text not null default 'IN',
  section text not null,
  discovery_label text not null default 'Trending',
  discovery_score numeric not null default 0,
  momentum_score numeric not null default 0,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  published_at timestamptz,
  channel_id text not null default '',
  category_id text not null default '10',
  first_seen_at timestamptz not null default now(),
  last_fetched_at timestamptz not null default now(),
  prev_view_count bigint not null default 0,
  age_hours integer not null default 0,
  is_active boolean not null default true,
  fetch_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trending_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_at timestamptz not null default now(),
  region text not null,
  section text not null,
  top_item_id text references public.discovery_items(id),
  top_item_title text,
  item_count integer not null default 0,
  avg_discovery_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.artist_discovery (
  id text primary key,
  name text not null,
  channel_id text not null unique,
  avatar_url text not null default '',
  subscriber_count bigint not null default 0,
  total_views bigint not null default 0,
  video_count integer not null default 0,
  region text not null default 'IN',
  genre text not null default 'Pop',
  is_rising boolean not null default false,
  momentum_score numeric not null default 0,
  discovery_score numeric not null default 0,
  last_upload_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_fetched_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.radio_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id text,
  song_id text not null,
  song_title text,
  song_artist text,
  action text not null check (action in ('play', 'skip', 'replay', 'like', 'complete')),
  listen_duration integer not null default 0,
  context text not null default 'radio',
  genre text,
  region text not null default 'IN',
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_created_at on public.rooms (created_at desc);
create index if not exists idx_messages_room_created on public.messages (room_id, created_at asc);
create index if not exists idx_room_queue_room_position on public.room_queue (room_id, position asc);
create index if not exists idx_playlists_owner on public.playlists (owner_id);
create index if not exists idx_discovery_active_section on public.discovery_items (is_active, section, discovery_score desc);
create index if not exists idx_artist_discovery_active on public.artist_discovery (is_active, momentum_score desc);
create index if not exists idx_radio_sessions_user_created on public.radio_sessions (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Memberships: required for private / invite-only rooms and Realtime access.
-- IDs remain TEXT to work as a non-destructive migration from the existing schema;
-- authenticated Supabase UUIDs are always stored as text.
-- -----------------------------------------------------------------------------

create table if not exists public.room_members (
  room_id text not null references public.rooms(id) on delete cascade,
  user_id text not null,
  role text not null default 'member'
    check (role in ('owner', 'dj', 'member')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists idx_room_members_user_room
  on public.room_members (user_id, room_id);

-- The current client does not send song_metadata. A default keeps the existing
-- queue insert working while the client is upgraded to send the full song object.
alter table public.room_queue
  alter column song_metadata set default '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 2. Helpers. SECURITY DEFINER prevents recursive RLS checks; the functions
-- return only a boolean and always use the caller's auth.uid().
-- -----------------------------------------------------------------------------

create or replace function public.can_access_room(target_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and (
        r.privacy = 'public'
        or r.owner_id = (select auth.uid())::text
        or exists (
          select 1
          from public.room_members rm
          where rm.room_id = r.id
            and rm.user_id = (select auth.uid())::text
        )
      )
  );
$$;

create or replace function public.is_room_owner(target_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_id = (select auth.uid())::text
  );
$$;

revoke all on function public.can_access_room(text) from public;
revoke all on function public.is_room_owner(text) from public;
grant execute on function public.can_access_room(text) to anon, authenticated;
grant execute on function public.is_room_owner(text) to authenticated;

-- Automatically give each newly-created room's owner an owner membership.
create or replace function public.add_room_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (room_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists rooms_add_owner_membership on public.rooms;
create trigger rooms_add_owner_membership
  after insert on public.rooms
  for each row execute function public.add_room_owner_membership();

-- Existing rooms retain their original owner and gain an owner membership.
insert into public.room_members (room_id, user_id, role)
select id, owner_id, 'owner'
from public.rooms
on conflict (room_id, user_id) do update set role = 'owner';

-- Authenticated users may join public rooms through this narrow RPC.
create or replace function public.join_public_room(target_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.rooms
    where id = target_room_id and privacy = 'public'
  ) then
    raise exception 'Room is not public or does not exist';
  end if;

  insert into public.room_members (room_id, user_id, role, last_seen_at)
  values (target_room_id, auth.uid()::text, 'member', now())
  on conflict (room_id, user_id)
  do update set last_seen_at = excluded.last_seen_at;
end;
$$;

revoke all on function public.join_public_room(text) from public;
grant execute on function public.join_public_room(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Remove every old policy on the app tables, including the insecure
--    USING (true) / WITH CHECK (true) policies from the original schema.
-- -----------------------------------------------------------------------------

do $$
declare
  current_policy record;
begin
  for current_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'rooms', 'room_members', 'messages', 'room_queue', 'playlists',
        'profiles', 'discovery_items', 'trending_snapshots',
        'artist_discovery', 'radio_sessions'
      )
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      current_policy.policyname,
      current_policy.tablename
    );
  end loop;
end;
$$;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.room_queue enable row level security;
alter table public.playlists enable row level security;
alter table public.profiles enable row level security;
alter table public.discovery_items enable row level security;
alter table public.trending_snapshots enable row level security;
alter table public.artist_discovery enable row level security;
alter table public.radio_sessions enable row level security;

-- Public data may be read, but only Supabase-authenticated users may mutate it.
grant usage on schema public to anon, authenticated;
grant select on public.rooms, public.messages, public.room_queue,
  public.playlists, public.profiles, public.discovery_items,
  public.trending_snapshots, public.artist_discovery to anon, authenticated;
grant select, insert, update, delete on public.rooms, public.room_members,
  public.messages, public.room_queue, public.playlists, public.profiles,
  public.radio_sessions to authenticated;

-- Rooms
create policy "rooms_are_visible_to_allowed_listeners"
  on public.rooms for select
  using (public.can_access_room(id));

create policy "authenticated_users_create_their_own_rooms"
  on public.rooms for insert to authenticated
  with check (owner_id = (select auth.uid())::text);

create policy "only_room_owners_update_rooms"
  on public.rooms for update to authenticated
  using (public.is_room_owner(id))
  with check (owner_id = (select auth.uid())::text);

create policy "only_room_owners_delete_rooms"
  on public.rooms for delete to authenticated
  using (public.is_room_owner(id));

-- Memberships. Direct role assignment is never allowed from the browser.
create policy "members_read_their_own_membership"
  on public.room_members for select to authenticated
  using (
    user_id = (select auth.uid())::text
    or public.is_room_owner(room_id)
  );

create policy "members_leave_their_own_room"
  on public.room_members for delete to authenticated
  using (
    user_id = (select auth.uid())::text
    and not public.is_room_owner(room_id)
  );

-- Messages
create policy "allowed_listeners_read_room_messages"
  on public.messages for select
  using (public.can_access_room(room_id));

create policy "users_send_messages_as_themselves"
  on public.messages for insert to authenticated
  with check (
    user_id = (select auth.uid())::text
    and public.can_access_room(room_id)
    and char_length(btrim(message)) between 1 and 2000
  );

create policy "users_edit_their_own_messages"
  on public.messages for update to authenticated
  using (user_id = (select auth.uid())::text)
  with check (
    user_id = (select auth.uid())::text
    and char_length(btrim(message)) between 1 and 2000
  );

create policy "users_delete_their_own_messages"
  on public.messages for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- Queue: listeners can add songs; only a room owner may reorder or remove them.
create policy "allowed_listeners_read_room_queue"
  on public.room_queue for select
  using (public.can_access_room(room_id));

create policy "users_add_queue_items_as_themselves"
  on public.room_queue for insert to authenticated
  with check (
    added_by = (select auth.uid())::text
    and public.can_access_room(room_id)
  );

create policy "only_room_owners_update_queue"
  on public.room_queue for update to authenticated
  using (public.is_room_owner(room_id))
  with check (public.is_room_owner(room_id));

create policy "only_room_owners_delete_queue_items"
  on public.room_queue for delete to authenticated
  using (public.is_room_owner(room_id));

-- Playlists
create policy "public_or_owned_playlists_are_visible"
  on public.playlists for select
  using (
    privacy = 'public'
    or owner_id = (select auth.uid())::text
  );

create policy "users_create_playlists_as_themselves"
  on public.playlists for insert to authenticated
  with check (owner_id = (select auth.uid())::text);

create policy "users_update_only_their_playlists"
  on public.playlists for update to authenticated
  using (owner_id = (select auth.uid())::text)
  with check (owner_id = (select auth.uid())::text);

create policy "users_delete_only_their_playlists"
  on public.playlists for delete to authenticated
  using (owner_id = (select auth.uid())::text);

-- Profiles
create policy "profiles_are_publicly_readable"
  on public.profiles for select
  using (true);

create policy "users_create_only_their_profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid())::text);

create policy "users_update_only_their_profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())::text)
  with check (id = (select auth.uid())::text);

-- Discovery data is read-only from the client. Use a server / Edge Function
-- with the secret key for ingestion and scheduled cleanup.
create policy "active_discovery_items_are_public"
  on public.discovery_items for select
  using (is_active = true);

create policy "active_artists_are_public"
  on public.artist_discovery for select
  using (is_active = true);

create policy "trending_snapshots_are_public"
  on public.trending_snapshots for select
  using (true);

-- Listening telemetry must belong to the active Supabase user.
create policy "users_insert_only_their_radio_sessions"
  on public.radio_sessions for insert to authenticated
  with check (user_id = (select auth.uid())::text);

create policy "users_read_only_their_radio_sessions"
  on public.radio_sessions for select to authenticated
  using (user_id = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- 4. Keep profile rows in sync with Supabase Auth. This does not expose auth.users.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data ->> 'username', '[^a-zA-Z0-9_]', '', 'g'), ''),
    nullif(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''),
    'chiller'
  ) || '_' || left(new.id::text, 8);

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id::text,
    left(generated_username, 60),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Chiller'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill profile records for Supabase Auth users who already exist.
insert into public.profiles (id, username, display_name, avatar_url)
select
  u.id::text,
  'chiller_' || left(u.id::text, 8),
  coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, ''), '@', 1), 'Chiller'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
on conflict (id) do nothing;

-- Keep the conventional updated_at fields reliable.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_updated_at on public.rooms;
drop trigger if exists playlists_updated_at on public.playlists;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger rooms_updated_at before update on public.rooms
  for each row execute function public.handle_updated_at();
create trigger playlists_updated_at before update on public.playlists
  for each row execute function public.handle_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Secure Realtime Broadcast + Presence authorization.
-- In the client, set config.private = true when creating the room channel, then
-- disable "Allow public access" under Database -> Realtime -> Settings.
-- -----------------------------------------------------------------------------

drop policy if exists "chillwithyt_realtime_receive" on realtime.messages;
drop policy if exists "chillwithyt_realtime_send" on realtime.messages;

create policy "chillwithyt_realtime_receive"
  on realtime.messages for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1
      from public.rooms r
      where ('room:' || r.id) = realtime.topic()
        and public.can_access_room(r.id)
    )
  );

create policy "chillwithyt_realtime_send"
  on realtime.messages for insert to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1
      from public.rooms r
      where ('room:' || r.id) = realtime.topic()
        and public.can_access_room(r.id)
    )
  );

commit;

-- After this succeeds:
-- 1. In Supabase Auth, enable Email and Google sign-in as needed.
-- 2. Use SupabaseAuthService in the browser before calling SupabaseDbService.
-- 3. Set { config: { private: true, presence: ... } } on room channels.
-- 4. Disable Realtime's "Allow public access" setting in the Supabase dashboard.
