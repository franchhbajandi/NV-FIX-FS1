import React from 'react';

export interface DropCapProps {
  letter: string;
  className?: string;
}

export const DropCap: React.FC<DropCapProps> = ({ letter, className = '' }) => {
  return (
    <span
      className={`float-left font-display font-extrabold text-scale-64 pt-[var(--space-4)] pr-[var(--space-12)] text-[var(--color-red-pen)] select-none ${className}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
};
