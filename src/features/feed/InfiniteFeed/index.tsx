import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { ClusterCard } from '../ClusterCard';
import { useGetClustersQuery } from '@/services/api';
import type { Cluster } from '@/types';

export function InfiniteFeed() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allClusters, setAllClusters] = useState<Cluster[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useGetClustersQuery({ cursor });

  useEffect(() => {
    if (data) {
      setAllClusters(prev => {
        const ids = new Set(prev.map(c => c.id));
        const newItems = data.items.filter(c => !ids.has(c.id));
        return [...prev, ...newItems];
      });
      setHasMore(data.nextCursor !== null);
    }
  }, [data]);

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
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allClusters.map((cluster) => (
        <ClusterCard key={cluster.id} cluster={cluster} />
      ))}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isFetching && <Loader2 size={24} className="animate-spin text-indigo-400" />}
        </div>
      )}
      {!hasMore && allClusters.length > 0 && (
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">You've seen all {allClusters.length} stories today.</p>
        </div>
      )}
    </div>
  );
}
