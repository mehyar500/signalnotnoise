import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Newspaper, Search, Zap, CheckCircle, User, LogOut, Sun, Moon, Eye, BookOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openDigest } from '@/app/digestSlice';
import { clearAuth } from '@/app/authSlice';
import { toggleTheme } from '@/app/themeSlice';
import { DigestPlayer } from '@/features/digest/DigestPlayer';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isOpen, isDone } = useAppSelector(s => s.digest);
  const { user } = useAppSelector(s => s.auth);
  const { theme } = useAppSelector(s => s.theme);

  const navItems = [
    { path: '/', label: 'Feed', icon: Newspaper },
    { path: '/blindspot', label: 'Blindspot', icon: Eye },
    { path: '/digest', label: 'Digest', icon: BookOpen },
    { path: '/research', label: 'Research', icon: Search },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="sticky top-0 z-40 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border-primary)', background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
            style={{ color: 'var(--accent-text)' }}
          >
            Axial
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => !isDone && dispatch(openDigest())}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                color: isDone ? '#34d399' : 'var(--accent-text)',
                background: isDone ? 'rgba(52,211,153,0.1)' : 'transparent',
              }}
              title={isDone ? "You're caught up" : 'Daily digest'}
            >
              {isDone ? <CheckCircle size={14} /> : <Zap size={14} />}
              <span className="hidden sm:inline">{isDone ? "Caught up" : "Digest"}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {(user.displayName || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-xs hidden sm:inline max-w-[100px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={() => { dispatch(clearAuth()); navigate('/'); }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <User size={14} />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-30 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border-primary)', background: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0.5 overflow-x-auto scrollbar-hide">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
                style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)' }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Icon size={14} />
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {isOpen && <DigestPlayer />}
    </div>
  );
}
