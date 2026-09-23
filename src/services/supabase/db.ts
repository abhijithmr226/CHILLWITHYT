import { supabase, isSupabaseConfigured } from './client';
import { Room, Song, ChatMessage, QueueItem, RoomMember, UserProfile } from '../../types';
import { getDiceBearAvatar } from '../../utils/avatar';

export class SupabaseDbService {
  // 1. Fetch Rooms from Supabase
  public static async fetchRooms(): Promise<Room[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchRooms notice:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        coverUrl: row.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
        privacy: row.privacy || 'public',
        ownerId: row.owner_id,
        ownerName: 'Room Host',
        ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop',
        membersCount: row.max_members || 24,
        maxMembers: row.max_members || 50,
        playbackMode: row.playback_mode || 'host_controlled',
        tags: ['Live', 'Supabase'],
        createdAt: row.created_at,
      }));
    } catch (e) {
      console.warn('Supabase fetchRooms failed:', e);
      return [];
    }
  }

  // 2. Create Room in Supabase
  public static async createRoom(room: Partial<Room>, ownerId: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: room.name,
          description: room.description,
          cover_url: room.coverUrl,
          privacy: room.privacy || 'public',
          max_members: room.maxMembers || 50,
          playback_mode: room.playbackMode || 'host_controlled',
          owner_id: ownerId,
        })
        .select('id')
        .single();

      if (error) {
        console.warn('Supabase createRoom error:', error.message);
        return null;
      }

      return data?.id || null;
    } catch (e) {
      console.warn('Supabase createRoom exception:', e);
      return null;
    }
  }

  // 3. Fetch Messages from Supabase
  public static async fetchMessages(roomId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.warn('Supabase fetchMessages error:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        roomId: row.room_id,
        user: {
          id: row.user_id,
          username: row.user_id.slice(0, 6),
          displayName: `User_${row.user_id.slice(0, 4)}`,
          avatarUrl: getDiceBearAvatar(row.user_id),
        },
        content: row.message,
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        songRef: row.song_ref,
      }));
    } catch {
      return [];
    }
  }

  // 4. Send Message in Supabase
  public static async sendMessage(roomId: string, userId: string, message: string, songRef?: Song): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: userId,
          message,
          song_ref: songRef ? JSON.stringify(songRef) : null,
        });

      return !error;
    } catch {
      return false;
    }
  }

  // 5. Fetch Queue from Supabase
  public static async fetchQueue(roomId: string): Promise<QueueItem[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('room_queue')
        .select('*')
        .eq('room_id', roomId)
        .order('position', { ascending: true });

      if (error) return [];

      return (data || []).map((row: any) => ({
        id: row.id,
        song: row.song_metadata || {
          id: row.song_id,
          title: 'YouTube Track',
          artist: 'Artist',
          source: 'youtube',
          sourceId: row.song_id,
          artwork: `https://img.youtube.com/vi/${row.song_id}/hqdefault.jpg`,
          duration: 200,
        },
        addedBy: {
          id: row.added_by,
          username: 'chiller',
          avatarUrl: getDiceBearAvatar(row.added_by || 'chiller'),
        },
        addedAt: new Date(row.created_at).getTime(),
        votes: {
          skip: row.skip_votes || 0,
          keep: row.keep_votes || 0,
        },
      }));
    } catch {
      return [];
    }
  }

  // 6. Add to Queue in Supabase
  public static async addToQueue(roomId: string, song: Song, userId: string, position: number): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const { error } = await supabase
        .from('room_queue')
        .insert({
          room_id: roomId,
          song_id: song.sourceId || song.id,
          added_by: userId,
          position,
          skip_votes: 0,
          keep_votes: 1,
        });

      return !error;
    } catch {
      return false;
    }
  }

  // 7. Delete Room from Supabase
  public static async deleteRoom(roomId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);
      return !error;
    } catch {
      return false;
    }
  }

  // 8. Delete Playlist from Supabase
  public static async deletePlaylist(playlistId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
      return !error;
    } catch {
      return false;
    }
  }

  // 9. Sync / Upsert Playlist in Supabase
  public static async syncPlaylist(playlist: any): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('playlists').upsert({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        cover_url: playlist.coverUrl || '',
        owner_id: playlist.ownerId || 'guest',
        owner_name: playlist.ownerName || 'User',
        songs_count: playlist.songsCount || playlist.songs?.length || 0,
        total_duration: playlist.totalDuration || 0,
        privacy: playlist.privacy || 'public',
        is_collaborative: playlist.isCollaborative || false,
        songs: playlist.songs || [],
      }, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  // 10. Fetch Playlists from Supabase
  public static async fetchPlaylists(ownerId?: string): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      let query = supabase.from('playlists').select('*').order('created_at', { ascending: false });
      if (ownerId) query = query.eq('owner_id', ownerId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        coverUrl: row.cover_url,
        ownerId: row.owner_id,
        ownerName: row.owner_name,
        songsCount: row.songs_count,
        totalDuration: row.total_duration,
        privacy: row.privacy,
        isCollaborative: row.is_collaborative,
        songs: row.songs || [],
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  }

  // 11. Sync / Upsert User Profile in Supabase
  public static async syncProfile(user: Partial<UserProfile>): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase || !user.id) return false;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        bio: user.bio,
      }, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }
}


