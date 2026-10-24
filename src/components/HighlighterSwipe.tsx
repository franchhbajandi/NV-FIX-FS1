import React from 'react';

interface HighlighterSwipeProps {
  children: React.ReactNode;
  color?: 'yellow' | 'terracotta' | 'sage' | 'ochre' | 'indigo';
  className?: string;
}

export const HighlighterSwipe: React.FC<HighlighterSwipeProps> = ({
  children,
  color = 'yellow',
  className = '',
}) => {
  const colorMap = {
    yellow: 'highlight-yellow',
    terracotta: 'highlight-terracotta',
    sage: 'highlight-sage',
    ochre: 'highlight-yellow',
    indigo: 'highlight-sage',
  };

  return (
    <span className={`inline ${colorMap[color]} font-medium ${className}`}>
      {children}
    </span>
  );
};
