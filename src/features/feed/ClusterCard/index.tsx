import { useNavigate } from 'react-router-dom';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Cluster } from '@/types';

interface ClusterCardProps {
  cluster: Cluster;
}

export function ClusterCard({ cluster }: ClusterCardProps) {
  const navigate = useNavigate();
  const timeAgo = useTimeAgo(cluster.lastArticleAt);

  return (
    <GlassCard
      hoverable
      onClick={() => navigate(`/cluster/${cluster.id}`)}
      className="p-5 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            {cluster.topic}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/50 text-xs shrink-0">
          <Users size={12} />
          <span className="font-medium">{cluster.articleCount} sources</span>
        </div>
      </div>

      <h3 className="text-white font-semibold text-base leading-snug mb-3 group-hover:text-indigo-200 transition-colors">
        {cluster.representativeHeadline}
      </h3>

      <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-2">
        {cluster.summary}
      </p>

      <div className="flex items-end justify-between gap-4">
        <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} className="flex-1" />
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <Clock size={11} />
            <span>{timeAgo}</span>
          </div>
          <ArrowRight size={14} className="text-indigo-400/60 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
        {cluster.sourceBreakdown.left > 0 && (
          <span className="text-xs text-blue-400/70">{cluster.sourceBreakdown.left} left</span>
        )}
        {cluster.sourceBreakdown.center > 0 && (
          <span className="text-xs text-purple-400/70">· {cluster.sourceBreakdown.center} center</span>
        )}
        {cluster.sourceBreakdown.right > 0 && (
          <span className="text-xs text-red-400/70">· {cluster.sourceBreakdown.right} right</span>
        )}
        {cluster.sourceBreakdown.international > 0 && (
          <span className="text-xs text-emerald-400/70">· {cluster.sourceBreakdown.international} intl</span>
        )}
      </div>
    </GlassCard>
  );
}
