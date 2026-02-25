import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, BookMarked, Plus, FolderOpen, Trash2, Loader2, X, ArrowLeft,
  Clock, Users, ChevronRight, Flame, Beaker, Filter, ArrowUpRight,
  User, Globe, TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { Badge } from '@/components/Badge';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import { useAppSelector } from '@/app/hooks';
import {
  useSearchClustersQuery,
  useGetCollectionsQuery,
  useGetCollectionDetailQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useDeleteBookmarkMutation,
} from '@/services/api';
import type { Cluster, Collection, BookmarkWithCluster } from '@/types';

function TimeAgoText({ date }: { date: string }) {
  const timeAgo = useTimeAgo(date);
  return <span>{timeAgo}</span>;
}

function BiasFilterBar({ activeBias, onChange }: { activeBias: string | null; onChange: (b: string | null) => void }) {
  const filters = [
    { key: null, label: 'All' },
    { key: 'left', label: 'Left-leaning' },
    { key: 'center', label: 'Center' },
    { key: 'right', label: 'Right-leaning' },
    { key: 'international', label: 'International' },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map(f => (
        <button
          key={f.key || 'all'}
          onClick={() => onChange(f.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
            activeBias === f.key
              ? ''
              : 'border-transparent'
          }`}
          style={
            activeBias === f.key
              ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }
              : { color: 'var(--text-muted)' }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function SearchResultCard({ cluster }: { cluster: Cluster }) {
  const navigate = useNavigate();
  const timeAgo = useTimeAgo(cluster.lastArticleAt);

  const segments = [
    { key: 'left', count: cluster.sourceBreakdown.left, color: 'var(--bias-left)', label: 'Left' },
    { key: 'center', count: cluster.sourceBreakdown.center, color: 'var(--bias-center)', label: 'Center' },
    { key: 'right', count: cluster.sourceBreakdown.right, color: 'var(--bias-right)', label: 'Right' },
    { key: 'intl', count: cluster.sourceBreakdown.international, color: 'var(--bias-intl)', label: 'Intl' },
  ].filter(s => s.count > 0);
  const total = segments.reduce((a, s) => a + s.count, 0);

  return (
    <GlassCard
      hoverable
      onClick={() => navigate(`/cluster/${cluster.id}`)}
      className="p-4 sm:p-5 group"
    >
      <div className="flex gap-4">
        {cluster.heroImage && (
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden hidden sm:block" style={{ background: 'var(--bg-inset)' }}>
            <img
              src={cluster.heroImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase truncate" style={{ color: 'var(--accent-text)', opacity: 0.8 }}>
              {cluster.topic}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{timeAgo}</span>
          </div>
          <h3 className="text-sm sm:text-[15px] font-semibold leading-snug mb-2 transition-colors line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {cluster.representativeHeadline}
          </h3>
          {cluster.summary && (
            <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
              {cluster.summary}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <Users size={10} />
              {cluster.articleCount} articles
            </span>

            {total > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex h-1 rounded-full overflow-hidden w-10" style={{ background: 'var(--spectrum-track)' }}>
                  {segments.map(s => (
                    <div key={s.key} className="h-full" style={{ width: `${(s.count / total) * 100}%`, background: s.color }} />
                  ))}
                </div>
                <div className="flex gap-1">
                  {segments.map(s => (
                    <span key={s.key} className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{s.label}:{s.count}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--heat-text)', opacity: 0.6 }}>
                <Flame size={8} /> {Math.round(cluster.heatScore * 100)}
              </span>
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--substance-text)', opacity: 0.6 }}>
                <Beaker size={8} /> {Math.round(cluster.substanceScore * 100)}
              </span>
              <ArrowUpRight size={12} style={{ color: 'var(--text-faint)' }} />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ExploreView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [biasFilter, setBiasFilter] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const hasSearch = debouncedQuery.length >= 2 || biasFilter !== null;
  const { data, isLoading, isFetching } = useSearchClustersQuery(
    { q: debouncedQuery || undefined, bias: biasFilter || undefined, limit: 30 },
    { skip: !hasSearch }
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-placeholder)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search stories, topics, headlines..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--border-input-focus)';
            e.currentTarget.style.background = 'var(--bg-input-focus)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border-input)';
            e.currentTarget.style.background = 'var(--bg-input)';
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Filter size={12} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        <BiasFilterBar activeBias={biasFilter} onChange={setBiasFilter} />
      </div>

      {!hasSearch ? (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GlassCard className="p-5 flex flex-col items-center text-center gap-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--bias-left-bg)' }}>
                <TrendingUp size={18} style={{ color: 'var(--bias-left)', opacity: 0.7 }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Search Stories</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Search across all clustered stories by topic, headline, or keyword
              </p>
            </GlassCard>
            <GlassCard className="p-5 flex flex-col items-center text-center gap-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--bias-center-bg)' }}>
                <Filter size={18} style={{ color: 'var(--bias-center)', opacity: 0.7 }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Filter by Perspective</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                View stories through left, center, right, or international lenses
              </p>
            </GlassCard>
            <GlassCard className="p-5 flex flex-col items-center text-center gap-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--bias-intl-bg)' }}>
                <Globe size={18} style={{ color: 'var(--bias-intl)', opacity: 0.7 }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Bias Mirror</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Click any story to see how left, center, and right frame it differently
              </p>
            </GlassCard>
          </div>

          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Start typing or select a bias filter to explore stories</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-text)' }} />
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {data.items.length} {data.items.length === 1 ? 'story' : 'stories'} found
              {isFetching && <Loader2 size={10} className="inline animate-spin ml-2" />}
            </span>
          </div>
          {data.items.map(cluster => (
            <SearchResultCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No stories match your search</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Try different keywords or remove filters</p>
        </div>
      )}
    </div>
  );
}

function BookmarkCard({ bookmark, onRemove }: { bookmark: BookmarkWithCluster; onRemove: () => void }) {
  const navigate = useNavigate();
  const cluster = bookmark.cluster;

  return (
    <GlassCard hoverable className="p-4 group animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/cluster/${cluster.id}`)}>
          <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--accent-text)', opacity: 0.8 }}>
            {cluster.topic}
          </span>
          <h4 className="text-sm font-semibold leading-snug mt-1 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {cluster.representativeHeadline}
          </h4>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <Users size={10} /> {cluster.articleCount} sources
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <Clock size={10} /> <TimeAgoText date={cluster.lastArticleAt} />
            </span>
          </div>
          <div className="mt-2">
            <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} compact />
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="Remove bookmark"
          style={{ color: 'var(--text-faint)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </GlassCard>
  );
}

function CollectionDetailView({ collectionId, onBack }: { collectionId: string; onBack: () => void }) {
  const { data, isLoading } = useGetCollectionDetailQuery(collectionId);
  const [deleteBookmark] = useDeleteBookmarkMutation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-text)' }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 transition-colors text-sm group"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        All collections
      </button>
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{data.title}</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{data.bookmarks.length} saved {data.bookmarks.length === 1 ? 'story' : 'stories'}</p>
      </div>
      {data.bookmarks.length === 0 ? (
        <GlassCard className="p-8 flex flex-col items-center text-center">
          <div className="p-3 rounded-2xl mb-3" style={{ background: 'var(--bg-inset)' }}>
            <BookMarked size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No stories saved yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Browse the feed and save stories to this collection</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {data.bookmarks.map(bm => (
            <BookmarkCard key={bm.bookmarkId} bookmark={bm} onRemove={() => deleteBookmark(bm.bookmarkId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionsPanel() {
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);

  const { data: collections, isLoading } = useGetCollectionsQuery(undefined, { skip: !user });
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();

  if (!user) {
    return (
      <GlassCard className="p-8 flex flex-col items-center text-center">
        <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--accent-bg)' }}>
          <BookMarked size={28} style={{ color: 'var(--accent-text)', opacity: 0.5 }} />
        </div>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Save your research</h3>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Sign in to create collections and bookmark stories you want to track over time.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="mt-5 flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
          style={{
            color: 'var(--accent-text)',
            border: '1px solid var(--accent-bg)',
          }}
        >
          <User size={14} />
          Sign in to save
        </button>
      </GlassCard>
    );
  }

  if (activeCollectionId) {
    return (
      <CollectionDetailView
        collectionId={activeCollectionId}
        onBack={() => setActiveCollectionId(null)}
      />
    );
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      await createCollection({ title: newTitle.trim() }).unwrap();
      setNewTitle('');
      setShowNewForm(false);
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Your collections</span>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: 'var(--accent-text)', opacity: 0.7 }}
        >
          <Plus size={12} /> New
        </button>
      </div>

      {showNewForm && (
        <GlassCard className="p-3 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Collection name..."
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-input)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-input-focus)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; }}
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || isCreating}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: 'var(--accent-solid)', color: 'var(--text-inverse)' }}
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
            </button>
            <button onClick={() => { setShowNewForm(false); setNewTitle(''); }} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
        </GlassCard>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-text)' }} />
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="space-y-1.5">
          {collections.map(col => (
            <GlassCard
              key={col.id}
              hoverable
              onClick={() => setActiveCollectionId(col.id)}
              className="p-3.5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg shrink-0" style={{ background: 'var(--accent-bg)' }}>
                    <FolderOpen size={13} style={{ color: 'var(--accent-text)', opacity: 0.7 }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate transition-colors" style={{ color: 'var(--text-primary)' }}>{col.title}</h3>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {col.bookmarkCount} {col.bookmarkCount === 1 ? 'story' : 'stories'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
                    className="p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    <Trash2 size={11} />
                  </button>
                  <ChevronRight size={12} style={{ color: 'var(--text-faint)' }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-6 flex flex-col items-center text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No collections yet</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-3 text-xs"
            style={{ color: 'var(--accent-text)', opacity: 0.7 }}
          >
            Create your first collection
          </button>
        </GlassCard>
      )}
    </div>
  );
}

export function Research() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Research</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Search stories, filter by bias, explore perspectives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExploreView />
        </div>
        <div className="lg:col-span-1">
          <CollectionsPanel />
        </div>
      </div>
    </div>
  );
}
