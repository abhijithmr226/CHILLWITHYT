-- ==============================================================================
-- CHILLWITHYT - FINAL PRODUCTION SCHEMA & SAFE MIGRATION
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- Works on both fresh databases and databases with existing tables.

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. PROFILES (Users)
-- ==============================================================================
create table if not exists public.profiles (
  id text primary key,
  username text,
  display_name text default 'User',
  avatar_url text,
  bio text default '',
  preferred_genres text[] default '{}',
  preferred_languages text[] default '{}',
  favorite_artists text[] default '{}',
  music_preferences jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Ensure all profile columns exist if table already existed
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text default 'User';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists preferred_genres text[] default '{}';
alter table public.profiles add column if not exists preferred_languages text[] default '{}';
alter table public.profiles add column if not exists favorite_artists text[] default '{}';
alter table public.profiles add column if not exists music_preferences jsonb default '{}'::jsonb;

-- ==============================================================================
-- 2. ROOMS (Collaborative Realtime Listening Rooms)
-- ==============================================================================
create table if not exists public.rooms (
  id text primary key,
  name text default 'Music Room',
  title text default 'Music Room',
  description text default '',
  cover_url text default '',
  playlist_covers text[] default '{}',
  owner_id text default 'guest',
  host_id text default 'guest',
  privacy text default 'public',
  is_private boolean default false,
  passcode text,
  max_members integer default 50,
  max_participants integer default 50,
  playback_mode text default 'host_controlled',
  dj_mode boolean default false,
  voting_system boolean default true,
  auto_add_songs boolean default true,
  is_playing boolean default false,
  current_song jsonb,
  current_playback_position double precision default 0,
  playback_started_at bigint default 0, -- UTC epoch timestamp in milliseconds for exact sync
  genres text[] default '{}',
  languages text[] default '{}',
  target_artists text[] default '{}',
  tags text[] default '{}',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Safe column additions if public.rooms already existed from older migrations
alter table public.rooms add column if not exists name text default 'Music Room';
alter table public.rooms add column if not exists title text default 'Music Room';
alter table public.rooms add column if not exists description text default '';
alter table public.rooms add column if not exists cover_url text default '';
alter table public.rooms add column if not exists playlist_covers text[] default '{}';
alter table public.rooms add column if not exists owner_id text default 'guest';
alter table public.rooms add column if not exists host_id text default 'guest';
alter table public.rooms add column if not exists privacy text default 'public';
alter table public.rooms add column if not exists is_private boolean default false;
alter table public.rooms add column if not exists passcode text;
alter table public.rooms add column if not exists max_members integer default 50;
alter table public.rooms add column if not exists max_participants integer default 50;
alter table public.rooms add column if not exists playback_mode text default 'host_controlled';
alter table public.rooms add column if not exists dj_mode boolean default false;
alter table public.rooms add column if not exists voting_system boolean default true;
alter table public.rooms add column if not exists auto_add_songs boolean default true;
alter table public.rooms add column if not exists is_playing boolean default false;
alter table public.rooms add column if not exists current_song jsonb;
alter table public.rooms add column if not exists current_playback_position double precision default 0;
alter table public.rooms add column if not exists playback_started_at bigint default 0;
alter table public.rooms add column if not exists genres text[] default '{}';
alter table public.rooms add column if not exists languages text[] default '{}';
alter table public.rooms add column if not exists target_artists text[] default '{}';
alter table public.rooms add column if not exists tags text[] default '{}';

-- Synchronize alias fields so queries using either owner_id or host_id, name or title succeed
update public.rooms set owner_id = coalesce(owner_id, host_id, 'guest') where owner_id is null;
update public.rooms set host_id = coalesce(host_id, owner_id, 'guest') where host_id is null;
update public.rooms set name = coalesce(name, title, 'Music Room') where name is null;
update public.rooms set title = coalesce(title, name, 'Music Room') where title is null;

-- ==============================================================================
-- 3. ROOM MEMBERS
-- ==============================================================================
create table if not exists public.room_members (
  id text primary key default ('mem-' || gen_random_uuid()::text),
  room_id text references public.rooms(id) on delete cascade not null,
  user_id text not null,
  role text default 'listener',
  user_metadata jsonb default '{}'::jsonb,
  joined_at timestamptz default timezone('utc'::text, now()) not null,
  last_ping_at timestamptz default timezone('utc'::text, now()) not null,
  unique (room_id, user_id)
);

-- ==============================================================================
-- 4. ROOM QUEUE
-- ==============================================================================
create table if not exists public.room_queue (
  id text primary key default ('rq-' || gen_random_uuid()::text),
  room_id text references public.rooms(id) on delete cascade not null,
  song_id text not null,
  song_metadata jsonb default '{}'::jsonb,
  added_by text not null default 'user',
  position integer not null default 0,
  skip_votes integer default 0,
  keep_votes integer default 1,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.room_queue add column if not exists song_metadata jsonb default '{}'::jsonb;
alter table public.room_queue add column if not exists skip_votes integer default 0;
alter table public.room_queue add column if not exists keep_votes integer default 1;

-- ==============================================================================
-- 5. ROOM CHAT MESSAGES
-- ==============================================================================
create table if not exists public.messages (
  id text primary key default ('msg-' || gen_random_uuid()::text),
  room_id text references public.rooms(id) on delete cascade not null,
  user_id text not null,
  user_name text default 'User',
  user_avatar text default '',
  message text not null,
  message_type text default 'text',
  song_ref jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.messages add column if not exists user_name text default 'User';
alter table public.messages add column if not exists user_avatar text default '';
alter table public.messages add column if not exists message_type text default 'text';
alter table public.messages add column if not exists song_ref jsonb;

-- ==============================================================================
-- 6. ROOM REACTIONS (Ephemeral or Tracked Live Reactions)
-- ==============================================================================
create table if not exists public.reactions (
  id text primary key default ('rx-' || gen_random_uuid()::text),
  room_id text references public.rooms(id) on delete cascade not null,
  user_id text not null,
  reaction text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 7. PLAYLISTS
-- ==============================================================================
create table if not exists public.playlists (
  id text primary key,
  name text default 'My Playlist',
  title text default 'My Playlist',
  description text default '',
  owner_id text not null default 'guest',
  owner_name text default 'User',
  cover_url text default '',
  cover_image text default '',
  genres text[] default '{}',
  is_collaborative boolean default false,
  privacy text default 'public',
  is_public boolean default true,
  songs jsonb default '[]'::jsonb,
  songs_count integer default 0,
  total_duration integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.playlists add column if not exists name text default 'My Playlist';
alter table public.playlists add column if not exists title text default 'My Playlist';
alter table public.playlists add column if not exists cover_url text default '';
alter table public.playlists add column if not exists cover_image text default '';
alter table public.playlists add column if not exists owner_name text default 'User';
alter table public.playlists add column if not exists songs_count integer default 0;
alter table public.playlists add column if not exists total_duration integer default 0;
alter table public.playlists add column if not exists privacy text default 'public';
alter table public.playlists add column if not exists is_collaborative boolean default false;
alter table public.playlists add column if not exists songs jsonb default '[]'::jsonb;

-- ==============================================================================
-- 8. LIKES & LISTENING HISTORY
-- ==============================================================================
create table if not exists public.likes (
  id text primary key default ('like-' || gen_random_uuid()::text),
  user_id text not null,
  song_id text not null,
  song_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, song_id)
);

create table if not exists public.listening_history (
  id text primary key default ('hist-' || gen_random_uuid()::text),
  user_id text not null,
  song_id text not null,
  song_metadata jsonb default '{}'::jsonb,
  played_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 9. PERFORMANCE INDEXES
-- ==============================================================================
create index if not exists idx_rooms_owner_id on public.rooms(owner_id);
create index if not exists idx_rooms_host_id on public.rooms(host_id);
create index if not exists idx_rooms_created_at on public.rooms(created_at desc);
create index if not exists idx_room_members_room on public.room_members(room_id);
create index if not exists idx_room_members_user on public.room_members(user_id);
create index if not exists idx_room_queue_room on public.room_queue(room_id, position asc);
create index if not exists idx_messages_room on public.messages(room_id, created_at desc);
create index if not exists idx_reactions_room on public.reactions(room_id, created_at desc);
create index if not exists idx_playlists_owner on public.playlists(owner_id);
create index if not exists idx_likes_user on public.likes(user_id);
create index if not exists idx_history_user on public.listening_history(user_id, played_at desc);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_queue enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.playlists enable row level security;
alter table public.likes enable row level security;
alter table public.listening_history enable row level security;

-- Profiles: Publicly readable and editable
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Profiles are insertable and editable" on public.profiles;
create policy "Profiles are insertable and editable" on public.profiles for all using (true) with check (true);

-- Rooms: Publicly viewable and updatable
drop policy if exists "Rooms are publicly viewable" on public.rooms;
create policy "Rooms are publicly viewable" on public.rooms for select using (true);

drop policy if exists "Rooms can be created or modified" on public.rooms;
create policy "Rooms can be created or modified" on public.rooms for all using (true) with check (true);

-- Room Members: Open for real-time join/leave tracking
drop policy if exists "Room members open access" on public.room_members;
create policy "Room members open access" on public.room_members for all using (true) with check (true);

-- Queue & Messages & Reactions: Open within room context
drop policy if exists "Room queue open access" on public.room_queue;
create policy "Room queue open access" on public.room_queue for all using (true) with check (true);

drop policy if exists "Messages open access" on public.messages;
create policy "Messages open access" on public.messages for all using (true) with check (true);

drop policy if exists "Reactions open access" on public.reactions;
create policy "Reactions open access" on public.reactions for all using (true) with check (true);

-- Playlists, Likes & History
drop policy if exists "Playlists open access" on public.playlists;
create policy "Playlists open access" on public.playlists for all using (true) with check (true);

drop policy if exists "Likes open access" on public.likes;
create policy "Likes open access" on public.likes for all using (true) with check (true);

drop policy if exists "History open access" on public.listening_history;
create policy "History open access" on public.listening_history for all using (true) with check (true);

-- ==============================================================================
-- 11. REALTIME SUBSCRIPTIONS
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Safely add tables to supabase_realtime publication without throwing if already present
do $$
begin
  execute 'alter publication supabase_realtime add table public.rooms';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.messages';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.room_queue';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.reactions';
exception when duplicate_object then null;
end $$;
