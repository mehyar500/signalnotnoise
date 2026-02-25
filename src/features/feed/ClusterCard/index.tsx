import { useNavigate } from 'react-router-dom';
import { Users, Clock, ArrowRight, Flame } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { HeatBar } from '@/components/HeatBar';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Cluster } from '@/types';

interface ClusterCardProps {
  cluster: Cluster;
  index?: number;
}

function getHeatLabel(heat: number, substance: number): string | null {
  if (heat > 0.7 && substance < 0.5) return 'Read skeptically';
  if (heat > 0.7 && substance > 0.7) return 'Important & detailed';
  if (heat < 0.3 && substance > 0.7) return 'Data-driven';
  return null;
}

export function ClusterCard({ cluster, index = 0 }: ClusterCardProps) {
  const navigate = useNavigate();
  const timeAgo = useTimeAgo(cluster.lastArticleAt);
  const heatLabel = getHeatLabel(cluster.heatScore, cluster.substanceScore);

  return (
    <GlassCard
      hoverable
      onClick={() => navigate(`/cluster/${cluster.id}`)}
      className="p-5 sm:p-6 group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[11px] font-semibold tracking-wider text-indigo-400/90 uppercase truncate">
            {cluster.topic}
          </span>
          {heatLabel && (
            <span className="flex items-center gap-1 text-[10px] text-orange-400/60 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
              <Flame size={8} />
              {heatLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-white/40 text-xs shrink-0">
          <Users size={11} />
          <span className="font-medium">{cluster.articleCount} sources</span>
        </div>
      </div>

      <h3 className="text-white font-semibold text-[15px] leading-snug mb-2.5 group-hover:text-indigo-200 transition-colors">
        {cluster.representativeHeadline}
      </h3>

      {cluster.summary && (
        <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">
          {cluster.summary}
        </p>
      )}

      <div className="flex items-end justify-between gap-4">
        <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} className="flex-1" compact />
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-white/30 text-[11px]">
            <Clock size={10} />
            <span>{timeAgo}</span>
          </div>
          <ArrowRight size={14} className="text-indigo-400/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.05] flex gap-2 flex-wrap">
        {cluster.sourceBreakdown.left > 0 && (
          <span className="text-[11px] text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded-full">
            {cluster.sourceBreakdown.left} left
          </span>
        )}
        {cluster.sourceBreakdown.center > 0 && (
          <span className="text-[11px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded-full">
            {cluster.sourceBreakdown.center} center
          </span>
        )}
        {cluster.sourceBreakdown.right > 0 && (
          <span className="text-[11px] text-red-400/60 bg-red-500/10 px-2 py-0.5 rounded-full">
            {cluster.sourceBreakdown.right} right
          </span>
        )}
        {cluster.sourceBreakdown.international > 0 && (
          <span className="text-[11px] text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {cluster.sourceBreakdown.international} intl
          </span>
        )}
      </div>
    </GlassCard>
  );
}
