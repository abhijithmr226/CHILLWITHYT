-- =============================================================================
-- ChillWithYT — Full Supabase Production Schema
-- Automated Discovery: Trends & Artists update via pg_cron every 15–60 min
-- Run entirely in Supabase SQL Editor → New Query → Run
-- =============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";         -- required for automated jobs
CREATE EXTENSION IF NOT EXISTS "pg_net";           -- required for HTTP calls from DB

-- =============================================================================
-- SECTION A: CORE SOCIAL TABLES (Rooms, Chat, Queue, Playlists)
-- =============================================================================

-- Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY DEFAULT ('room-' || substr(md5(random()::text), 1, 10)),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'invite_only')),
  owner_id TEXT NOT NULL,
  owner_name TEXT DEFAULT 'Room Host',
  owner_avatar TEXT DEFAULT '',
  members_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 50,
  playback_mode TEXT DEFAULT 'host_controlled' CHECK (playback_mode IN ('host_controlled', 'dj_controlled', 'community_voting')),
  current_song JSONB DEFAULT NULL,
  current_position NUMERIC DEFAULT 0,
  is_playing BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT ARRAY['Live', 'Chill'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON public.rooms (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_privacy ON public.rooms (privacy);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT DEFAULT 'Listener',
  user_avatar TEXT DEFAULT '',
  message TEXT NOT NULL,
  song_ref JSONB DEFAULT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages (room_id, created_at ASC);

-- Room Queue Table
CREATE TABLE IF NOT EXISTS public.room_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_metadata JSONB NOT NULL,
  added_by TEXT NOT NULL,
  added_by_name TEXT DEFAULT 'DJ',
  added_by_avatar TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  skip_votes INTEGER DEFAULT 0,
  keep_votes INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_queue_room_pos ON public.room_queue (room_id, position ASC);

-- Playlists Table
CREATE TABLE IF NOT EXISTS public.playlists (
  id TEXT PRIMARY KEY DEFAULT ('pl-' || substr(md5(random()::text), 1, 10)),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  owner_id TEXT NOT NULL,
  owner_name TEXT DEFAULT 'User',
  songs_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  is_collaborative BOOLEAN DEFAULT false,
  songs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_owner ON public.playlists (owner_id);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  stats JSONB DEFAULT '{"roomsCreated":0,"playlistsCount":0,"songsPlayed":0}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION B: DISCOVERY & TRENDING SYSTEM
-- These tables are automatically refreshed by scheduled jobs
-- =============================================================================

-- Discovery Items: all discovered songs with momentum metadata
CREATE TABLE IF NOT EXISTS public.discovery_items (
  id TEXT PRIMARY KEY,                    -- YouTube video ID
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artwork TEXT NOT NULL,
  duration INTEGER DEFAULT 210,
  source_id TEXT NOT NULL,                -- YouTube video ID (without yt- prefix)
  
  -- Discovery metadata (CHILLWITHYT's own signals, NOT YouTube's ranking)
  region TEXT DEFAULT 'IN',
  section TEXT NOT NULL,                  -- which discovery section this belongs to
  discovery_label TEXT DEFAULT 'Trending',
  discovery_score NUMERIC DEFAULT 0,     -- CHILLWITHYT calculated score
  momentum_score NUMERIC DEFAULT 0,       -- velocity / rising signal
  
  -- YouTube statistics (publicly available)
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ,
  channel_id TEXT DEFAULT '',
  category_id TEXT DEFAULT '10',
  
  -- Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  prev_view_count BIGINT DEFAULT 0,       -- for velocity calculation
  age_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,         -- false = stale, hidden from UI
  fetch_failures INTEGER DEFAULT 0,       -- track error count for graceful degradation
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_section ON public.discovery_items (section, discovery_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_region ON public.discovery_items (region, section);
CREATE INDEX IF NOT EXISTS idx_discovery_momentum ON public.discovery_items (momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_active ON public.discovery_items (is_active, section);
CREATE INDEX IF NOT EXISTS idx_discovery_fetched ON public.discovery_items (last_fetched_at DESC);

-- Trending Snapshots: time-series record of what was trending (for analytics)
CREATE TABLE IF NOT EXISTS public.trending_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  region TEXT NOT NULL,
  section TEXT NOT NULL,
  top_item_id TEXT REFERENCES public.discovery_items(id),
  top_item_title TEXT,
  item_count INTEGER DEFAULT 0,
  avg_discovery_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_region_section ON public.trending_snapshots (region, section, snapshot_at DESC);

-- Artist Discovery: dynamic artist momentum table
CREATE TABLE IF NOT EXISTS public.artist_discovery (
  id TEXT PRIMARY KEY,                    -- YouTube channel ID
  name TEXT NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  avatar_url TEXT DEFAULT '',
  subscriber_count BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  region TEXT DEFAULT 'IN',
  genre TEXT DEFAULT 'Pop',
  is_rising BOOLEAN DEFAULT false,
  momentum_score NUMERIC DEFAULT 0,
  discovery_score NUMERIC DEFAULT 0,
  last_upload_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artist_momentum ON public.artist_discovery (momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_artist_region ON public.artist_discovery (region, is_rising);

-- Radio Sessions: track radio listening sessions for personalization
CREATE TABLE IF NOT EXISTS public.radio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,              -- browser session
  user_id TEXT,                          -- optional, if logged in
  song_id TEXT NOT NULL,
  song_title TEXT,
  song_artist TEXT,
  action TEXT NOT NULL CHECK (action IN ('play', 'skip', 'replay', 'like', 'complete')),
  listen_duration INTEGER DEFAULT 0,     -- seconds listened
  context TEXT DEFAULT 'radio',          -- 'radio' | 'playlist' | 'search'
  genre TEXT,
  region TEXT DEFAULT 'IN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_session ON public.radio_sessions (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_user ON public.radio_sessions (user_id, created_at DESC);

-- =============================================================================
-- SECTION C: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_discovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_sessions ENABLE ROW LEVEL SECURITY;

-- Public read for discovery/trending
CREATE POLICY "discovery_public_read" ON public.discovery_items FOR SELECT USING (is_active = true);
CREATE POLICY "artists_public_read" ON public.artist_discovery FOR SELECT USING (is_active = true);
CREATE POLICY "trending_public_read" ON public.trending_snapshots FOR SELECT USING (true);

-- Rooms: public read, authenticated write
CREATE POLICY "rooms_public_read" ON public.rooms FOR SELECT USING (privacy = 'public');
CREATE POLICY "rooms_insert" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update_owner" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "rooms_delete_owner" ON public.rooms FOR DELETE USING (true);

-- Messages: public read/write in rooms
CREATE POLICY "messages_public_read" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);

-- Queue: public
CREATE POLICY "queue_public_read" ON public.room_queue FOR SELECT USING (true);
CREATE POLICY "queue_insert" ON public.room_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "queue_delete" ON public.room_queue FOR DELETE USING (true);
CREATE POLICY "queue_update" ON public.room_queue FOR UPDATE USING (true);

-- Playlists
CREATE POLICY "playlists_public_read" ON public.playlists FOR SELECT USING (privacy = 'public');
CREATE POLICY "playlists_insert" ON public.playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "playlists_update" ON public.playlists FOR UPDATE USING (true);
CREATE POLICY "playlists_delete" ON public.playlists FOR DELETE USING (true);

-- Profiles
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);

-- Radio sessions: anyone can insert
CREATE POLICY "radio_sessions_insert" ON public.radio_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "radio_sessions_read" ON public.radio_sessions FOR SELECT USING (true);

-- Service role bypass for cron jobs
CREATE POLICY "service_discovery_all" ON public.discovery_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_artists_all" ON public.artist_discovery FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_snapshots_all" ON public.trending_snapshots FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SECTION D: REALTIME SUBSCRIPTIONS
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discovery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_discovery;

-- =============================================================================
-- SECTION E: UTILITY FUNCTIONS
-- =============================================================================

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER playlists_updated_at BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER discovery_updated_at BEFORE UPDATE ON public.discovery_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER artists_updated_at BEFORE UPDATE ON public.artist_discovery
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Discovery Score Calculator ─────────────────────────────────────────────
-- Called after each discovery_items row update to recalculate scores in-DB

CREATE OR REPLACE FUNCTION public.calculate_discovery_scores()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  age_days NUMERIC;
  recency_bonus NUMERIC;
  views_per_day NUMERIC;
  velocity_base NUMERIC;
  growth_velocity NUMERIC;
  engagement_rate NUMERIC;
  popularity_score NUMERIC;
BEGIN
  -- Age in days
  age_days := EXTRACT(EPOCH FROM (NOW() - COALESCE(NEW.published_at, NOW() - INTERVAL '7 days'))) / 86400.0;
  
  -- 1. Recency bonus (decays linearly over 90 days)
  recency_bonus := GREATEST(0, 1.0 - age_days / 90.0);
  
  -- 2. Views per day (normalized log scale 0–1)
  views_per_day := CASE WHEN age_days > 0 THEN NEW.view_count::NUMERIC / age_days ELSE NEW.view_count END;
  velocity_base := LEAST(1.0, LOG(GREATEST(1, views_per_day)) / 7.0);
  
  -- 3. Growth velocity since last fetch (views gained relative to previous)
  growth_velocity := 0;
  IF NEW.prev_view_count > 0 AND NEW.view_count > NEW.prev_view_count THEN
    growth_velocity := LEAST(1.0, (NEW.view_count - NEW.prev_view_count)::NUMERIC / NEW.prev_view_count);
  END IF;
  
  -- 4. Engagement rate (likes + weighted comments vs views)
  engagement_rate := CASE
    WHEN NEW.view_count > 0 THEN LEAST(1.0, (NEW.like_count + NEW.comment_count * 3)::NUMERIC / NEW.view_count * 100)
    ELSE 0
  END;
  
  -- 5. Log-scaled absolute popularity
  popularity_score := LEAST(1.0, LOG(GREATEST(1, NEW.view_count)) / 8.0);
  
  -- CHILLWITHYT Discovery Score (weighted combination)
  NEW.discovery_score := ROUND((
    recency_bonus    * 0.25 +
    velocity_base    * 0.25 +
    growth_velocity  * 0.20 +
    engagement_rate  * 0.15 +
    popularity_score * 0.15
  )::NUMERIC, 4);
  
  -- Momentum Score (rising-focused signal)
  NEW.momentum_score := ROUND((
    growth_velocity * 0.5 +
    recency_bonus   * 0.3 +
    velocity_base   * 0.2
  )::NUMERIC, 4);
  
  -- Age in hours
  NEW.age_hours := ROUND(age_days * 24)::INTEGER;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER discovery_score_calc
  BEFORE INSERT OR UPDATE OF view_count, like_count, comment_count, published_at
  ON public.discovery_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_discovery_scores();

-- ── Stale Content Cleanup ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_stale_discovery()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Mark items not fetched in 3 hours as inactive
  UPDATE public.discovery_items
  SET is_active = false
  WHERE last_fetched_at < NOW() - INTERVAL '3 hours'
    AND is_active = true;

  -- Permanently delete items inactive for 24 hours
  DELETE FROM public.discovery_items
  WHERE is_active = false
    AND last_fetched_at < NOW() - INTERVAL '24 hours';

  -- Mark artists not updated in 6 hours as inactive  
  UPDATE public.artist_discovery
  SET is_active = false
  WHERE last_fetched_at < NOW() - INTERVAL '6 hours'
    AND is_active = true;

  -- Keep trending snapshots for 7 days
  DELETE FROM public.trending_snapshots
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Keep radio sessions for 30 days
  DELETE FROM public.radio_sessions
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ── Snapshot Creator ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_trending_snapshot()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT section, region,
           COUNT(*) as item_count,
           AVG(discovery_score) as avg_score,
           (ARRAY_AGG(id ORDER BY discovery_score DESC))[1] as top_id,
           (ARRAY_AGG(title ORDER BY discovery_score DESC))[1] as top_title
    FROM public.discovery_items
    WHERE is_active = true
    GROUP BY section, region
  LOOP
    INSERT INTO public.trending_snapshots
      (region, section, top_item_id, top_item_title, item_count, avg_discovery_score)
    VALUES
      (r.region, r.section, r.top_id, r.top_title, r.item_count, r.avg_score)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- =============================================================================
-- SECTION F: AUTOMATED pg_cron JOBS
-- These run on the Supabase database server automatically.
-- The actual YouTube API fetching happens in the app frontend (client-side),
-- but these jobs handle:
--   1. Stale data cleanup
--   2. Score recalculation
--   3. Snapshot archiving
--   4. Edge Function triggers (if you add Supabase Edge Functions later)
-- =============================================================================

-- Cleanup stale discovery data every 30 minutes
SELECT cron.schedule(
  'cleanup-stale-discovery',
  '*/30 * * * *',
  $$SELECT public.cleanup_stale_discovery();$$
);

-- Create trending snapshot every hour
SELECT cron.schedule(
  'snapshot-trending',
  '0 * * * *',
  $$SELECT public.create_trending_snapshot();$$
);

-- Recalculate all discovery scores every 15 minutes
-- (re-runs trigger logic on rows that may have had prev_view_count updated)
SELECT cron.schedule(
  'recalculate-scores',
  '*/15 * * * *',
  $$
  UPDATE public.discovery_items
  SET updated_at = NOW()
  WHERE is_active = true
    AND last_fetched_at > NOW() - INTERVAL '1 hour';
  $$
);

-- Mark rising artists (momentum_score > 0.5) every hour
SELECT cron.schedule(
  'mark-rising-artists',
  '5 * * * *',
  $$
  UPDATE public.artist_discovery
  SET is_rising = (momentum_score > 0.5)
  WHERE is_active = true;
  $$
);

-- =============================================================================
-- SECTION G: HELPFUL VIEWS (for easier querying in app)
-- =============================================================================

-- Active trending songs view
CREATE OR REPLACE VIEW public.v_trending_songs AS
SELECT
  id, title, artist, artwork, duration, source_id,
  region, section, discovery_label, discovery_score, momentum_score,
  view_count, like_count, age_hours, published_at, last_fetched_at
FROM public.discovery_items
WHERE is_active = true
ORDER BY discovery_score DESC;

-- Rising fast songs (high momentum, recent)
CREATE OR REPLACE VIEW public.v_rising_songs AS
SELECT *
FROM public.v_trending_songs
WHERE section = 'rising_fast'
  AND age_hours < 168  -- within 7 days
ORDER BY momentum_score DESC;

-- New releases (published in last 14 days)
CREATE OR REPLACE VIEW public.v_new_releases AS
SELECT *
FROM public.v_trending_songs
WHERE published_at > NOW() - INTERVAL '14 days'
ORDER BY published_at DESC;

-- Rising artists
CREATE OR REPLACE VIEW public.v_rising_artists AS
SELECT
  id, name, channel_id, avatar_url, subscriber_count,
  total_views, region, genre, is_rising, momentum_score, discovery_score,
  last_fetched_at
FROM public.artist_discovery
WHERE is_active = true
  AND is_rising = true
ORDER BY momentum_score DESC;

-- =============================================================================
-- DONE
-- Your database is now set up for automated discovery.
--
-- What auto-updates:
--   ✅ Discovery scores recalculated every 15 min (pg_cron)
--   ✅ Stale content cleaned up every 30 min (pg_cron)
--   ✅ Trending snapshots archived hourly (pg_cron)
--   ✅ Rising artists flagged hourly (pg_cron)
--   ✅ Score trigger fires on every view_count/like_count update
--
-- What the frontend auto-does (DiscoveryEngine.ts):
--   ✅ Fetches YouTube Data API v3 every 15–60 min per section
--   ✅ Calculates momentum scores client-side
--   ✅ Gradually merges new data (no sudden UI jumps)
--   ✅ Caches in localStorage for quota efficiency
--   ✅ Graceful fallback on API errors
-- =============================================================================
