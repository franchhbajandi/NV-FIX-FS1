import React from 'react';
import { ArrowUp } from 'lucide-react';

export interface BackToContentsProps {
  className?: string;
}

export const BackToContents: React.FC<BackToContentsProps> = ({ className = '' }) => {
  return (
    <div className={`no-print ${className}`}>
      <a
        href="#table-of-contents-trigger"
        className="btn-base btn-ghost font-semibold text-scale-14 inline-flex items-center gap-[var(--space-8)]"
      >
        <ArrowUp size={15} aria-hidden="true" />
        <span>Back to contents</span>
      </a>
    </div>
  );
};
