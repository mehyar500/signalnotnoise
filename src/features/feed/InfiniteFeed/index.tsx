import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ClusterCard } from '../ClusterCard';
import { useGetClustersQuery } from '@/services/api';
import type { Cluster } from '@/types';

export function InfiniteFeed() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allClusters, setAllClusters] = useState<Cluster[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetClustersQuery({ cursor });

  useEffect(() => {
    if (data) {
      setAllClusters(prev => {
        const ids = new Set(prev.map(c => c.id));
        const newItems = data.items.filter(c => !ids.has(c.id));
        if (cursor === undefined) return data.items;
        return [...prev, ...newItems];
      });
      setHasMore(data.nextCursor !== null);
    }
  }, [data, cursor]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore && data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  }, [isFetching, hasMore, data]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (isLoading && allClusters.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
        <p className="text-white/20 text-xs">Loading stories...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 space-y-3 animate-fade-in">
        <p className="text-white/40 text-sm">Could not load stories. The backend may still be starting up.</p>
        <button onClick={() => refetch()} className="text-indigo-400 text-sm hover:underline flex items-center gap-1.5 mx-auto">
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (allClusters.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16 space-y-3 animate-fade-in">
        <p className="text-white/40 text-sm">No stories yet. The system is fetching articles from RSS feeds.</p>
        <p className="text-white/20 text-xs">Stories will appear here once articles are clustered (need 2+ articles per story).</p>
        <button onClick={() => { setCursor(undefined); refetch(); }} className="text-indigo-400 text-sm hover:underline flex items-center gap-1.5 mx-auto mt-4">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allClusters.map((cluster, i) => (
        <ClusterCard key={cluster.id} cluster={cluster} index={i} />
      ))}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isFetching && <Loader2 size={20} className="animate-spin text-indigo-400/60" />}
        </div>
      )}
      {!hasMore && allClusters.length > 0 && (
        <div className="text-center py-8">
          <p className="text-white/20 text-xs">You've seen all {allClusters.length} stories.</p>
        </div>
      )}
    </div>
  );
}
