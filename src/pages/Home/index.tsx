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
          <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <Radio size={8} style={{ color: 'var(--accent-text)', opacity: 0.5 }} />
            <span>{stats.activeSources} feeds</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span>{stats.totalArticles.toLocaleString()} articles</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span>{stats.activeClusters.toLocaleString()} stories</span>
            {stats.aiAvailable && (
              <>
                <span style={{ color: 'var(--text-faint)' }}>·</span>
                <span className="flex items-center gap-0.5" style={{ color: 'var(--success-text)', opacity: 0.6 }}>
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
          className="text-[10px] flex items-center gap-1 transition-colors disabled:opacity-50 shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          <RefreshCw size={9} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing' : 'Sync'}
        </button>
      </div>

      {hasDigest && !isDone && (
        <div
          onClick={() => dispatch(openDigest())}
          className="group cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-300"
          style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'var(--accent-bg)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--accent-bg)' }}>
                <Zap size={16} style={{ color: 'var(--accent-text)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>One-Minute World</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Today's digest is ready</p>
              </div>
            </div>
            <span className="text-[11px] font-medium transition-colors" style={{ color: 'var(--accent-text)' }}>
              Read now &rarr;
            </span>
          </div>
        </div>
      )}

      <InfiniteFeed />
    </div>
  );
}
