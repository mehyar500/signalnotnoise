import type { Cluster } from '@/types';

interface CoverageSpectrumProps {
  breakdown: Cluster['sourceBreakdown'];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showCounts?: boolean;
}

const SEGMENTS = [
  { key: 'left' as const, color: '#3b82f6', label: 'Left' },
  { key: 'center' as const, color: '#8b5cf6', label: 'Center' },
  { key: 'right' as const, color: '#ef4444', label: 'Right' },
  { key: 'international' as const, color: '#10b981', label: 'Global' },
];

export function CoverageSpectrum({ breakdown, size = 'md', showLabels = false, showCounts = false }: CoverageSpectrumProps) {
  const segments = SEGMENTS.map(s => ({
    ...s,
    count: breakdown[s.key] || 0,
  })).filter(s => s.count > 0);

  const total = segments.reduce((a, s) => a + s.count, 0);
  if (total === 0) return null;

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  const barWidth = size === 'sm' ? 'w-16' : size === 'lg' ? 'w-full' : 'w-24';

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex ${barHeight} rounded-full overflow-hidden ${barWidth}`} style={{ background: 'var(--spectrum-track)' }}>
        {segments.map(s => (
          <div
            key={s.key}
            style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
          />
        ))}
      </div>
      {(showLabels || showCounts) && (
        <div className="flex gap-3 flex-wrap">
          {segments.map(s => (
            <div key={s.key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {showLabels && s.label}
                {showCounts && <span className="font-medium ml-0.5" style={{ color: 'var(--text-secondary)' }}>{s.count}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function getBlindspotInfo(breakdown: Cluster['sourceBreakdown']): { isBlindsot: boolean; missing: string[]; dominant: string | null } {
  const total = breakdown.left + breakdown.center + breakdown.right + breakdown.international;
  if (total < 3) return { isBlindsot: false, missing: [], dominant: null };

  const missing: string[] = [];
  const labels: Record<string, number> = {
    'Left-leaning': breakdown.left,
    'Center': breakdown.center,
    'Right-leaning': breakdown.right,
  };

  let dominant: string | null = null;
  let maxRatio = 0;

  for (const [label, count] of Object.entries(labels)) {
    if (count === 0) missing.push(label);
    const ratio = count / total;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      dominant = label;
    }
  }

  return { isBlindsot: missing.length > 0 || maxRatio > 0.7, missing, dominant: maxRatio > 0.7 ? dominant : null };
}
