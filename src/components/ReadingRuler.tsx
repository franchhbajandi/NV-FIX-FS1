import React from 'react';

interface ReadingRulerProps {
  activeEpisode: string; // e.g. '01', '02', '03', '04', '05', '06'
  onSelectEpisode: (epNum: string) => void;
  scrollProgress: number; // 0 to 100
}

export const ReadingRuler: React.FC<ReadingRulerProps> = ({
  activeEpisode,
  onSelectEpisode,
  scrollProgress,
}) => {
  const episodes = ['01', '02', '03', '04', '05', '06'];

  return (
    <div
      className="sticky top-[86px] sm:top-[94px] z-30 bg-[var(--bg-canvas)]/90 backdrop-blur-sm border-b border-[var(--border-rule)] py-1.5 px-4 sm:px-8 no-print select-none"
      aria-label="Episode Reading Ruler"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-mono">
        {/* Ruler Left Label */}
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <span className="text-[var(--accent-red)] font-semibold uppercase tracking-wider text-[10px]">
            FIELD RAIL
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Episodes</span>
        </div>

        {/* Ruler Center: Episode Ticks */}
        <div className="flex items-center gap-1 sm:gap-4 md:gap-6">
          {episodes.map((epNum) => {
            const isActive = activeEpisode === epNum;
            return (
              <button
                key={epNum}
                type="button"
                onClick={() => onSelectEpisode(epNum)}
                className={`relative px-2 py-0.5 transition-all text-xs flex items-center gap-1 group ${
                  isActive
                    ? 'text-[var(--accent-red)] font-semibold'
                    : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
                }`}
              >
                <span className="text-[10px] opacity-60">EP.</span>
                <span>{epNum}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[var(--accent-red)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Ruler Right: Dynamic Reading Percentage */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] tabular-nums">
          <div className="w-16 h-1 bg-[var(--border-rule)] rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-[var(--accent-red)] transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, scrollProgress))}%` }}
            />
          </div>
          <span>{Math.round(scrollProgress)}%</span>
        </div>
      </div>
    </div>
  );
};
