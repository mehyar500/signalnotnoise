import { Zap, TrendingUp, Database, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { InfiniteFeed } from '@/features/feed/InfiniteFeed';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { openDigest } from '@/app/digestSlice';
import { useGetStatsQuery, useGetDigestQuery, useTriggerSyncMutation } from '@/services/api';

export function Home() {
  const dispatch = useAppDispatch();
  const { isDone } = useAppSelector(s => s.digest);
  const { data: stats } = useGetStatsQuery(undefined, { pollingInterval: 30000 });
  const { data: digest } = useGetDigestQuery();
  const [triggerSync, { isLoading: isSyncing }] = useTriggerSyncMutation();

  const hasDigest = digest !== null && digest !== undefined;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-white/30">{stats.activeSources} sources</span>
          <span className="text-xs text-white/30">{stats.totalArticles} articles</span>
          <span className="text-xs text-white/30">{stats.activeClusters} stories</span>
          <span className="text-xs text-white/30">{stats.articlesLast24h} new today</span>
          {stats.aiAvailable && <span className="text-xs text-green-400/60">AI active</span>}
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="ml-auto text-xs text-indigo-400/60 hover:text-indigo-400 flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      )}

      {hasDigest && !isDone && (
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
                <p className="text-white/50 text-xs">Today's digest is ready</p>
              </div>
            </div>
            <span className="text-xs text-indigo-400 font-medium">Read now →</span>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-white/40" />
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">Stories</h2>
      </div>

      <InfiniteFeed />
    </div>
  );
}
