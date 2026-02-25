import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowRight, Shield, Zap, BookMarked } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAppDispatch } from '@/app/hooks';
import { setAuth } from '@/app/authSlice';

type Mode = 'signin' | 'signup';

export function Auth() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/v1/auth/signup' : '/api/v1/auth/signin';
      const body: Record<string, string> = { email, password };
      if (mode === 'signup' && displayName.trim()) body.displayName = displayName.trim();

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      dispatch(setAuth({ user: data.user, token: data.token }));
      navigate('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Axial
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {mode === 'signup' ? 'Join the clearest view of the news' : 'Welcome back'}
          </p>
        </div>

        <GlassCard className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex rounded-xl overflow-hidden border border-white/[0.07] bg-white/[0.02]">
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                  mode === 'signup' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                  mode === 'signin' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                Sign in
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-white/40 font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] text-white/20 mt-1.5">Must match the access code to join the beta</p>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </GlassCard>

        {mode === 'signup' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Shield size={16} className="text-indigo-400/60" />
              <span className="text-[10px] text-white/30 text-center leading-tight">Save your research collections</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <BookMarked size={16} className="text-purple-400/60" />
              <span className="text-[10px] text-white/30 text-center leading-tight">Bookmark stories to track</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Zap size={16} className="text-amber-400/60" />
              <span className="text-[10px] text-white/30 text-center leading-tight">Personalized daily digest</span>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-white/15">
          {mode === 'signup'
            ? 'Already have an account? Switch to Sign in above.'
            : "Don't have an account? Switch to Sign up above."}
        </p>
      </div>
    </div>
  );
}
