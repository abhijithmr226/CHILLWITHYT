import { Song, Playlist } from '../../types';

export interface SearchFilterOptions {
  type?: 'all' | 'songs' | 'artists' | 'albums' | 'playlists' | 'rooms';
  limit?: number;
}

export interface SearchResults {
  songs: Song[];
  artists: { id: string; name: string; avatar: string; monthlyListeners: string }[];
  albums: { id: string; title: string; artist: string; artwork: string; year: string }[];
  playlists: Playlist[];
}

export interface MusicProvider {
  name: string;
  search(query: string, options?: SearchFilterOptions): Promise<SearchResults>;
  getSong(id: string): Promise<Song | null>;
  getTrendingSongs(): Promise<Song[]>;
  getRecommendedSongs(seedSongId?: string): Promise<Song[]>;
  getPlaylist(id: string): Promise<Playlist | null>;
  getPlaylists(): Promise<Playlist[]>;
}
