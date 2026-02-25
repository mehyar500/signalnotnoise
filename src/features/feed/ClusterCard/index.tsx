import { useNavigate } from 'react-router-dom';
import { Users, Clock, ArrowUpRight, Flame, Beaker } from 'lucide-react';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Cluster } from '@/types';

interface ClusterCardProps {
  cluster: Cluster;
  variant?: 'hero' | 'featured' | 'standard';
}

function BiasBar({ breakdown }: { breakdown: Cluster['sourceBreakdown'] }) {
  const segments = [
    { key: 'left', count: breakdown.left, color: 'bg-blue-400' },
    { key: 'center', count: breakdown.center, color: 'bg-purple-400' },
    { key: 'right', count: breakdown.right, color: 'bg-red-400' },
    { key: 'international', count: breakdown.international, color: 'bg-emerald-400' },
  ].filter(s => s.count > 0);

  const total = segments.reduce((a, s) => a + s.count, 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1 rounded-full overflow-hidden w-12 bg-white/10">
        {segments.map(s => (
          <div key={s.key} className={`${s.color} h-full`} style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>
      <span className="text-[10px] text-white/30">{total}</span>
    </div>
  );
}

function MiniScores({ heat, substance }: { heat: number; substance: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center gap-1 text-[10px] text-orange-400/70">
        <Flame size={9} />
        {Math.round(heat * 100)}
      </span>
      <span className="flex items-center gap-1 text-[10px] text-cyan-400/70">
        <Beaker size={9} />
        {Math.round(substance * 100)}
      </span>
    </div>
  );
}

export function ClusterCard({ cluster, variant = 'standard' }: ClusterCardProps) {
  const navigate = useNavigate();
  const timeAgo = useTimeAgo(cluster.lastArticleAt);

  if (variant === 'hero') {
    return (
      <div
        onClick={() => navigate(`/cluster/${cluster.id}`)}
        className="group cursor-pointer relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[340px] animate-fade-in"
      >
        {cluster.heroImage ? (
          <img
            src={cluster.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-slate-900/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase">
              {cluster.topic}
            </span>
            <span className="text-[10px] text-white/40">•</span>
            <span className="text-[10px] text-white/40">{timeAgo}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3 max-w-2xl group-hover:text-indigo-100 transition-colors">
            {cluster.representativeHeadline}
          </h2>
          {cluster.summary && (
            <p className="text-sm text-white/60 leading-relaxed mb-4 max-w-xl line-clamp-2">
              {cluster.summary}
            </p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Users size={12} />
              <span>{cluster.articleCount} sources</span>
            </div>
            <BiasBar breakdown={cluster.sourceBreakdown} />
            <MiniScores heat={cluster.heatScore} substance={cluster.substanceScore} />
            <ArrowUpRight size={16} className="text-white/30 group-hover:text-indigo-400 transition-colors ml-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={() => navigate(`/cluster/${cluster.id}`)}
        className="group cursor-pointer relative rounded-2xl overflow-hidden flex flex-col bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 animate-fade-in h-full"
      >
        {cluster.heroImage ? (
          <div className="relative h-44 sm:h-48 overflow-hidden shrink-0">
            <img
              src={cluster.heroImage}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
          </div>
        )}

        <div className="flex flex-col flex-1 p-5 -mt-6 relative">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400/80 uppercase">
              {cluster.topic}
            </span>
            {cluster.heatScore > 0.7 && (
              <span className="flex items-center gap-0.5 text-[9px] text-orange-400/80 bg-orange-500/15 px-1.5 py-0.5 rounded-full font-medium">
                <Flame size={7} /> HOT
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-white leading-snug mb-2 group-hover:text-indigo-200 transition-colors line-clamp-3">
            {cluster.representativeHeadline}
          </h3>
          {cluster.summary && (
            <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-2 flex-1">
              {cluster.summary}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <BiasBar breakdown={cluster.sourceBreakdown} />
              <MiniScores heat={cluster.heatScore} substance={cluster.substanceScore} />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/25">
              <Clock size={9} />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/cluster/${cluster.id}`)}
      className="group cursor-pointer rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden animate-fade-in h-full"
    >
      <div className="flex gap-0 h-full">
        <div className="flex flex-col flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400/70 uppercase truncate">
              {cluster.topic}
            </span>
            {cluster.heatScore > 0.7 && (
              <Flame size={9} className="text-orange-400/70 shrink-0" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug mb-1.5 group-hover:text-indigo-200 transition-colors line-clamp-2">
            {cluster.representativeHeadline}
          </h3>
          {cluster.summary && (
            <p className="text-[11px] text-white/35 leading-relaxed mb-3 line-clamp-2">
              {cluster.summary}
            </p>
          )}
          <div className="flex items-center gap-3 mt-auto">
            <BiasBar breakdown={cluster.sourceBreakdown} />
            <MiniScores heat={cluster.heatScore} substance={cluster.substanceScore} />
            <span className="text-[10px] text-white/20 ml-auto">{timeAgo}</span>
          </div>
        </div>
        {cluster.heroImage && (
          <div className="shrink-0 w-24 sm:w-32 relative overflow-hidden">
            <img
              src={cluster.heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/50 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
