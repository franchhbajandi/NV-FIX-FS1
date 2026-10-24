import React from 'react';
import { BookOpen, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { Button } from './Button';
import { episodesData } from '../data/episodes';
import { getEpisodeId, getEpisodeStatus, isStatusPending, shouldHidePending } from '../data/contentIntake';

export interface MobileBottomBarProps {
  onOpenContents: () => void;
  activeEpisode: string;
  onSelectEpisode: (epNum: string) => void;
  onDownloadPdf: () => void;
  isPdfAvailable: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenContents,
  activeEpisode,
  onSelectEpisode,
  onDownloadPdf,
  isPdfAvailable,
}) => {
  const episodes = episodesData
    .filter((ep) => !(shouldHidePending() && isStatusPending(getEpisodeStatus(ep), getEpisodeId(ep))))
    .map((ep) => ep.number);
  const currentIndex = episodes.indexOf(activeEpisode);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  return (
    <nav
      aria-label="Mobile navigation"
      data-redpen-component="MobileBottomBar"
      data-redpen-tokens="--color-chalkboard, --color-chalk, --space-8"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 surface-chalkboard border-t-2 border-[var(--color-border-dark)] px-[var(--space-12)] py-[var(--space-8)] flex items-center justify-between gap-[var(--space-8)] no-print"
    >
      <Button
        variant="secondary-dark"
        onClick={onOpenContents}
        aria-label="Open table of contents"
      >
        <BookOpen size={16} aria-hidden="true" />
        <span>Contents</span>
      </Button>

      <div className="flex items-center gap-[var(--space-4)] surface-chalkboard-elevated border border-[var(--color-border-dark)] px-[var(--space-8)] rounded-[var(--radius-card)] min-h-[44px]">
        <a
          href={prevEp ? `#ep-${prevEp}` : `#ep-${activeEpisode}`}
          aria-label={prevEp ? `Previous episode ${prevEp}` : 'At first episode'}
          aria-disabled={!prevEp}
          onClick={(e) => {
            e.preventDefault();
            if (prevEp) onSelectEpisode(prevEp);
          }}
          className={`min-h-[40px] min-w-[36px] flex items-center justify-center ${
            !prevEp ? 'opacity-40 pointer-events-none' : 'hover:text-[var(--color-highlighter)]'
          }`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </a>

        <span className="font-display font-bold text-scale-14 px-[var(--space-8)] tabular-nums">
          Episode {activeEpisode}
        </span>

        <a
          href={nextEp ? `#ep-${nextEp}` : `#ep-${activeEpisode}`}
          aria-label={nextEp ? `Next episode ${nextEp}` : 'At final episode'}
          aria-disabled={!nextEp}
          onClick={(e) => {
            e.preventDefault();
            if (nextEp) onSelectEpisode(nextEp);
          }}
          className={`min-h-[40px] min-w-[36px] flex items-center justify-center ${
            !nextEp ? 'opacity-40 pointer-events-none' : 'hover:text-[var(--color-highlighter)]'
          }`}
        >
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>

      <Button
        variant="primary-highlighter"
        onClick={onDownloadPdf}
        disabled={!isPdfAvailable}
        aria-label={isPdfAvailable ? 'Download PDF' : 'PDF available after export'}
      >
        <Download size={16} aria-hidden="true" />
        <span>PDF</span>
      </Button>
    </nav>
  );
};
