import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Sun, Moon, Settings, Menu, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuth } from '@/app/authSlice';
import { toggleTheme } from '@/app/themeSlice';
import { DigestPlayer } from '@/features/digest/DigestPlayer';
import { Logo } from '@/components/Logo';

interface AppLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/', label: 'Feed' },
  { path: '/blindspot', label: 'Blindspot' },
  { path: '/digest', label: 'Digest' },
  { path: '/research', label: 'Research' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isOpen } = useAppSelector(s => s.digest);
  const { user } = useAppSelector(s => s.auth);
  const { theme } = useAppSelector(s => s.theme);
  const [mobileOpen, setMobileOpen] = useState(false);

  function navTo(path: string) {
    navigate(path);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-2xl"
        style={{ borderBottom: '1px solid var(--border-primary)', background: 'color-mix(in srgb, var(--bg-secondary) 92%, transparent)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navTo('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Logo size={26} />
              <span
                className="font-bold text-lg tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Axial
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ path, label }) => {
                const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                return (
                  <button
                    key={path}
                    onClick={() => navTo(path)}
                    className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                      background: isActive ? 'var(--accent-bg)' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <>
                {user.isAdmin && (
                  <button
                    onClick={() => navTo('/admin')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      color: location.pathname.startsWith('/admin') ? 'var(--warning-text)' : 'var(--text-muted)',
                      background: location.pathname.startsWith('/admin') ? 'var(--warning-bg)' : 'transparent',
                    }}
                    title="Admin panel"
                  >
                    <Settings size={14} />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: 'var(--accent-solid)', color: '#fff' }}
                  >
                    {(user.displayName || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-xs hidden sm:inline max-w-[100px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={() => { dispatch(clearAuth()); navTo('/'); }}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navTo('/auth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <User size={14} />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            className="md:hidden px-4 pb-3 space-y-1 animate-fade-in"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            {NAV_ITEMS.map(({ path, label }) => {
              const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
              return (
                <button
                  key={path}
                  onClick={() => navTo(path)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {isOpen && <DigestPlayer />}
    </div>
  );
}
