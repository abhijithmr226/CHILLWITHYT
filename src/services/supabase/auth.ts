/**
 * Supabase Auth Service
 * Handles real sign up, sign in, sign out, and anonymous guest sessions
 * using Supabase Auth (email/password + Google OAuth)
 */

import { supabase, isSupabaseConfigured } from './client';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
  username: string;
  avatarUrl: string;
  isGuest: boolean;
}

// Generate a guest identity that persists across page refreshes
function getOrCreateGuestId(): string {
  const key = 'chillwithyt_guest_id';
  let guestId = localStorage.getItem(key);
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, guestId);
  }
  return guestId;
}

function getOrCreateGuestName(): string {
  const key = 'chillwithyt_guest_name';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const adjectives = ['Chill', 'Mellow', 'Groovy', 'Smooth', 'Electric', 'Cosmic', 'Midnight', 'Neon', 'Soulful', 'Vibrant'];
  const nouns = ['Listener', 'Chiller', 'Vibe', 'Beat', 'Sound', 'Wave', 'Note', 'Rhythm', 'Melody', 'Groove'];
  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
  localStorage.setItem(key, name);
  return name;
}

export const SupabaseAuthService = {

  // ── Sign Up with Email/Password ─────────────────────────────────────────
  async signUp(email: string, password: string, username: string): Promise<AuthUser> {
    if (!isSupabaseConfigured || !supabase) {
      // Offline fallback
      return {
        id: `local_${Date.now()}`,
        email,
        displayName: username || email.split('@')[0],
        username: username || email.split('@')[0],
        avatarUrl: '',
        isGuest: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username || email.split('@')[0],
          username: username || email.split('@')[0],
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign up failed — no user returned');

    // Create profile row
    await supabase.from('profiles').upsert({
      id: data.user.id,
      username: username || email.split('@')[0],
      display_name: username || email.split('@')[0],
      avatar_url: '',
      bio: '',
    }, { onConflict: 'id' });

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      displayName: username || email.split('@')[0],
      username: username || email.split('@')[0],
      avatarUrl: '',
      isGuest: false,
    };
  },

  // ── Sign In with Email/Password ─────────────────────────────────────────
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        id: `local_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        username: email.split('@')[0],
        avatarUrl: '',
        isGuest: false,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign in failed — no user returned');

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      displayName: profile?.display_name || data.user.user_metadata?.display_name || email.split('@')[0],
      username: profile?.username || data.user.user_metadata?.username || email.split('@')[0],
      avatarUrl: profile?.avatar_url || data.user.user_metadata?.avatar_url || '',
      isGuest: false,
    };
  },

  // ── Google OAuth ─────────────────────────────────────────────────────────
  async signInWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) throw new Error(error.message);
    // After OAuth redirect, getSession will return the user
  },

  // ── Get Current Session ──────────────────────────────────────────────────
  async getSession(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const user = session.user;

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Upsert profile if missing
    if (!profile) {
      await supabase.from('profiles').upsert({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Chiller',
        avatar_url: user.user_metadata?.avatar_url || '',
      }, { onConflict: 'id' });
    }

    return {
      id: user.id,
      email: user.email ?? null,
      displayName: profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Chiller',
      username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      isGuest: false,
    };
  },

  // ── Sign Out ────────────────────────────────────────────────────────────
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
  },

  // ── Guest Mode ──────────────────────────────────────────────────────────
  createGuestUser(): AuthUser {
    return {
      id: getOrCreateGuestId(),
      email: null,
      displayName: getOrCreateGuestName(),
      username: getOrCreateGuestId(),
      avatarUrl: '',
      isGuest: true,
    };
  },

  // ── Forgot Password ─────────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  // ── Update Profile ──────────────────────────────────────────────────────
  async updateProfile(userId: string, updates: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: updates.displayName,
      username: updates.username,
      avatar_url: updates.avatarUrl,
      bio: updates.bio,
    }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  },

  // ── Listen to Auth State Changes ────────────────────────────────────────
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await SupabaseAuthService.getSession();
        callback(user);
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  },
};
