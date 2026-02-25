import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, BookmarkPlus, Loader2, AlertCircle, Check, Plus, FolderPlus, X } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { BiasMirror } from '@/features/cluster/BiasMirror';
import {
  useGetClusterDetailQuery,
  useGetCollectionsQuery,
  useCheckBookmarksQuery,
  useCreateBookmarkMutation,
  useCreateCollectionMutation,
} from '@/services/api';
import { useTimeAgo } from '@/hooks/useTimeAgo';

export function ClusterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cluster, isLoading, isError } = useGetClusterDetailQuery(id ?? '');

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (isError || !cluster) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
        <div className="p-3 rounded-full bg-red-500/10">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-white/50 text-sm">Story not found.</p>
        <button onClick={() => navigate('/')} className="text-indigo-400 text-sm hover:underline">
          Back to Feed
        </button>
      </div>
    );
  }

  return <ClusterDetailView cluster={cluster} onBack={() => navigate('/')} />;
}

function SaveToResearchButton({ clusterId }: { clusterId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const { data: collections } = useGetCollectionsQuery();
  const { data: existingBookmarks } = useCheckBookmarksQuery(clusterId);
  const [createBookmark, { isLoading: isSaving }] = useCreateBookmarkMutation();
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();

  const savedCollectionIds = new Set(existingBookmarks?.map(b => b.collectionId) || []);

  async function handleSave(collectionId: string) {
    try {
      await createBookmark({ clusterId, collectionId }).unwrap();
    } catch (err) {
    }
  }

  async function handleCreateAndSave() {
    if (!newTitle.trim()) return;
    try {
      const col = await createCollection({ title: newTitle.trim() }).unwrap();
      await createBookmark({ clusterId, collectionId: col.id }).unwrap();
      setNewTitle('');
      setShowNewInput(false);
    } catch (err) {
    }
  }

  if (!isOpen) {
    const isSaved = existingBookmarks && existingBookmarks.length > 0;
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-sm font-medium transition-all px-4 py-2 rounded-xl ${
          isSaved
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent'
        }`}
      >
        {isSaved ? <Check size={15} /> : <BookmarkPlus size={15} />}
        {isSaved ? 'Saved' : 'Save to Research'}
      </button>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Save to collection</span>
        <button onClick={() => { setIsOpen(false); setShowNewInput(false); }} className="text-white/30 hover:text-white/60 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {collections && collections.length > 0 ? (
          collections.map(col => {
            const alreadySaved = savedCollectionIds.has(col.id);
            return (
              <button
                key={col.id}
                onClick={() => !alreadySaved && handleSave(col.id)}
                disabled={alreadySaved || isSaving}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                  alreadySaved
                    ? 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/15'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white border border-transparent'
                }`}
              >
                <span className="truncate">{col.title}</span>
                {alreadySaved ? <Check size={13} className="shrink-0" /> : <Plus size={13} className="shrink-0 text-white/20" />}
              </button>
            );
          })
        ) : (
          <p className="text-xs text-white/25 py-2 text-center">No collections yet</p>
        )}
      </div>

      {showNewInput ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateAndSave()}
            placeholder="Collection name..."
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
          />
          <button
            onClick={handleCreateAndSave}
            disabled={!newTitle.trim() || isCreating}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewInput(true)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all border border-dashed border-white/[0.06] hover:border-indigo-500/20"
        >
          <FolderPlus size={12} />
          New collection
        </button>
      )}
    </div>
  );
}

function ClusterDetailView({ cluster, onBack }: { cluster: NonNullable<ReturnType<typeof useGetClusterDetailQuery>['data']>; onBack: () => void }) {
  const timeAgo = useTimeAgo(cluster.lastArticleAt);

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Feed
      </button>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold tracking-wider text-indigo-400/90 uppercase">
            {cluster.topic}
          </span>
        </div>
        <h1 className="text-xl font-bold text-white leading-snug mb-3">
          {cluster.representativeHeadline}
        </h1>
        {cluster.summary && (
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            {cluster.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Users size={14} className="text-indigo-400/60" />
            <span>{cluster.articleCount} articles from {cluster.sourceCount} sources</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Clock size={14} className="text-white/25" />
            <span>Updated {timeAgo}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} showLabels />
        </div>

        <div className="mt-5 pt-5 border-t border-white/[0.05]">
          <SaveToResearchButton clusterId={cluster.id} />
        </div>
      </GlassCard>

      <BiasMirror cluster={cluster} />
    </div>
  );
}
