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
  if (heat > 0.7 && substance < 0.3) return { text: 'High heat, low substance', advisory: 'Read skeptically.', color: 'text-orange-400' };
  if (heat > 0.7 && substance < 0.5) return { text: 'High heat, low substance', advisory: 'Emotionally charged reporting.', color: 'text-orange-400' };
  if (heat > 0.7 && substance > 0.7) return { text: 'High heat, high substance', advisory: 'Important and well-reported.', color: 'text-amber-400' };
  if (heat < 0.3 && substance > 0.7) return { text: 'Low heat, high substance', advisory: 'Data-driven coverage.', color: 'text-cyan-400' };
  if (heat < 0.4 && substance > 0.5) return { text: 'Low heat, solid substance', advisory: 'Measured, factual reporting.', color: 'text-cyan-400' };
  if (heat < 0.3 && substance < 0.3) return { text: 'Low heat, low substance', advisory: 'Light coverage.', color: 'text-white/40' };
  return { text: 'Balanced coverage', advisory: 'Standard reporting.', color: 'text-purple-400' };
}

export function HeatBar({ heat, substance, className, showLabels = false, compact = false }: HeatBarProps) {
  const heatPct = Math.round(heat * 100);
  const substancePct = Math.round(substance * 100);
  const label = getHeatLabel(heat, substance);

  if (compact) {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <div className="flex items-center gap-1">
          <Flame size={10} className="text-orange-400/60" />
          <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${heatPct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Beaker size={10} className="text-cyan-400/60" />
          <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${substancePct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 w-20">
          <Flame size={12} className="text-orange-400/70" />
          <span className="text-xs text-orange-400/80 font-medium tabular-nums">{heatPct}%</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${heatPct}%`,
              background: 'linear-gradient(to right, #f97316, #ef4444)',
            }}
          />
        </div>
        <span className="text-[10px] text-white/25 w-16 text-right">Heat</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 w-20">
          <Beaker size={12} className="text-cyan-400/70" />
          <span className="text-xs text-cyan-400/80 font-medium tabular-nums">{substancePct}%</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${substancePct}%`,
              background: 'linear-gradient(to right, #06b6d4, #6366f1)',
            }}
          />
        </div>
        <span className="text-[10px] text-white/25 w-16 text-right">Substance</span>
      </div>
      {showLabels && (
        <p className={clsx('text-xs font-medium mt-1', label.color)}>
          {label.text}. <span className="text-white/40 font-normal">{label.advisory}</span>
        </p>
      )}
    </div>
  );
}
