import { Zap, TrendingUp, Database, RefreshCw, Radio, Cpu } from 'lucide-react';
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
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 text-white/30">
            <Radio size={9} className="text-indigo-400/50" />
            <span>{stats.activeSources} sources</span>
          </div>
          <span className="text-white/10">|</span>
          <span className="text-white/30">{stats.totalArticles.toLocaleString()} articles</span>
          <span className="text-white/10">|</span>
          <span className="text-white/30">{stats.activeClusters.toLocaleString()} stories</span>
          <span className="text-white/10">|</span>
          <span className="text-white/30">{stats.articlesLast24h.toLocaleString()} new today</span>
          {stats.aiAvailable && (
            <>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1 text-emerald-400/60">
                <Cpu size={9} />
                AI active
              </span>
            </>
          )}
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="ml-auto text-[11px] text-indigo-400/50 hover:text-indigo-400 flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={9} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      )}

      {hasDigest && !isDone && (
        <GlassCard
          hoverable
          glow
          onClick={() => dispatch(openDigest())}
          className="p-5 border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.08] to-purple-500/[0.08]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10">
                <Zap size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">One-Minute World</p>
                <p className="text-white/40 text-xs mt-0.5">Today's digest is ready</p>
              </div>
            </div>
            <span className="text-xs text-indigo-400/80 font-medium group-hover:text-indigo-300 transition-colors">Read now &rarr;</span>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-white/30" />
        <h2 className="text-xs font-medium text-white/30 uppercase tracking-widest">Stories</h2>
      </div>

      <InfiniteFeed />
    </div>
  );
}
