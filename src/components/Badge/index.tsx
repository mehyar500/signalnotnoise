import { clsx } from 'clsx';

type BadgeVariant = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'international' | 'heat' | 'substance' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  left: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'center-left': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  center: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'center-right': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  right: 'bg-red-500/20 text-red-300 border-red-500/30',
  international: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  heat: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  substance: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  default: 'bg-white/10 text-white/70 border-white/20',
};

const BIAS_LABELS: Record<string, string> = {
  left: 'Left',
  'center-left': 'Center-Left',
  center: 'Center',
  'center-right': 'Center-Right',
  right: 'Right',
  international: 'International',
};

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  const displayLabel = BIAS_LABELS[label] ?? label;
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
