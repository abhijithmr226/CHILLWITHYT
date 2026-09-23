/**
 * Firebase Auth Service
 * Full Firebase Authentication for Google Sign-In, Email/Password, and Guest Sessions
 * Automatically mirrors authenticated profiles to the Supabase database.
 */

import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  subscribeToAuthChanges,
} from './config';
import { sendPasswordResetEmail, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { getDiceBearAvatar } from '../../utils/avatar';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
  username: string;
  avatarUrl: string;
  isGuest: boolean;
}

// Persistent Guest Identity for zero-barrier sessions
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

function mapFirebaseUser(user: FirebaseUser): AuthUser {
  const emailName = user.email ? user.email.split('@')[0] : 'chiller';
  const displayName = user.displayName || emailName;
  const username = (user.displayName ? user.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') : emailName) || 'user';
  const avatarUrl = user.photoURL || getDiceBearAvatar(username || displayName);

  // Mirror to Supabase profiles table in background
  if (isSupabaseConfigured && supabase) {
    Promise.resolve(
      supabase.from('profiles').upsert({
        id: user.uid,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
      }, { onConflict: 'id' })
    ).catch(() => {});
  }

  return {
    id: user.uid,
    email: user.email ?? null,
    displayName,
    username,
    avatarUrl,
    isGuest: false,
  };
}

export const FirebaseAuthService = {
  // ── 1. Google OAuth Popup ───────────────────────────────────────────────
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const user = await loginWithGoogle();
      return mapFirebaseUser(user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      }
      throw new Error(err.message || 'Google Sign-In failed');
    }
  },

  // ── 2. Email & Password Sign In ─────────────────────────────────────────
  async signInWithEmail(email: string, pass: string): Promise<AuthUser> {
    try {
      const user = await loginWithEmail(email, pass);
      return mapFirebaseUser(user);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Incorrect email or password. Please check your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please reset your password or try again later.');
      }
      throw new Error(err.message || 'Sign in failed');
    }
  },

  // ── 3. Email & Password Sign Up ─────────────────────────────────────────
  async signUpWithEmail(email: string, pass: string, username: string): Promise<AuthUser> {
    try {
      const user = await registerWithEmail(email, pass, username);
      return mapFirebaseUser(user);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Try signing in instead.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      throw new Error(err.message || 'Registration failed');
    }
  },

  // ── 4. Forgot Password ──────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      }
      throw new Error(err.message || 'Failed to send reset email');
    }
  },

  // ── 5. Sign Out ─────────────────────────────────────────────────────────
  async signOut(): Promise<void> {
    await logoutUser();
  },

  // ── 6. Guest Mode ───────────────────────────────────────────────────────
  createGuestUser(): AuthUser {
    const guestId = getOrCreateGuestId();
    const guestName = getOrCreateGuestName();
    return {
      id: guestId,
      email: null,
      displayName: guestName,
      username: guestId,
      avatarUrl: getDiceBearAvatar(guestId),
      isGuest: true,
    };
  },

  // ── 7. Get Current Session ──────────────────────────────────────────────
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? mapFirebaseUser(user) : null;
  },

  // ── 8. Update Profile ───────────────────────────────────────────────────
  async updateProfile(updates: { displayName?: string; avatarUrl?: string }): Promise<void> {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.avatarUrl,
      });
    }

    if (isSupabaseConfigured && supabase && auth.currentUser) {
      await supabase.from('profiles').upsert({
        id: auth.currentUser.uid,
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      }, { onConflict: 'id' });
    }
  },

  // ── 9. Subscribe to Auth State Changes ──────────────────────────────────
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        callback(mapFirebaseUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  },
};
