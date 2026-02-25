import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, BookmarkPlus, Loader2, AlertCircle, Check, Plus, FolderPlus, X, User } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { BiasMirror } from '@/features/cluster/BiasMirror';
import { useAppSelector } from '@/app/hooks';
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
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-text)' }} />
      </div>
    );
  }

  if (isError || !cluster) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
        <div className="p-3 rounded-full" style={{ background: 'var(--danger-bg)' }}>
          <AlertCircle size={28} style={{ color: 'var(--danger-text)' }} />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Story not found.</p>
        <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: 'var(--accent-text)' }}>
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
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);

  const { data: collections } = useGetCollectionsQuery(undefined, { skip: !user });
  const { data: existingBookmarks } = useCheckBookmarksQuery(clusterId);
  const [createBookmark, { isLoading: isSaving }] = useCreateBookmarkMutation();
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();

  const savedCollectionIds = new Set(existingBookmarks?.map(b => b.collectionId) || []);

  async function handleSave(collectionId: string) {
    try {
      await createBookmark({ clusterId, collectionId }).unwrap();
    } catch {}
  }

  async function handleCreateAndSave() {
    if (!newTitle.trim()) return;
    try {
      const col = await createCollection({ title: newTitle.trim() }).unwrap();
      await createBookmark({ clusterId, collectionId: col.id }).unwrap();
      setNewTitle('');
      setShowNewInput(false);
    } catch {}
  }

  if (!user) {
    return (
      <button
        onClick={() => navigate('/auth')}
        className="flex items-center gap-2 text-sm font-medium transition-all px-4 py-2 rounded-xl border"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}
      >
        <User size={15} />
        Sign in to save
      </button>
    );
  }

  if (!isOpen) {
    const isSaved = existingBookmarks && existingBookmarks.length > 0;
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-medium transition-all px-4 py-2 rounded-xl border"
        style={{
          color: isSaved ? 'var(--success-text)' : 'var(--accent-text)',
          background: isSaved ? 'var(--success-bg)' : 'transparent',
          borderColor: isSaved ? 'var(--success-border)' : 'transparent',
        }}
      >
        {isSaved ? <Check size={15} /> : <BookmarkPlus size={15} />}
        {isSaved ? 'Saved' : 'Save to Research'}
      </button>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Save to collection</span>
        <button onClick={() => { setIsOpen(false); setShowNewInput(false); }} className="transition-colors" style={{ color: 'var(--text-muted)' }}>
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
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border"
                style={{
                  color: alreadySaved ? 'var(--success-text)' : 'var(--text-secondary)',
                  background: alreadySaved ? 'var(--success-bg)' : 'transparent',
                  borderColor: alreadySaved ? 'var(--success-border)' : 'transparent',
                }}
              >
                <span className="truncate">{col.title}</span>
                {alreadySaved ? <Check size={13} className="shrink-0" /> : <Plus size={13} className="shrink-0" style={{ color: 'var(--text-muted)' }} />}
              </button>
            );
          })
        ) : (
          <p className="text-xs py-2 text-center" style={{ color: 'var(--text-muted)' }}>No collections yet</p>
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
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleCreateAndSave}
            disabled={!newTitle.trim() || isCreating}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--accent-solid)', color: 'var(--text-inverse)' }}
          >
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewInput(true)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all border border-dashed"
          style={{ color: 'var(--accent-text)', borderColor: 'var(--border-primary)' }}
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
        className="flex items-center gap-2 transition-colors text-sm group"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Feed
      </button>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--accent-text)' }}>
            {cluster.topic}
          </span>
        </div>
        <h1 className="text-xl font-bold leading-snug mb-3" style={{ color: 'var(--text-primary)' }}>
          {cluster.representativeHeadline}
        </h1>
        {cluster.summary && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
            {cluster.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Users size={14} style={{ color: 'var(--accent-text)', opacity: 0.6 }} />
            <span>{cluster.articleCount} articles from {cluster.sourceCount} sources</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Updated {timeAgo}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
          <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} showLabels />
        </div>

        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <SaveToResearchButton clusterId={cluster.id} />
        </div>
      </GlassCard>

      <BiasMirror cluster={cluster} />
    </div>
  );
}
