import { Zap, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { InfiniteFeed } from '@/features/feed/InfiniteFeed';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openDigest } from '@/app/digestSlice';

export function Home() {
  const dispatch = useAppDispatch();
  const { isDone } = useAppSelector(s => s.digest);

  return (
    <div className="space-y-6">
      {!isDone && (
        <GlassCard
          hoverable
          onClick={() => dispatch(openDigest())}
          className="p-5 border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Zap size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">One-Minute World</p>
                <p className="text-white/50 text-xs">Today's digest is ready · 10 stories</p>
              </div>
            </div>
            <span className="text-xs text-indigo-400 font-medium">Read now →</span>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-white/40" />
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">Today's Stories</h2>
      </div>

      <InfiniteFeed />
    </div>
  );
}
