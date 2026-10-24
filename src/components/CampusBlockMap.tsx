import React, { useState, useEffect, useRef } from 'react';
import { DeliveredFacilityRow } from '../data/types';
import { getPhotoByFileMatch } from './AutoPhotoFrame';
import { Camera } from 'lucide-react';

export interface CampusBlockMapProps {
  facilities: DeliveredFacilityRow[];
  title?: string;
  onSelectFacility?: (facilityIndex: number) => void;
}

/**
 * Computes isometric 3D polygon points for a block at grid (col, row)
 */
function getIsometricCubeFaces(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  h: number
) {
  const top = `${cx},${cy - ry - h} ${cx + rx},${cy - h} ${cx},${cy + ry - h} ${cx - rx},${cy - h}`;
  const left = `${cx - rx},${cy - h} ${cx},${cy + ry - h} ${cx},${cy + ry} ${cx - rx},${cy}`;
  const right = `${cx},${cy + ry - h} ${cx + rx},${cy - h} ${cx + rx},${cy} ${cx},${cy + ry}`;
  const shadow = `${cx + 4},${cy - ry + 5} ${cx + rx + 4},${cy + 5} ${cx + 4},${cy + ry + 5} ${cx - rx + 4},${cy + 5}`;
  return { top, left, right, shadow };
}

export const CampusBlockMap: React.FC<CampusBlockMapProps> = ({
  facilities,
  onSelectFacility,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAssembled, setIsAssembled] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'A' | 'NA'>('ALL');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const [isLite, setIsLite] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-tier') === 'lite';
    }
    return false;
  });

  // Assemble blocks on scroll into viewport (or immediately when lite / reduced-motion)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkLite = () => document.documentElement.getAttribute('data-tier') === 'lite';
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || checkLite()) {
      setIsLite(checkLite());
      setIsAssembled(true);
      return;
    }

    const mo = new MutationObserver(() => {
      if (checkLite()) {
        setIsLite(true);
        setIsAssembled(true);
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tier'] });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAssembled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  if (!facilities || facilities.length === 0) return null;

  // Compute A / NA counts directly from data (never hardcoded)
  const availableCount = facilities.filter((f) => f.status === 'A').length;
  const notAvailableCount = facilities.filter((f) => f.status === 'NA').length;

  const selectedFacility = facilities[selectedIdx] || facilities[0];
  const selectedIsNA = selectedFacility.status === 'NA';
  const selectedDescription =
    selectedFacility.description && selectedFacility.description.trim().length > 0
      ? selectedFacility.description
      : 'Not available';

  const selectedPhotos = (selectedFacility.photos || [])
    .map((p) => getPhotoByFileMatch(p))
    .filter(Boolean);

  const handleFilterChange = (mode: 'ALL' | 'A' | 'NA') => {
    setFilterMode(mode);
    if (mode !== 'ALL' && facilities[selectedIdx]?.status !== mode) {
      const firstMatch = facilities.findIndex((f) => f.status === mode);
      if (firstMatch >= 0) setSelectedIdx(firstMatch);
    }
  };

  const handleSelectBlock = (idx: number) => {
    setSelectedIdx(idx);
    if (onSelectFacility) {
      onSelectFacility(idx);
    }
  };

  // Layout all facilities in a 3-column × N-row isometric architectural campus grid
  const cols = 3;
  const rowsCount = Math.ceil(facilities.length / cols);
  const svgHeight = Math.max(520, rowsCount * 76 + 80);

  return (
    <div
      ref={containerRef}
      data-redpen-component="CampusBlockMap"
      data-redpen-tokens="--color-chalk, --color-ink, --color-red-pen, --color-construction"
      className="my-[var(--space-24)] p-[var(--space-24)] shape-index-card break-inside-avoid space-y-[var(--space-20)]"
    >
      {/* Header: Computed A/NA Counts + Available / Not available Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-[var(--space-16)] border-b-2 border-[var(--color-ink)] pb-[var(--space-16)]">
        <div className="space-y-[var(--space-4)]">
          <div className="flex flex-wrap items-center gap-[var(--space-8)]">
            <h4 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
              Isometric campus facilities ghost-block map
            </h4>
            <span
              aria-hidden="true"
              className="px-[var(--space-8)] py-[2px] bg-[var(--color-construction)] text-[var(--color-chalk)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]"
            >
              {availableCount} A · {notAvailableCount} NA
            </span>
          </div>
          <p className="text-scale-14 text-[var(--color-chalk-muted)]">
            Click any block to open its index card with photos and observational notes. Status A blocks light up; Status NA blocks remain dashed ghost outlines.
          </p>
        </div>

        {/* Interactive Available / Not available filter toggle */}
        <div
          role="group"
          aria-label="Filter campus blocks by availability status"
          className="flex flex-wrap items-center gap-[var(--space-8)] no-print"
        >
          <button
            type="button"
            aria-pressed={filterMode === 'ALL'}
            onClick={() => handleFilterChange('ALL')}
            className={`px-[var(--space-12)] py-[var(--space-8)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-[var(--color-ink)] text-[var(--color-chalk)] shadow-[2px_2px_0_var(--color-ink)]'
                : 'bg-[var(--color-chalk-surface)] text-[var(--color-ink)] hover:bg-[var(--color-chalk)]'
            }`}
          >
            All ({facilities.length})
          </button>
          <button
            type="button"
            aria-pressed={filterMode === 'A'}
            onClick={() => handleFilterChange('A')}
            className={`px-[var(--space-12)] py-[var(--space-8)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] transition-colors cursor-pointer flex items-center gap-[var(--space-6)] ${
              filterMode === 'A'
                ? 'bg-[var(--color-construction)] text-[var(--color-chalk)] shadow-[2px_2px_0_var(--color-ink)]'
                : 'bg-[var(--color-chalk-surface)] text-[var(--color-ink)] hover:bg-[var(--color-chalk)]'
            }`}
          >
            <span className="w-2.5 h-2.5 inline-block bg-[var(--color-highlighter)] border border-[var(--color-ink)]" />
            <span>Available ({availableCount})</span>
          </button>
          <button
            type="button"
            aria-pressed={filterMode === 'NA'}
            onClick={() => handleFilterChange('NA')}
            className={`px-[var(--space-12)] py-[var(--space-8)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] transition-colors cursor-pointer flex items-center gap-[var(--space-6)] ${
              filterMode === 'NA'
                ? 'bg-[var(--color-red-pen)] text-[var(--color-chalk)] shadow-[2px_2px_0_var(--color-ink)]'
                : 'bg-[var(--color-chalk-surface)] text-[var(--color-ink)] hover:bg-[var(--color-chalk)]'
            }`}
          >
            <span className="w-2.5 h-2.5 inline-block bg-transparent border border-dashed border-current" />
            <span>Not available ({notAvailableCount})</span>
          </button>
        </div>
      </div>

      {/* Main Layout: 7-col Isometric SVG Map + 5-col Selected Facility Index Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-24)] items-start">
        {/* Left: Isometric Ghost-Block SVG Map */}
        <div className="lg:col-span-7 bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] p-[var(--space-12)] overflow-x-auto">
          <svg
            viewBox={`0 0 780 ${svgHeight}`}
            className="w-full h-auto min-w-[540px] block select-none"
            role="img"
            aria-label={`Isometric campus block map showing ${availableCount} available and ${notAvailableCount} not available facilities`}
          >
            {/* Isometric blueprint grid lines */}
            <g aria-hidden="true" stroke="rgba(12,22,18,0.07)" strokeWidth="1">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`vg-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={svgHeight} />
              ))}
              {Array.from({ length: Math.ceil(svgHeight / 40) + 1 }).map((_, i) => (
                <line key={`hg-${i}`} x1={0} y1={i * 40} x2={780} y2={i * 40} />
              ))}
            </g>

            {facilities.map((fac, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              // Staggered isometric campus grid coordinates
              const cx = 145 + col * 245 + (row % 2 === 1 ? 18 : -18);
              const cy = 68 + row * 74;
              const rx = 102;
              const ry = 26;

              const isAvail = fac.status === 'A';
              const isSelected = selectedIdx === idx;
              const isDimmed = filterMode !== 'ALL' && fac.status !== filterMode;
              const hasPhotos = Boolean(fac.photos && fac.photos.length > 0);
              const h = isAvail ? (isSelected ? 22 : 16) : 6;
              const faces = getIsometricCubeFaces(cx, cy, rx, ry, h);

              const shortLabel =
                fac.facility.length > 23
                  ? `${fac.facility.slice(0, 22)}…`
                  : fac.facility;

              const statusSubtext = isAvail
                ? hasPhotos
                  ? `A · ${fac.photos!.length} photo${fac.photos!.length > 1 ? 's' : ''}`
                  : 'A · Available'
                : 'NA · Not available';

              return (
                <g
                  key={`fac-block-${idx}`}
                  onClick={() => handleSelectBlock(idx)}
                  aria-hidden="true"
                  data-verify-source={fac.facility}
                  style={{
                    opacity: isAssembled || isLite ? (isDimmed ? 0.25 : 1) : 0,
                    transform: isLite
                      ? 'none'
                      : isAssembled
                      ? isSelected
                        ? 'translateY(-4px)'
                        : 'translateY(0px)'
                      : 'translateY(-28px)',
                    transition: isLite
                      ? 'none'
                      : `opacity 450ms cubic-bezier(0.22, 1, 0.36, 1) ${
                          idx * 32
                        }ms, transform 450ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 32}ms`,
                  }}
                  className="cursor-pointer"
                >
                  {/* Hard footprint shadow for Status A blocks */}
                  {isAvail && (
                    <polygon points={faces.shadow} fill="rgba(12, 22, 18, 0.22)" />
                  )}

                  {/* Left Isometric Wall */}
                  <polygon
                    points={faces.left}
                    fill={
                      isAvail
                        ? isSelected
                          ? '#0F6B45'
                          : '#CFE0D6'
                        : 'rgba(242, 245, 240, 0.25)'
                    }
                    stroke={isSelected ? '#E5301F' : '#0C1612'}
                    strokeWidth={isSelected ? '2.2' : '1.5'}
                    strokeDasharray={isAvail ? undefined : '5 4'}
                  />

                  {/* Right Isometric Wall */}
                  <polygon
                    points={faces.right}
                    fill={
                      isAvail
                        ? isSelected
                          ? '#09472D'
                          : '#B5CBBF'
                        : 'rgba(242, 245, 240, 0.15)'
                    }
                    stroke={isSelected ? '#E5301F' : '#0C1612'}
                    strokeWidth={isSelected ? '2.2' : '1.5'}
                    strokeDasharray={isAvail ? undefined : '5 4'}
                  />

                  {/* Top Isometric Roof Face */}
                  <polygon
                    points={faces.top}
                    fill={
                      isSelected
                        ? '#FFE600'
                        : isAvail
                        ? '#F8FAF6'
                        : 'rgba(242, 245, 240, 0.45)'
                    }
                    stroke={isSelected ? '#E5301F' : '#0C1612'}
                    strokeWidth={isSelected ? '2.5' : isAvail ? '2' : '1.5'}
                    strokeDasharray={isAvail ? undefined : '5 4'}
                  />

                  {/* Facility Name on Roof Face */}
                  <text
                    x={cx}
                    y={cy - h - 2}
                    textAnchor="middle"
                    fill="#0C1612"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="var(--font-display)"
                  >
                    {shortLabel}
                  </text>

                  {/* Status + Photo/Ghost Tag */}
                  <text
                    x={cx}
                    y={cy - h + 11}
                    textAnchor="middle"
                    fill={isAvail ? '#09472D' : '#E5301F'}
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                  >
                    {statusSubtext}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Active Facility Index Card (opens photos and description on click) */}
        <div
          aria-hidden="true"
          data-verify-source={selectedFacility.description}
          className="lg:col-span-5 p-[var(--space-24)] shape-index-card space-y-[var(--space-16)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-[var(--space-8)] border-b border-[var(--color-border-light)] pb-[var(--space-12)]">
            <span className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)]">
              BLOCK #{String(selectedIdx + 1).padStart(2, '0')} OF {facilities.length}
            </span>
            <span
              className={`px-[var(--space-8)] py-[2px] font-mono text-scale-12 font-bold border border-[var(--color-ink)] ${
                selectedIsNA
                  ? 'bg-[var(--color-chalk)] text-[var(--color-red-pen)] border-dashed'
                  : 'bg-[var(--color-construction)] text-[var(--color-chalk)]'
              }`}
            >
              {selectedIsNA ? 'Not available (NA)' : 'Available (A)'}
            </span>
          </div>

          <div className="space-y-[var(--space-8)]">
            <h5 className="font-display font-bold text-scale-24 text-[var(--color-ink)]">
              {selectedFacility.facility}
            </h5>
            <p
              className={`text-scale-17 ${
                selectedIsNA && !selectedFacility.description
                  ? 'text-[var(--color-chalk-muted)] italic'
                  : 'text-[var(--color-ink)]'
              }`}
            >
              {selectedDescription}
            </p>
          </div>

          {/* Facility Photos inside Index Card when present */}
          {selectedPhotos.length > 0 ? (
            <div className="space-y-[var(--space-12)] pt-[var(--space-8)] border-t border-[var(--color-border-light)]">
              <p className="font-mono text-scale-12 font-semibold text-[var(--color-construction)] flex items-center gap-[var(--space-6)]">
                <Camera size={14} aria-hidden="true" />
                <span>
                  {selectedPhotos.length} documented facility photograph
                  {selectedPhotos.length > 1 ? 's' : ''}
                </span>
              </p>
              <div className="grid grid-cols-1 gap-[var(--space-12)]">
                {selectedPhotos.map((photoRec) => (
                  <div
                    key={photoRec!.cleanKey}
                    className="p-[var(--space-12)] shape-index-card-plain space-y-[var(--space-8)]"
                  >
                    {photoRec!.src && (
                      <div className="border border-[var(--color-ink)] overflow-hidden bg-[var(--color-chalk)]">
                        <img
                          src={photoRec!.src}
                          alt={photoRec!.alt || selectedFacility.facility}
                          loading="lazy"
                          className="w-full h-auto object-cover block"
                        />
                      </div>
                    )}
                    <p className="text-scale-12 text-[var(--color-ink)] font-medium">
                      {photoRec!.caption || photoRec!.alt || photoRec!.file}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-[var(--space-8)] border-t border-[var(--color-border-light)]">
              <p className="text-scale-12 text-[var(--color-chalk-muted)]">
                {selectedIsNA
                  ? 'Dashed ghost outline — facility not present on campus.'
                  : 'Audited as available on campus (no separate photograph attached to this row).'}
              </p>
            </div>
          )}

          <div className="pt-[var(--space-4)]">
            <a
              href={`#facility-row-ep-02-fac-${selectedIdx + 1}`}
              className="btn-ghost text-scale-12 font-semibold text-[var(--color-notebook)] inline-block"
            >
              Jump to checklist table row ↓
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

