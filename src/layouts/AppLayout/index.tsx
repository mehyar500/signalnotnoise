import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Newspaper, BookMarked, Zap, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openDigest } from '@/app/digestSlice';
import { DigestPlayer } from '@/features/digest/DigestPlayer';
import { clsx } from 'clsx';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isOpen, isDone } = useAppSelector(s => s.digest);

  const navItems = [
    { path: '/', label: 'Feed', icon: Newspaper },
    { path: '/research', label: 'Research', icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 60%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 50%)',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Axial
          </button>
          <button
            onClick={() => !isDone && dispatch(openDigest())}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all',
              isDone
                ? 'text-emerald-400/60 bg-emerald-500/10 cursor-default'
                : 'text-indigo-300 hover:bg-indigo-500/15 hover:text-indigo-200'
            )}
            title={isDone ? "You're caught up" : 'Daily digest'}
          >
            {isDone ? <CheckCircle size={14} /> : <Zap size={14} />}
            <span className="hidden sm:inline">{isDone ? "Caught up" : "Daily digest"}</span>
          </button>
        </div>
      </header>

      <nav className="sticky top-14 z-30 border-b border-white/[0.06] bg-[#0f172a]/70 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={clsx(
                  'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-indigo-400'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                <Icon size={14} />
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {isOpen && <DigestPlayer />}
    </div>
  );
}
