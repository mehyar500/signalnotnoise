import { Eye, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/GlassCard';
import { CoverageSpectrum, getBlindspotInfo } from '@/components/CoverageSpectrum';
import { Badge } from '@/components/Badge';
import { HeatBar } from '@/components/HeatBar';
import { useGetBlindspotClustersQuery } from '@/services/api';

export function Blindspot() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetBlindspotClustersQuery();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: 'var(--blindspot-bg, rgba(239,68,68,0.1))' }}>
            <Eye size={18} style={{ color: 'var(--accent-warning, #f59e0b)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Blindspot</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Stories where perspectives are missing or one side dominates coverage
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-2xl h-32" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      )}

      {isError && (
        <GlassCard>
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-muted)' }}>Failed to load blindspot stories</p>
          </div>
        </GlassCard>
      )}

      {data && data.items.length === 0 && (
        <GlassCard>
          <div className="text-center py-12 space-y-3">
            <Eye size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No blindspots detected
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              All current stories have balanced perspective coverage
            </p>
          </div>
        </GlassCard>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {data.total} {data.total === 1 ? 'story' : 'stories'} with coverage gaps
          </p>

          {data.items.map(cluster => {
            const blindspot = getBlindspotInfo(cluster.sourceBreakdown);

            return (
              <GlassCard key={cluster.id}>
                <button
                  onClick={() => navigate(`/cluster/${cluster.id}`)}
                  className="w-full text-left p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge label={cluster.topic} variant="topic" />
                        {blindspot.dominant && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            <AlertTriangle size={9} />
                            {blindspot.dominant} dominated
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {cluster.representativeHeadline}
                      </h3>

                      {cluster.summary && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                          {cluster.summary}
                        </p>
                      )}
                    </div>

                    {cluster.heroImage && (
                      <img
                        src={cluster.heroImage}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                        style={{ border: '1px solid var(--border-primary)' }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CoverageSpectrum breakdown={cluster.sourceBreakdown} size="sm" />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {cluster.sourceCount} sources
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <HeatBar heat={cluster.heatScore} substance={cluster.substanceScore} />
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {blindspot.missing.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Missing:</span>
                      {blindspot.missing.map(m => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            color: 'var(--text-tertiary)',
                            border: '1px solid rgba(239,68,68,0.15)',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
