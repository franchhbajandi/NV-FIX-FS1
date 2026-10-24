import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { episodesData } from '../data/episodes';
import { institutionalData } from '../data/institutional';
import { educationalPhilosophy } from '../data/philosophy';
import { getEpisodeId, getEpisodeStatus, isStatusPending, shouldHidePending } from '../data/contentIntake';
import { Search, SlidersHorizontal, BookOpen, Download, Check, Printer } from 'lucide-react';

export interface TopBarProps {
  onOpenContents: () => void;
  activeEpisode: string;
  onSelectEpisode: (epNum: string) => void;
  navMode?: 'front-matter' | 'episodes';
  activeFrontMatter?: string;
  onSelectFrontMatter?: (targetId: string) => void;
  onOpenSearch?: () => void;
  isRedPenActive?: boolean;
  onToggleRedPen?: () => void;
  onOpenUnderTheHood?: () => void;
  onOpenPrint?: () => void;
  isPdfAvailable: boolean;
  onDownloadPdf: () => void;
}

const FRONT_MATTER_ITEMS: Array<{
  folio: string;
  id: string;
  label: string;
  pendingPath?: string;
}> = [
  {
    folio: 'i',
    id: 'acknowledgements',
    label: institutionalData.acknowledgement.title,
    pendingPath: 'institutional.acknowledgement',
  },
  {
    folio: 'ii',
    id: 'front-matter-toc',
    label: institutionalData.student.portfolioTitle,
  },
  {
    folio: 'iii',
    id: 'introduction',
    label: institutionalData.course.code,
  },
  {
    folio: 'iv',
    id: 'prayer',
    label: institutionalData.prayer.title,
    pendingPath: 'institutional.prayer',
  },
  {
    folio: 'v',
    id: 'philosophy',
    label: educationalPhilosophy.title,
    pendingPath: 'philosophy',
  },
  {
    folio: 'vi',
    id: 'cv',
    label: institutionalData.student.name,
  },
  {
    folio: 'vii',
    id: 'institutional-vmgo',
    label: institutionalData.institution.university,
  },
  {
    folio: 'viii',
    id: 'deped-mandates',
    label: institutionalData.depEdVMGO.coreValues.join(' · '),
  },
];

const EPISODE_CHIP_STYLE: Record<
  string,
  { bgVar: string; textVar: string }
> = {
  '01': { bgVar: 'var(--color-notebook)', textVar: 'var(--color-chalk)' },
  '02': { bgVar: 'var(--color-construction)', textVar: 'var(--color-chalk)' },
  '03': { bgVar: 'var(--color-plum)', textVar: 'var(--color-chalk)' },
  '04': { bgVar: 'var(--color-red-pen)', textVar: 'var(--color-chalk)' },
  '05': { bgVar: 'var(--color-highlighter)', textVar: 'var(--color-ink)' },
  '06': { bgVar: 'var(--color-construction-dark)', textVar: 'var(--color-chalk)' },
};

export const TopBar: React.FC<TopBarProps> = ({
  onOpenContents,
  activeEpisode,
  onSelectEpisode,
  navMode = 'episodes',
  activeFrontMatter = 'acknowledgements',
  onSelectFrontMatter,
  onOpenSearch,
  isRedPenActive = false,
  onToggleRedPen,
  onOpenUnderTheHood,
  onOpenPrint,
  isPdfAvailable,
  onDownloadPdf,
}) => {
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const [hoveredFrontMatter, setHoveredFrontMatter] = useState<string | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close Tools menu on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsToolsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hoveredEpisodeObj = episodesData.find((ep) => ep.number === hoveredChip);
  const hoveredFrontMatterObj = FRONT_MATTER_ITEMS.find((item) => item.id === hoveredFrontMatter);

  return (
    <header
      data-redpen-component="TopBar"
      data-redpen-tokens="--color-chalkboard, --color-chalk, --space-12, --space-24"
      className="sticky top-0 z-40 surface-chalkboard border-b-2 border-[var(--color-border-dark)] no-print"
    >
      <div className="max-w-7xl mx-auto px-[var(--space-16)] sm:px-[var(--space-24)] py-[var(--space-12)] flex items-center justify-between gap-[var(--space-16)]">
        {/* Left: Contents button */}
        <div className="flex items-center gap-[var(--space-12)] shrink-0">
          <Button
            variant="secondary-dark"
            onClick={onOpenContents}
            aria-label="Open table of contents"
            redpenName="Button (Contents)"
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>Contents</span>
          </Button>
        </div>

        {/* Center: Front-matter navigation during ceremonial section, switching to Episode Chips (01-06) at transition */}
        {navMode === 'front-matter' ? (
          <nav
            aria-label="Front-matter navigation"
            className="hidden md:flex items-center gap-[var(--space-8)] relative"
          >
            {FRONT_MATTER_ITEMS.map((item) => {
              const isPending = item.pendingPath ? isStatusPending(undefined, item.pendingPath) : false;
              if (shouldHidePending() && isPending) return null;
              const isActive = activeFrontMatter === item.id;

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  aria-label={`${item.folio} · ${item.label}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectFrontMatter?.(item.id);
                  }}
                  onMouseEnter={() => setHoveredFrontMatter(item.id)}
                  onMouseLeave={() => setHoveredFrontMatter(null)}
                  onFocus={() => setHoveredFrontMatter(item.id)}
                  onBlur={() => setHoveredFrontMatter(null)}
                  className={`min-h-[44px] min-w-[44px] px-[var(--space-12)] shape-episode-chip border-2 font-mono-tech text-scale-14 flex items-center justify-center transition-opacity duration-[var(--dur-fast)] ${
                    isActive
                      ? 'bg-[var(--color-chalk)] text-[var(--color-ink)] border-[var(--color-chalk)] shadow-[2px_2px_0_var(--color-ink)] font-bold'
                      : 'bg-[var(--color-chalkboard-elevated)] text-[var(--color-chalk)] border-[var(--color-border-dark)] hover:border-[var(--color-chalk)]'
                  }`}
                >
                  {item.folio}
                </a>
              );
            })}

            {hoveredFrontMatterObj && (
              <div
                role="status"
                className="absolute left-1/2 -translate-x-1/2 top-full mt-[var(--space-8)] px-[var(--space-12)] py-[var(--space-4)] surface-card border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] text-scale-12 font-semibold whitespace-nowrap pointer-events-none z-50"
              >
                {hoveredFrontMatterObj.folio} · {hoveredFrontMatterObj.label}
              </div>
            )}
          </nav>
        ) : (
          <nav
            aria-label="Learning episodes"
            className="hidden md:flex items-center gap-[var(--space-8)] relative"
          >
            {episodesData.map((ep) => {
              const epId = getEpisodeId(ep);
              const isPending = isStatusPending(getEpisodeStatus(ep), epId);
              if (shouldHidePending() && isPending) return null;
              const isActive = activeEpisode === ep.number;
              const chipColors = EPISODE_CHIP_STYLE[ep.number] || EPISODE_CHIP_STYLE['02'];

              return (
                <a
                  key={ep.number}
                  href={`#${epId}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Episode ${ep.number}: ${ep.title}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectEpisode(ep.number);
                  }}
                  onMouseEnter={() => setHoveredChip(ep.number)}
                  onMouseLeave={() => setHoveredChip(null)}
                  onFocus={() => setHoveredChip(ep.number)}
                  onBlur={() => setHoveredChip(null)}
                  style={
                    isActive
                      ? {
                          backgroundColor: chipColors.bgVar,
                          color: chipColors.textVar,
                          borderColor: 'var(--color-chalk)',
                        }
                      : undefined
                  }
                  className={`min-h-[44px] min-w-[44px] px-[var(--space-12)] shape-episode-chip border-2 font-display font-bold text-scale-14 flex items-center justify-center tabular-nums transition-transform duration-[var(--dur-fast)] ${
                    isActive
                      ? 'shadow-[2px_2px_0_var(--color-ink)]'
                      : 'bg-[var(--color-chalkboard-elevated)] text-[var(--color-chalk)] border-[var(--color-border-dark)] hover:border-[var(--color-chalk)]'
                  }`}
                >
                  {ep.number}
                </a>
              );
            })}

            {/* Hover / Focus Episode Title Tooltip */}
            {hoveredEpisodeObj && (
              <div
                role="status"
                className="absolute left-1/2 -translate-x-1/2 top-full mt-[var(--space-8)] px-[var(--space-12)] py-[var(--space-4)] surface-card border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] text-scale-12 font-semibold whitespace-nowrap pointer-events-none z-50"
              >
                Episode {hoveredEpisodeObj.number}: {hoveredEpisodeObj.title}
              </div>
            )}
          </nav>
        )}

        {/* Right: Search, Tools menu (Red-Pen Mode + Under the Hood), Download PDF */}
        <div className="flex items-center gap-[var(--space-8)] sm:gap-[var(--space-12)] shrink-0">
          {/* Search Trigger */}
          <Button
            variant="secondary-dark"
            onClick={onOpenSearch}
            aria-label="Search episodes and sections (Ctrl+K)"
            redpenName="Button (Search)"
          >
            <Search size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          {/* Tools Dropdown (Red-Pen Mode & Under the Hood) */}
          <div ref={toolsRef} className="relative">
            <Button
              variant="secondary-dark"
              aria-expanded={isToolsOpen}
              aria-haspopup="menu"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              redpenName="Button (Tools menu)"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span>Tools</span>
            </Button>

            {isToolsOpen && (
              <div
                role="menu"
                aria-label="Portfolio showcase tools"
                className="absolute right-0 top-full mt-[var(--space-8)] w-64 surface-card border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] p-[var(--space-8)] z-50 space-y-[var(--space-4)]"
              >
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isRedPenActive}
                  aria-pressed={isRedPenActive}
                  onClick={() => {
                    onToggleRedPen?.();
                    setIsToolsOpen(false);
                  }}
                  className="w-full min-h-[44px] px-[var(--space-12)] py-[var(--space-8)] text-left text-scale-14 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-chalk)] flex items-center justify-between gap-[var(--space-8)] rounded-[var(--radius-card)]"
                >
                  <span>Red-Pen Mode</span>
                  <span
                    className={`px-[var(--space-8)] py-[var(--space-4)] text-scale-12 font-bold border border-[var(--color-ink)] ${
                      isRedPenActive
                        ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)]'
                        : 'bg-[var(--color-chalk)] text-[var(--color-chalk-muted)]'
                    }`}
                  >
                    {isRedPenActive ? 'On' : 'Off'}
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenUnderTheHood?.();
                    setIsToolsOpen(false);
                  }}
                  className="w-full min-h-[44px] px-[var(--space-12)] py-[var(--space-8)] text-left text-scale-14 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-chalk)] flex items-center justify-between gap-[var(--space-8)] rounded-[var(--radius-card)]"
                >
                  <span>Under the hood</span>
                  <span className="text-scale-12 text-[var(--color-chalk-muted)]">Telemetry</span>
                </button>

                {onOpenPrint && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onOpenPrint();
                      setIsToolsOpen(false);
                    }}
                    className="w-full min-h-[44px] px-[var(--space-12)] py-[var(--space-8)] text-left text-scale-14 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-chalk)] flex items-center justify-between gap-[var(--space-8)] border-t border-[var(--color-border-light)] pt-[var(--space-8)]"
                  >
                    <span className="flex items-center gap-[var(--space-8)]">
                      <Printer size={15} aria-hidden="true" />
                      <span>Open print edition (/print)</span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Primary Action: Download PDF */}
          <div className="hidden sm:block">
            <Button
              variant="primary-highlighter"
              onClick={onDownloadPdf}
              disabled={!isPdfAvailable}
              disabledReason="PDF available after export"
              redpenName="Button (Download PDF)"
            >
              <Download size={16} aria-hidden="true" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
