import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, onClick, hoverable = false, glow = false }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border transition-all duration-300',
        hoverable && 'cursor-pointer hover:-translate-y-0.5',
        glow && 'animate-pulse-glow',
        onClick && !hoverable && 'cursor-pointer',
        className
      )}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={hoverable ? (e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)';
      } : undefined}
    >
      {children}
    </div>
  );
}
