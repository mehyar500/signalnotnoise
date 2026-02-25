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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--accent-text)' }}>
            Axial
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signup' ? 'Join the clearest view of the news' : 'Welcome back'}
          </p>
        </div>

        <GlassCard className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-inset)' }}>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className="flex-1 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: mode === 'signup' ? 'var(--bg-elevated)' : 'transparent',
                  color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className="flex-1 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: mode === 'signin' ? 'var(--bg-elevated)' : 'transparent',
                  color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                Sign in
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input-focus)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-input)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input-focus)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input-focus)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>At least 8 characters</p>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-inverse)', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-solid-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-solid)'}
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
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
              <Shield size={16} style={{ color: 'var(--accent-text)', opacity: 0.6 }} />
              <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Save your research collections</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
              <BookMarked size={16} style={{ color: 'var(--bias-center)', opacity: 0.6 }} />
              <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Bookmark stories to track</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
              <Zap size={16} style={{ color: 'var(--warning-text)', opacity: 0.6 }} />
              <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Personalized daily digest</span>
            </div>
          </div>
        )}

        <p className="text-center text-[11px]" style={{ color: 'var(--text-faint)' }}>
          {mode === 'signup'
            ? 'Already have an account? Switch to Sign in above.'
            : "Don't have an account? Switch to Sign up above."}
        </p>
      </div>
    </div>
  );
}
