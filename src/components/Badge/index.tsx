import { clsx } from 'clsx';

type BadgeVariant = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'international' | 'heat' | 'substance' | 'topic' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  left: { bg: 'var(--bias-left-bg)', text: 'var(--bias-left)', border: 'var(--bias-left-border)' },
  'center-left': { bg: 'var(--bias-center-bg)', text: 'var(--bias-center)', border: 'var(--bias-center-border)' },
  center: { bg: 'var(--bias-center-bg)', text: 'var(--bias-center)', border: 'var(--bias-center-border)' },
  'center-right': { bg: 'var(--bias-right-bg)', text: 'var(--bias-right)', border: 'var(--bias-right-border)' },
  right: { bg: 'var(--bias-right-bg)', text: 'var(--bias-right)', border: 'var(--bias-right-border)' },
  international: { bg: 'var(--bias-intl-bg)', text: 'var(--bias-intl)', border: 'var(--bias-intl-border)' },
  heat: { bg: 'var(--warning-bg)', text: 'var(--heat-text)', border: 'var(--warning-border)' },
  substance: { bg: 'var(--accent-bg)', text: 'var(--substance-text)', border: 'var(--border-primary)' },
  topic: { bg: 'var(--bg-elevated)', text: 'var(--text-tertiary)', border: 'var(--border-primary)' },
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
