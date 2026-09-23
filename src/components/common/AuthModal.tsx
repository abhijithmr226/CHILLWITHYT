import React, { useState, useEffect } from 'react';
import { useStore, DEFAULT_USER } from '../../store/useStore';
import { FirebaseAuthService } from '../../services/firebase/auth';
import {
  X, LogIn, Mail, Lock, User, Eye, EyeOff, UserCircle2,
  AlertCircle, CheckCircle, Loader2, KeyRound
} from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC = () => {
  const [state, store] = useStore();
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form on view change
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  }, [view]);

  if (!state.isAuthModalOpen) return null;

  const close = () => store.setState({ isAuthModalOpen: false });

  // ── Apply auth user to store ──────────────────────────────────────────
  const applyUser = (authUser: { id: string; email: string | null; displayName: string; username: string; avatarUrl: string; isGuest?: boolean }) => {
    store.setState({
      currentUser: {
        ...DEFAULT_USER,
        id: authUser.id,
        username: authUser.username,
        displayName: authUser.displayName,
        avatarUrl: authUser.avatarUrl || DEFAULT_USER.avatarUrl,
        email: authUser.email || '',
      },
      isAuthenticated: !authUser.isGuest,
    });
    close();
  };

  // ── Email / Password Auth ─────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'signup') {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const user = await FirebaseAuthService.signUpWithEmail(email, password, username.trim());
        applyUser(user);
        return;
      }

      if (view === 'forgot') {
        await FirebaseAuthService.forgotPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        return;
      }

      // Sign in
      const user = await FirebaseAuthService.signInWithEmail(email, password);
      applyUser(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth Popup (Firebase) ─────────────────────────────────────
  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const user = await FirebaseAuthService.signInWithGoogle();
      applyUser(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      if (msg !== 'Sign-in cancelled') {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Guest Mode ────────────────────────────────────────────────────────
  const handleGuest = () => {
    const guest = FirebaseAuthService.createGuestUser();
    store.setState({
      currentUser: {
        ...DEFAULT_USER,
        id: guest.id,
        username: guest.username,
        displayName: guest.displayName,
        avatarUrl: DEFAULT_USER.avatarUrl,
      },
      isAuthenticated: false,
    });
    close();
  };

  const title = view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Reset Password' : 'Welcome Back';
  const submitLabel = view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Send Reset Email' : 'Sign In';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={close}
    >
      <div
        className="w-full max-w-md bg-[#181818] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#272727]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,0,0,0.35)] shrink-0">
              <img src="/icon.png" alt="ChillWithYT Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-[11px] text-[#717171]">ChillWithYT — Your Music, Your World</p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-[#717171] hover:text-white hover:bg-[#272727] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Error / Success banners */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Google Sign-In — only on signin/signup */}
          {view !== 'forgot' && (
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#272727] hover:bg-[#323232] border border-[#383838] text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FF0000]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-6.1z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
            </button>
          )}

          {view !== 'forgot' && (
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[#272727]" />
              <span className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">or</span>
              <div className="flex-1 h-px bg-[#272727]" />
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {view === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#2A2A2A] focus-within:border-[#FF0000] transition">
                  <User className="w-4 h-4 text-[#555] shrink-0" />
                  <input
                    type="text"
                    required={view === 'signup'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="chillmaster99"
                    className="bg-transparent text-sm text-white w-full focus:outline-none placeholder-[#555]"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#2A2A2A] focus-within:border-[#FF0000] transition">
                <Mail className="w-4 h-4 text-[#555] shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-transparent text-sm text-white w-full focus:outline-none placeholder-[#555]"
                  autoComplete="email"
                />
              </div>
            </div>

            {view !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider">
                    Password
                  </label>
                  {view === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-[11px] text-[#FF0000] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#2A2A2A] focus-within:border-[#FF0000] transition">
                  <Lock className="w-4 h-4 text-[#555] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-sm text-white w-full focus:outline-none placeholder-[#555]"
                    autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-[#555] hover:text-[#AAAAAA] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#0F0F0F] border transition ${
                  confirmPassword && confirmPassword !== password ? 'border-red-500/60' : 'border-[#2A2A2A] focus-within:border-[#FF0000]'
                }`}>
                  <KeyRound className="w-4 h-4 text-[#555] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-sm text-white w-full focus:outline-none placeholder-[#555]"
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[10px] text-red-400 mt-1">Passwords don't match</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (view === 'signup' && password !== confirmPassword)}
              className="w-full py-3 bg-[#FF0000] hover:bg-[#CC0000] disabled:bg-[#992222] text-white text-sm font-bold rounded-xl transition shadow-[0_0_16px_rgba(255,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Processing…' : submitLabel}
            </button>
          </form>

          {/* Guest Mode */}
          {view !== 'forgot' && (
            <button
              onClick={handleGuest}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-[#212121] border border-[#2A2A2A] hover:border-[#383838] text-sm text-[#AAAAAA] hover:text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              <UserCircle2 className="w-4 h-4" />
              Continue as Guest
            </button>
          )}

          {/* View toggle */}
          <div className="text-center text-xs text-[#717171] pt-1">
            {view === 'signin' && (
              <>
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="text-[#FF0000] font-semibold hover:underline">
                  Sign Up
                </button>
              </>
            )}
            {view === 'signup' && (
              <>
                Already have an account?{' '}
                <button onClick={() => setView('signin')} className="text-[#FF0000] font-semibold hover:underline">
                  Sign In
                </button>
              </>
            )}
            {view === 'forgot' && (
              <>
                Remembered it?{' '}
                <button onClick={() => setView('signin')} className="text-[#FF0000] font-semibold hover:underline">
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
