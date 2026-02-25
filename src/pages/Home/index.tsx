import { Zap, Radio, RefreshCw, Cpu } from 'lucide-react';
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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        {stats && (
          <div className="flex items-center gap-2 flex-wrap text-[10px] text-white/25">
            <Radio size={8} className="text-indigo-400/40" />
            <span>{stats.activeSources} feeds</span>
            <span className="text-white/10">·</span>
            <span>{stats.totalArticles.toLocaleString()} articles</span>
            <span className="text-white/10">·</span>
            <span>{stats.activeClusters.toLocaleString()} stories</span>
            {stats.aiAvailable && (
              <>
                <span className="text-white/10">·</span>
                <span className="flex items-center gap-0.5 text-emerald-400/50">
                  <Cpu size={8} />
                  AI
                </span>
              </>
            )}
          </div>
        )}
        <button
          onClick={() => triggerSync()}
          disabled={isSyncing}
          className="text-[10px] text-white/20 hover:text-indigo-400 flex items-center gap-1 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={9} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing' : 'Sync'}
        </button>
      </div>

      {hasDigest && !isDone && (
        <div
          onClick={() => dispatch(openDigest())}
          className="group cursor-pointer rounded-2xl p-4 sm:p-5 border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.06] to-purple-500/[0.06] hover:from-indigo-500/[0.10] hover:to-purple-500/[0.10] transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <Zap size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">One-Minute World</p>
                <p className="text-white/35 text-[11px] mt-0.5">Today's digest is ready</p>
              </div>
            </div>
            <span className="text-[11px] text-indigo-400/70 font-medium group-hover:text-indigo-300 transition-colors">
              Read now &rarr;
            </span>
          </div>
        </div>
      )}

      <InfiniteFeed />
    </div>
  );
}
