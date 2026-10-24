import React from 'react';

export interface StampBadgeProps {
  label?:
    | 'OBSERVED'
    | 'NOT OBSERVED'
    | 'AVAILABLE'
    | 'NOT AVAILABLE'
    | 'FIELD STUDY 1'
    | 'FILED'
    | 'VERIFIED'
    | string;
  color?: 'red' | 'ink' | 'cobalt' | 'forest';
  rotation?: string;
  className?: string;
}

export const StampBadge: React.FC<StampBadgeProps> = ({
  label = 'OBSERVED',
  color = 'red',
  rotation = '-rotate-2',
  className = '',
}) => {
  const colorStyles = {
    red: 'border-[var(--color-red-pen)] text-[var(--color-red-pen)] bg-[var(--color-red-pen)]/5',
    ink: 'border-[var(--color-ink)] text-[var(--color-ink)] bg-[var(--color-ink)]/5',
    cobalt: 'border-[var(--color-notebook)] text-[var(--color-notebook)] bg-[var(--color-notebook)]/5',
    forest: 'border-[var(--color-forest)] text-[var(--color-forest)] bg-[var(--color-forest)]/5',
  }[color];

  return (
    <div
      className={`inline-flex items-center stamp-badge border-2 border-dashed font-mono text-[11px] font-black uppercase tracking-[0.16em] px-2.5 py-0.5 select-none pointer-events-none ${colorStyles} ${rotation} ${className}`}
      aria-hidden="true"
    >
      <span className="opacity-95">{label}</span>
    </div>
  );
};
