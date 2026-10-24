import React from 'react';

interface ScribbleCircleProps {
  className?: string;
  children: React.ReactNode;
}

export const ScribbleCircle: React.FC<ScribbleCircleProps> = ({ className = '', children }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span>{children}</span>
      <svg
        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none overflow-visible"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 6 22 C 4 9, 35 2, 75 4 C 98 6, 96 32, 60 36 C 25 39, 8 28, 12 18"
          fill="none"
          stroke="var(--accent-red)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
        />
      </svg>
    </span>
  );
};

export const MarginArrow: React.FC<{ direction?: 'right' | 'left' | 'down'; className?: string }> = ({
  direction = 'right',
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 40 24"
      className={`inline-block pointer-events-none overflow-visible w-8 h-5 ${className}`}
      fill="none"
      stroke="var(--accent-red)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === 'right' && (
        <path d="M 2 12 Q 18 16, 32 10 M 24 4 L 33 10 L 26 18" />
      )}
      {direction === 'left' && (
        <path d="M 38 12 Q 22 16, 8 10 M 16 4 L 7 10 L 14 18" />
      )}
      {direction === 'down' && (
        <path d="M 20 2 Q 16 14, 20 28 M 12 20 L 20 29 L 28 20" />
      )}
    </svg>
  );
};

export const ProofmarkDele: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-serif italic font-bold text-[var(--accent-red)] select-none ${className}`} title="dele (delete/purge mark)">
    <svg className="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 6 6 Q 16 4, 18 10 Q 20 18, 10 18 Q 4 18, 8 10 L 18 4" />
    </svg>
  </span>
);

export const WashiTapeStrip: React.FC<{ className?: string; color?: 'neutral' | 'red' }> = ({
  className = '',
  color = 'neutral',
}) => (
  <div
    className={`h-5 w-24 sm:w-32 ${
      color === 'red' ? 'washi-tape-red' : 'washi-tape'
    } transform -rotate-2 select-none pointer-events-none rounded-[1px] ${className}`}
    style={{
      clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)',
    }}
  />
);

export const PaperclipBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-8 text-[#A3937C] filter drop-shadow-sm select-none pointer-events-none ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M 6 12 L 6 6 C 6 3 9 3 9 6 L 9 17 C 9 20 15 20 15 17 L 15 8 C 15 6.5 12 6.5 12 8 L 12 15" />
  </svg>
);
