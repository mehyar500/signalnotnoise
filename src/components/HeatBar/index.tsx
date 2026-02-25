import { clsx } from 'clsx';

interface HeatBarProps {
  heat: number;
  substance: number;
  className?: string;
  showLabels?: boolean;
}

function getHeatLabel(heat: number, substance: number): string {
  if (heat > 0.7 && substance < 0.5) return 'High heat, low substance';
  if (heat > 0.7 && substance > 0.7) return 'High heat, high substance';
  if (heat < 0.4 && substance > 0.7) return 'Low heat, high substance';
  if (heat < 0.4 && substance < 0.4) return 'Low heat, low substance';
  return 'Balanced coverage';
}

export function HeatBar({ heat, substance, className, showLabels = false }: HeatBarProps) {
  const heatPct = Math.round(heat * 100);
  const substancePct = Math.round(substance * 100);
  const label = getHeatLabel(heat, substance);

  return (
    <div className={clsx('space-y-1.5', className)}>
      {showLabels && (
        <p className="text-xs text-white/50 font-medium">{label}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-orange-400/80 w-8 text-right">{heatPct}%</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${heatPct}%`,
              background: 'linear-gradient(to right, #f97316, #ef4444)',
            }}
          />
        </div>
        <span className="text-xs text-white/30">Heat</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-cyan-400/80 w-8 text-right">{substancePct}%</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${substancePct}%`,
              background: 'linear-gradient(to right, #06b6d4, #6366f1)',
            }}
          />
        </div>
        <span className="text-xs text-white/30">Substance</span>
      </div>
    </div>
  );
}
