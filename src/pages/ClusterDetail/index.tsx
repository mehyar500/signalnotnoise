import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, BookmarkPlus, Loader2, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { BiasMirror } from '@/features/cluster/BiasMirror';
import { useGetClusterDetailQuery } from '@/services/api';
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
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-white/60">Story not found.</p>
        <button onClick={() => navigate('/')} className="text-indigo-400 text-sm hover:underline">
          Back to Feed
        </button>
      </div>
    );
  }

  return <ClusterDetailView cluster={cluster} onBack={() => navigate('/')} />;
}

function ClusterDetailView({ cluster, onBack }: { cluster: NonNullable<ReturnType<typeof useGetClusterDetailQuery>['data']>; onBack: () => void }) {
  const timeAgo = useTimeAgo(cluster.lastArticleAt);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
      >
        <ArrowLeft size={14} />
        Back to Feed
      </button>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            {cluster.topic}
          </span>
        </div>
        <h1 className="text-xl font-bold text-white leading-snug mb-4">
          {cluster.representativeHeadline}
        </h1>
        <p className="text-white/70 text-sm leading-relaxed mb-5">
          {cluster.summary}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Users size={14} className="text-indigo-400" />
            <span>{cluster.articleCount} articles from {cluster.sourceCount} sources</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Clock size={14} className="text-white/40" />
            <span>Updated {timeAgo}</span>
          </div>
        </div>

        <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} showLabels />

        <div className="mt-5 pt-5 border-t border-white/5">
          <button className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <BookmarkPlus size={15} />
            Save to Research
          </button>
        </div>
      </GlassCard>

      <BiasMirror cluster={cluster} />
    </div>
  );
}
