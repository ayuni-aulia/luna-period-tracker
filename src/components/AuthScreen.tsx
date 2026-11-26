import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { BackgroundBlobs, LotusEmblem } from './Illustrations';

interface AuthScreenProps {
  unverifiedUser: User | null;
  onUserVerified: () => Promise<void>;
}

function mapAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email & Password sign-in is not enabled yet in Firebase Authentication. Enable it under Authentication -> Sign-in method -> Email/Password in your Firebase Console, or sign in with Google below.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please use a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed before completing.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return fallback || 'Authentication failed. Please try again.';
  }
}

export function AuthScreen({ unverifiedUser, onUserVerified }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await sendEmailVerification(cred.user);
        setInfoMsg('Verification email sent. Please check your inbox.');
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setErrorMsg(mapAuthError(code, err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setErrorMsg(mapAuthError(code, err instanceof Error ? err.message : ''));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setInfoMsg('A fresh verification link has been sent to your email.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await onUserVerified();
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        setErrorMsg('Your email is not verified yet. Please click the link in your inbox first.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not refresh verification status.');
    } finally {
      setLoading(false);
    }
  };

  if (unverifiedUser) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <BackgroundBlobs />
        <div className="w-full max-w-[420px] rounded-2xl bg-white/92 backdrop-blur-md border border-white/90 p-6 sm:p-7 shadow-[0_16px_40px_-14px_rgba(236,72,153,0.22)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5E7E] to-[#EC4899] text-white shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)]">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-[#2D2A2E]">
            Verify your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6E676B]">
            We sent a verification link to{' '}
            <span className="font-medium text-[#2D2A2E]">{unverifiedUser.email}</span>. Verify
            your address to keep your cycle records private and synced.
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 text-sm text-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mt-4 rounded-xl bg-[#FDF2F8] border border-[#FBCFE8] px-3.5 py-2.5 text-sm text-[#BE185D]">
              {infoMsg}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleCheckVerified}
              disabled={loading}
              className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.5)] transition-all duration-150 hover:brightness-105 active:scale-[0.96] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>I&apos;ve verified my email</span>
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="min-h-[44px] w-full rounded-xl border border-[#FBCFE8] bg-white px-4 py-2.5 text-sm font-medium text-[#2D2A2E] transition-all duration-150 hover:bg-[#FDF2F8] active:scale-[0.96] disabled:opacity-60 whitespace-nowrap"
            >
              Resend verification link
            </button>

            <button
              type="button"
              onClick={() => void signOut(auth)}
              className="min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-medium text-[#6E676B] transition-colors hover:text-[#2D2A2E] whitespace-nowrap"
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <BackgroundBlobs />
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-6px_rgba(236,72,153,0.5)]"
            style={{
              background: 'linear-gradient(135deg, #FF5E7E 0%, #FF8E6E 50%, #A855F7 100%)',
            }}
          >
            <LotusEmblem className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#2D2A2E]">Luna</h1>
          <p className="mt-1 text-sm text-[#6E676B]">
            Vibrant, private period &amp; cycle tracking
          </p>
        </div>

        <div className="rounded-2xl bg-white/92 backdrop-blur-md border border-white/90 p-6 sm:p-7 shadow-[0_16px_40px_-14px_rgba(168,85,247,0.2)]">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#FFF0F5]/80 p-1 border border-[#FCE7F3]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#F43F5E] to-[#EC4899] text-white shadow-[0_4px_12px_-3px_rgba(236,72,153,0.45)]'
                  : 'text-[#6E676B] hover:text-[#2D2A2E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#F43F5E] to-[#EC4899] text-white shadow-[0_4px_12px_-3px_rgba(236,72,153,0.45)]'
                  : 'text-[#6E676B] hover:text-[#2D2A2E]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="mt-5 space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-[#2D2A2E]">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white px-3.5 py-2.5 text-sm text-[#2D2A2E] placeholder:text-[#A59D9F] focus:border-[#EC4899] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-[#2D2A2E]">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full min-h-[44px] rounded-xl border border-[#FBCFE8] bg-white pl-3.5 pr-11 py-2.5 text-sm text-[#2D2A2E] placeholder:text-[#A59D9F] focus:border-[#EC4899] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#6E676B] hover:text-[#BE185D]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 text-sm leading-relaxed text-[#991B1B]"
              >
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="rounded-xl bg-[#FDF2F8] border border-[#FBCFE8] px-3.5 py-2.5 text-sm text-[#BE185D]">
                {infoMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[#F43F5E] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.52)] transition-all duration-150 hover:brightness-105 active:scale-[0.96] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#FCE7F3]" />
            <span className="text-xs font-medium text-[#9A9296]">or</span>
            <div className="h-px flex-1 bg-[#FCE7F3]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="min-h-[48px] w-full rounded-xl border border-[#FBCFE8] bg-white px-4 py-2.5 text-sm font-medium text-[#2D2A2E] transition-all duration-150 hover:bg-[#FDF2F8] active:scale-[0.96] disabled:opacity-60 flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#EC4899]" aria-hidden="true" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
