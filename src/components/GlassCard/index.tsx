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
        'rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl transition-all duration-300',
        hoverable && 'cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-0.5',
        glow && 'animate-pulse-glow',
        onClick && !hoverable && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
