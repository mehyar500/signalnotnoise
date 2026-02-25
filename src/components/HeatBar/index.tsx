import { clsx } from 'clsx';
import { Flame, Beaker } from 'lucide-react';

interface HeatBarProps {
  heat: number;
  substance: number;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

function getHeatLabel(heat: number, substance: number): { text: string; advisory: string; color: string } {
  if (heat > 0.7 && substance < 0.3) return { text: 'High heat, low substance', advisory: 'Read skeptically.', color: 'var(--heat-text)' };
  if (heat > 0.7 && substance < 0.5) return { text: 'High heat, low substance', advisory: 'Emotionally charged reporting.', color: 'var(--heat-text)' };
  if (heat > 0.7 && substance > 0.7) return { text: 'High heat, high substance', advisory: 'Important and well-reported.', color: 'var(--warning-text)' };
  if (heat < 0.3 && substance > 0.7) return { text: 'Low heat, high substance', advisory: 'Data-driven coverage.', color: 'var(--substance-text)' };
  if (heat < 0.4 && substance > 0.5) return { text: 'Low heat, solid substance', advisory: 'Measured, factual reporting.', color: 'var(--substance-text)' };
  if (heat < 0.3 && substance < 0.3) return { text: 'Low heat, low substance', advisory: 'Light coverage.', color: 'var(--text-tertiary)' };
  return { text: 'Balanced coverage', advisory: 'Standard reporting.', color: 'var(--accent-text)' };
}

export function HeatBar({ heat, substance, className, showLabels = false, compact = false }: HeatBarProps) {
  const heatPct = Math.round(heat * 100);
  const substancePct = Math.round(substance * 100);
  const label = getHeatLabel(heat, substance);

  if (compact) {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <div className="flex items-center gap-1">
          <Flame size={10} style={{ color: 'var(--heat-text)', opacity: 0.7 }} />
          <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'var(--spectrum-track)' }}>
            <div className="h-full rounded-full" style={{ width: `${heatPct}%`, background: 'linear-gradient(to right, #f97316, #ef4444)' }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Beaker size={10} style={{ color: 'var(--substance-text)', opacity: 0.7 }} />
          <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'var(--spectrum-track)' }}>
            <div className="h-full rounded-full" style={{ width: `${substancePct}%`, background: 'linear-gradient(to right, #06b6d4, #6366f1)' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 w-20">
          <Flame size={12} style={{ color: 'var(--heat-text)', opacity: 0.8 }} />
          <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--heat-text)' }}>{heatPct}%</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full relative overflow-hidden" style={{ background: 'var(--spectrum-track)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${heatPct}%`, background: 'linear-gradient(to right, #f97316, #ef4444)' }} />
        </div>
        <span className="text-[10px] w-16 text-right" style={{ color: 'var(--text-muted)' }}>Heat</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 w-20">
          <Beaker size={12} style={{ color: 'var(--substance-text)', opacity: 0.8 }} />
          <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--substance-text)' }}>{substancePct}%</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full relative overflow-hidden" style={{ background: 'var(--spectrum-track)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${substancePct}%`, background: 'linear-gradient(to right, #06b6d4, #6366f1)' }} />
        </div>
        <span className="text-[10px] w-16 text-right" style={{ color: 'var(--text-muted)' }}>Substance</span>
      </div>
      {showLabels && (
        <p className="text-xs font-medium mt-1" style={{ color: label.color }}>
          {label.text}. <span style={{ color: 'var(--text-tertiary)' }} className="font-normal">{label.advisory}</span>
        </p>
      )}
    </div>
  );
}
