import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Plus, Sparkles, FolderOpen, Trash2, Loader2, X, ArrowLeft, Clock, Users, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import {
  useGetCollectionsQuery,
  useGetCollectionDetailQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useDeleteBookmarkMutation,
} from '@/services/api';
import type { Collection, BookmarkWithCluster } from '@/types';

function TimeAgoText({ date }: { date: string }) {
  const timeAgo = useTimeAgo(date);
  return <span>{timeAgo}</span>;
}

function BookmarkCard({ bookmark, onRemove }: { bookmark: BookmarkWithCluster; onRemove: () => void }) {
  const navigate = useNavigate();
  const cluster = bookmark.cluster;

  return (
    <GlassCard
      hoverable
      className="p-4 group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/cluster/${cluster.id}`)}>
          <span className="text-[10px] font-semibold tracking-wider text-indigo-400/80 uppercase">
            {cluster.topic}
          </span>
          <h4 className="text-sm font-semibold text-white leading-snug mt-1 group-hover:text-indigo-200 transition-colors">
            {cluster.representativeHeadline}
          </h4>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-white/30">
              <Users size={10} />
              {cluster.articleCount} sources
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/30">
              <Clock size={10} />
              <TimeAgoText date={cluster.lastArticleAt} />
            </span>
          </div>
          <div className="mt-2">
            <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} compact />
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
          title="Remove bookmark"
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
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        All collections
      </button>

      <div>
        <h2 className="text-lg font-bold text-white">{data.title}</h2>
        <p className="text-xs text-white/30 mt-1">{data.bookmarks.length} saved {data.bookmarks.length === 1 ? 'story' : 'stories'}</p>
      </div>

      {data.bookmarks.length === 0 ? (
        <GlassCard className="p-8 flex flex-col items-center text-center">
          <div className="p-3 rounded-2xl bg-white/[0.03] mb-3">
            <BookMarked size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No stories saved yet</p>
          <p className="text-white/20 text-xs mt-1">Browse the feed and save stories to this collection</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {data.bookmarks.map(bm => (
            <BookmarkCard
              key={bm.bookmarkId}
              bookmark={bm}
              onRemove={() => deleteBookmark(bm.bookmarkId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ collection, onClick }: { collection: Collection; onClick: () => void }) {
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();

  return (
    <GlassCard
      hoverable
      onClick={onClick}
      className="p-4 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/10 shrink-0">
            <FolderOpen size={16} className="text-indigo-400/70" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">{collection.title}</h3>
            <p className="text-[11px] text-white/25 mt-0.5">
              {collection.bookmarkCount} {collection.bookmarkCount === 1 ? 'story' : 'stories'}
              {collection.lastBookmarkAt && (
                <> · last saved <TimeAgoText date={collection.lastBookmarkAt} /></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); deleteCollection(collection.id); }}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            title="Delete collection"
          >
            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
          <ChevronRight size={14} className="text-white/15 group-hover:text-white/30 transition-colors" />
        </div>
      </div>
    </GlassCard>
  );
}

export function Research() {
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: collections, isLoading } = useGetCollectionsQuery();
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      await createCollection({ title: newTitle.trim() }).unwrap();
      setNewTitle('');
      setShowNewForm(false);
    } catch (err) {
    }
  }

  if (activeCollectionId) {
    return (
      <CollectionDetailView
        collectionId={activeCollectionId}
        onBack={() => setActiveCollectionId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Research</h1>
          <p className="text-white/30 text-xs mt-1">Your collections and saved stories</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 text-sm text-indigo-400/80 hover:text-indigo-300 transition-colors font-medium px-3 py-1.5 rounded-xl hover:bg-indigo-500/10"
        >
          <Plus size={14} />
          New collection
        </button>
      </div>

      {showNewForm && (
        <GlassCard className="p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 font-medium uppercase tracking-wider">New collection</span>
            <button onClick={() => { setShowNewForm(false); setNewTitle(''); }} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Election 2026, Tech Layoffs, Climate..."
              autoFocus
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || isCreating}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-40 shadow-lg shadow-indigo-500/10"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
            </button>
          </div>
        </GlassCard>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="space-y-2">
          {collections.map(col => (
            <CollectionCard
              key={col.id}
              collection={col}
              onClick={() => setActiveCollectionId(col.id)}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 flex flex-col items-center text-center">
          <div className="p-4 rounded-2xl bg-indigo-500/[0.07] mb-4">
            <BookMarked size={28} className="text-indigo-400/50" />
          </div>
          <h3 className="font-semibold text-white/80 mb-2">No collections yet</h3>
          <p className="text-white/35 text-sm max-w-sm leading-relaxed">
            Create a collection to organize stories you want to track. You'll see when stories get new coverage or framing shifts.
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-6 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/10 transition-all"
          >
            <Plus size={14} />
            Create your first collection
          </button>
          <div className="mt-6 flex items-center gap-2 text-[11px] text-white/15">
            <Sparkles size={10} />
            <span>Collections keep your research organized</span>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
