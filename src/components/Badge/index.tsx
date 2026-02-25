import { clsx } from 'clsx';

type BadgeVariant = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'international' | 'heat' | 'substance' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  left: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'center-left': { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  center: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'center-right': { bg: 'rgba(236,72,153,0.12)', text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  right: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  international: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  heat: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  substance: { bg: 'rgba(6,182,212,0.12)', text: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
  default: { bg: 'var(--bg-elevated)', text: 'var(--text-tertiary)', border: 'var(--border-primary)' },
};

const BIAS_LABELS: Record<string, string> = {
  left: 'Left-leaning',
  'center-left': 'Center-Left',
  center: 'Center',
  'center-right': 'Center-Right',
  right: 'Right-leaning',
  international: 'Global',
};

export function Badge({ label, variant = 'default', className, size = 'sm' }: BadgeProps) {
  const displayLabel = BIAS_LABELS[label] ?? label;
  const colors = variantColors[variant] || variantColors.default;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {displayLabel}
    </span>
  );
}
