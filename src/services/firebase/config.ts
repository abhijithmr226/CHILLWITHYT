import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYlHlngMh_AedTe5byZaIOWkI2juGVyKg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chill-with-yt.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chill-with-yt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chill-with-yt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "648361777658",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:648361777658:web:afd97b087a6f431202ac43",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TVLZ224FSE"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe Analytics init for client environment
export const analyticsPromise = typeof window !== 'undefined'
  ? isSupported().then(supported => (supported ? getAnalytics(app) : null))
  : Promise.resolve(null);

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
