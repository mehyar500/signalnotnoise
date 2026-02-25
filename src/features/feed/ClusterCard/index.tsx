import { useNavigate } from 'react-router-dom';
import { Users, Clock, ArrowUpRight, Flame, Beaker, Newspaper, AlertTriangle } from 'lucide-react';
import { CoverageSpectrum, getBlindspotInfo } from '@/components/CoverageSpectrum';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Cluster } from '@/types';

interface ClusterCardProps {
  cluster: Cluster;
  variant?: 'hero' | 'featured' | 'standard';
}

function MiniScores({ heat, substance }: { heat: number; substance: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--heat-text)', opacity: 0.8 }}>
        <Flame size={9} />
        {Math.round(heat * 100)}
      </span>
      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--substance-text)', opacity: 0.8 }}>
        <Beaker size={9} />
        {Math.round(substance * 100)}
      </span>
    </div>
  );
}

function SourceCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
      <Users size={12} />
      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{count}</span>
      <span>sources</span>
    </div>
  );
}

function BlindspotBadge() {
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: 'var(--warning-text)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
      <AlertTriangle size={8} />
      BLINDSPOT
    </span>
  );
}

function ImageBlock({ src, className }: { src: string | null; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: 'var(--bg-elevated)' }}>
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Newspaper size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
    </div>
  );
}

export function ClusterCard({ cluster, variant = 'standard' }: ClusterCardProps) {
  const navigate = useNavigate();
  const timeAgo = useTimeAgo(cluster.lastArticleAt);
  const blindspot = getBlindspotInfo(cluster.sourceBreakdown);

  if (variant === 'hero') {
    return (
      <div
        onClick={() => navigate(`/cluster/${cluster.id}`)}
        className="group cursor-pointer relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[340px] animate-fade-in"
      >
        {cluster.heroImage ? (
          <img src={cluster.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="eager" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'var(--bg-elevated)' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />

        <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--accent-text)' }}>{cluster.topic}</span>
            {blindspot.isBlindsot && <BlindspotBadge />}
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{timeAgo}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3 max-w-2xl transition-colors" style={{ color: '#ffffff' }}>
            {cluster.representativeHeadline}
          </h2>
          {cluster.summary && (
            <p className="text-sm leading-relaxed mb-4 max-w-xl line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{cluster.summary}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <SourceCount count={cluster.articleCount} />
            <CoverageSpectrum breakdown={cluster.sourceBreakdown} size="sm" />
            <MiniScores heat={cluster.heatScore} substance={cluster.substanceScore} />
            <ArrowUpRight size={16} className="transition-colors ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={() => navigate(`/cluster/${cluster.id}`)}
        className="group cursor-pointer relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 animate-fade-in h-full border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
      >
        <ImageBlock src={cluster.heroImage} className="h-44 sm:h-48 shrink-0" />

        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--accent-text)', opacity: 0.8 }}>{cluster.topic}</span>
            {blindspot.isBlindsot && <BlindspotBadge />}
            {cluster.heatScore > 0.7 && (
              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ color: 'var(--heat-text)', background: 'rgba(249,115,22,0.12)' }}>
                <Flame size={7} /> HOT
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold leading-snug mb-2 line-clamp-3 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {cluster.representativeHeadline}
          </h3>
          {cluster.summary && (
            <p className="text-xs leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: 'var(--text-tertiary)' }}>{cluster.summary}</p>
          )}
          <div className="mt-auto pt-3 space-y-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <SourceCount count={cluster.articleCount} />
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <Clock size={9} />
                <span>{timeAgo}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <CoverageSpectrum breakdown={cluster.sourceBreakdown} size="sm" />
              <MiniScores heat={cluster.heatScore} substance={cluster.substanceScore} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/cluster/${cluster.id}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden animate-fade-in h-full flex flex-col border transition-all duration-300"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <ImageBlock src={cluster.heroImage} className="h-32 sm:h-36 shrink-0" />

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[9px] font-bold tracking-widest uppercase truncate" style={{ color: 'var(--accent-text)', opacity: 0.7 }}>{cluster.topic}</span>
          {blindspot.isBlindsot && <BlindspotBadge />}
          {cluster.heatScore > 0.7 && <Flame size={8} style={{ color: 'var(--heat-text)', opacity: 0.7 }} className="shrink-0" />}
        </div>
        <h3 className="text-[13px] font-semibold leading-snug mb-1.5 transition-colors line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {cluster.representativeHeadline}
        </h3>
        {cluster.summary && (
          <p className="text-[11px] leading-relaxed mb-2 line-clamp-2 flex-1" style={{ color: 'var(--text-muted)' }}>{cluster.summary}</p>
        )}
        <div className="mt-auto pt-2 space-y-1.5" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              <Users size={10} /> {cluster.articleCount} sources
            </div>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{timeAgo}</span>
          </div>
          <CoverageSpectrum breakdown={cluster.sourceBreakdown} size="sm" />
        </div>
      </div>
    </div>
  );
}
