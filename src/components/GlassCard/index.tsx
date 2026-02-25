import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GlassCard({ children, className, onClick, hoverable = false }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md',
        hoverable && 'cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
