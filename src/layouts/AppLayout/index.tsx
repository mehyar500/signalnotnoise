import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Newspaper, BookMarked, Zap } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 60%)',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          >
            Axial
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => !isDone && dispatch(openDigest())}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                isDone
                  ? 'text-white/30 cursor-default'
                  : 'text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200'
              )}
              title={isDone ? "You're caught up" : 'Daily digest'}
            >
              <Zap size={14} className={isDone ? 'text-green-400' : ''} />
              <span className="hidden sm:inline">{isDone ? "Caught up" : "Daily digest"}</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-30 border-b border-white/5 bg-[#0f172a]/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 flex">
          {[
            { path: '/', label: 'Feed', icon: Newspaper },
            { path: '/research', label: 'Research', icon: BookMarked },
          ].map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                location.pathname === path
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-white/40 hover:text-white/70'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>

      {isOpen && <DigestPlayer />}
    </div>
  );
}
