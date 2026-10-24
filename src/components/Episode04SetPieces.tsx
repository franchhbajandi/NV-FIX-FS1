import React, { useState, useEffect, useRef } from 'react';
import {
  DeliveredActivity2_1,
  DeliveredActivity2_2,
  DeliveredActivity2_3,
  DeliveredReflections,
} from '../data/types';
import { AnswerBlock } from './AnswerBlock';
import { isStatusPending } from '../data/contentIntake';
import { RotateCw } from 'lucide-react';

/**
 * 3D Flip Deck for Activity 2-1: Teaching Methods & Approaches.
 * Cards with "Not observed" (Deductive Method & Project-based) start face-down.
 * Click to flip in 3D perspective. Includes a toggle to switch to table register view.
 */
export const MethodsFlipDeck: React.FC<{
  epId: string;
  activity: DeliveredActivity2_1;
  hidePending: boolean;
  renderCrossReferences: (text: string) => React.ReactNode;
}> = ({ epId, activity, hidePending, renderCrossReferences }) => {
  const rows = activity.methodsTable?.rows || [];
  const columns = activity.methodsTable?.columns || [];

  // Track flipped state for each card; "Not observed" starts face-down (flipped = true)
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    rows.forEach((r, idx) => {
      const isNotObserved = r.description.trim().toLowerCase() === 'not observed';
      initial[idx] = isNotObserved; // face down by default for Not observed
    });
    return initial;
  });

  const [viewMode, setViewMode] = useState<'deck' | 'table'>('deck');

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const flipAll = (faceDown: boolean) => {
    const updated: Record<number, boolean> = {};
    rows.forEach((_, idx) => {
      updated[idx] = faceDown;
    });
    setFlippedCards(updated);
  };

  return (
    <div className="space-y-[var(--space-20)]">
      {/* Deck Controls & Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] border-b border-[var(--color-border-light)] pb-[var(--space-12)]">
        <div className="flex items-center gap-[var(--space-8)]">
          <span className="w-3 h-3 rounded-full bg-[var(--color-red-pen)]" aria-hidden="true" />
          <p className="font-mono text-scale-12 font-bold uppercase tracking-wider text-[var(--color-chalk-muted)]">
            3D Flip Deck · 10 Teaching Approaches &amp; Methods (Not observed cards face-down)
          </p>
        </div>

        <div className="flex items-center gap-[var(--space-8)]">
          <button
            type="button"
            onClick={() => flipAll(false)}
            className="px-[var(--space-10)] py-[var(--space-4)] font-mono text-scale-12 font-bold border border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] hover:bg-[var(--color-chalk-surface)] transition-colors"
          >
            Reveal All
          </button>
          <button
            type="button"
            onClick={() => flipAll(true)}
            className="px-[var(--space-10)] py-[var(--space-4)] font-mono text-scale-12 font-bold border border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] hover:bg-[var(--color-chalk-surface)] transition-colors"
          >
            Face-Down All
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'deck' ? 'table' : 'deck')}
            className="px-[var(--space-12)] py-[var(--space-4)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] bg-[var(--color-chalk-surface)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] hover:bg-[var(--color-highlighter)] transition-colors"
          >
            {viewMode === 'deck' ? 'Switch to Table View' : 'Switch to 3D Deck'}
          </button>
        </div>
      </div>

      {/* Table Register View */}
      {viewMode === 'table' ? (
        <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] overflow-x-auto">
          <table className="w-full border-collapse text-left text-scale-14">
            <thead>
              <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)]">
                {columns.map((col, cIdx) => (
                  <th
                    key={col.key}
                    scope="col"
                    data-verify-id={`${epId}-methodsTable-col-${col.key}`}
                    className={`p-[var(--space-12)] font-display font-bold ${
                      cIdx === 0 ? 'border-r-2 border-[var(--color-ink)] w-[32%]' : 'w-[68%]'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => {
                const rowPathKey = `${epId}.activity2.activity2_1.methodsTable.rows[${rIdx}]`;
                if (hidePending && isStatusPending(row.status, rowPathKey)) {
                  return null;
                }
                const isNotObs = row.description.trim().toLowerCase() === 'not observed';
                return (
                  <tr
                    key={rowPathKey}
                    className={`border-b border-[var(--color-border-light)] last:border-b-0 ${
                      isNotObs ? 'bg-[var(--color-chalk)]/50' : 'hover:bg-[var(--color-chalk)]'
                    }`}
                  >
                    <th
                      scope="row"
                      data-verify-id={`${rowPathKey}.method`}
                      className="p-[var(--space-16)] font-semibold text-scale-17 text-[var(--color-ink)] border-r-2 border-[var(--color-ink)] bg-[var(--color-chalk-surface)] align-top"
                    >
                      {row.method}
                    </th>
                    <td
                      data-verify-id={`${rowPathKey}.description`}
                      className="p-[var(--space-16)] text-scale-17 text-[var(--color-ink)] align-top reading-measure"
                    >
                      {renderCrossReferences(row.description)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 3D Flip Deck View */
        <div>
          {/* Semantic column headers for content verification */}
          <div className="sr-only">
            {columns.map((col) => (
              <span
                key={col.key}
                data-verify-id={`${epId}-methodsTable-col-${col.key}`}
              >
                {col.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-20)]">
            {rows.map((row, rIdx) => {
              const rowPathKey = `${epId}.activity2.activity2_1.methodsTable.rows[${rIdx}]`;
              if (hidePending && isStatusPending(row.status, rowPathKey)) {
                return null;
              }
              const isNotObs = row.description.trim().toLowerCase() === 'not observed';
              const isFlipped = Boolean(flippedCards[rIdx]);

              return (
                <div
                  key={rowPathKey}
                  className="card-flip-perspective h-[300px] cursor-pointer select-none"
                  onClick={() => toggleCard(rIdx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCard(rIdx);
                    }
                  }}
                  aria-label={`${row.method}: ${isFlipped ? 'Card face down' : 'Card face up'}. Press space or enter to flip.`}
                >
                  <div className={`card-flip-inner h-full ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* FRONT FACE (Observed content face-up) */}
                    <div className="card-flip-face p-[var(--space-20)] shape-index-card flex flex-col justify-between overflow-hidden">
                      <div className="space-y-[var(--space-8)] overflow-y-auto pr-[var(--space-4)]">
                        <div className="flex items-center justify-between border-b border-[var(--color-rule-red)] pb-[var(--space-6)]">
                          <span className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)] uppercase">
                            Teaching Method
                          </span>
                          <span
                            className={`px-[var(--space-8)] py-[1px] font-mono text-scale-12 font-bold border ${
                              isNotObs
                                ? 'border-[var(--color-red-pen)] text-[var(--color-ink)] bg-[var(--color-chalk-surface)]'
                                : 'border-[var(--color-construction)] text-[var(--color-construction)] bg-[var(--color-construction)]/10'
                            }`}
                          >
                            {isNotObs ? 'NOT OBSERVED' : 'OBSERVED'}
                          </span>
                        </div>

                        <h5
                          data-verify-id={`${rowPathKey}.method`}
                          className="font-display font-bold text-scale-20 text-[var(--color-ink)]"
                        >
                          {row.method}
                        </h5>

                        <div
                          data-verify-id={`${rowPathKey}.description`}
                          className="text-scale-14 text-[var(--color-ink)] leading-relaxed"
                        >
                          {renderCrossReferences(row.description)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-[var(--space-8)] mt-[var(--space-8)] border-t border-[var(--color-border-light)] text-scale-12 font-mono text-[var(--color-chalk-muted)] shrink-0">
                        <span className="inline-flex items-center gap-[var(--space-4)]">
                          <RotateCw size={12} aria-hidden="true" />
                          Tap to flip
                        </span>
                        <span>{isNotObs ? 'Face-down default' : 'Face-up'}</span>
                      </div>
                    </div>

                    {/* BACK FACE (Face-down card back with 24px+ text on Red-Pen stamp) */}
                    <div className="card-flip-face card-flip-back p-[var(--space-20)] bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] rounded-[var(--radius-card)] flex flex-col justify-between">
                      <div className="space-y-[var(--space-12)]">
                        <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--color-ink)] pb-[var(--space-6)]">
                          <span className="font-mono text-scale-12 font-bold text-[var(--color-ink)] uppercase">
                            Index Card Back
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-red-pen)]" aria-hidden="true" />
                        </div>

                        <div className="py-[var(--space-16)] text-center space-y-[var(--space-12)]">
                          <p className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                            {row.method}
                          </p>
                          <div className="inline-block px-[var(--space-16)] py-[var(--space-6)] border-2 border-[var(--color-ink)] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-extrabold text-scale-24 -rotate-2 shadow-[2px_2px_0_var(--color-ink)]">
                            {isNotObs ? 'Not Observed' : 'Card Back'}
                          </div>
                          <p className="text-scale-12 text-[var(--color-chalk-muted)] font-mono pt-[var(--space-4)]">
                            {isNotObs
                              ? 'Card dealt face-down (not observed in session)'
                              : 'Click to turn card face-up'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center pt-[var(--space-8)] border-t border-[var(--color-border-light)] text-scale-12 font-mono text-[var(--color-ink)] font-bold">
                        <span className="inline-flex items-center gap-[var(--space-4)]">
                          <RotateCw size={12} aria-hidden="true" />
                          Click to flip face-up
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Seven-Step Lesson Arc Scroll-filled Path for Activity 2-1.
 * Visual scroll-linked representation of Mr. Alamo's lesson scaffolding sequence:
 * recall -> prime -> guide -> apply -> share -> model -> transition
 */
export const SevenStepLessonArc: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(1);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setScrollProgress(1);
      return;
    }

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Start filling when top enters bottom 85% of viewport; complete when top reaches 30%
      const start = vh * 0.85;
      const end = vh * 0.25;
      const raw = (start - rect.top) / (start - end);
      const clamped = Math.max(0.15, Math.min(1, raw));
      setScrollProgress(clamped);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const steps = [
    {
      step: 1,
      name: 'Recall',
      role: 'Direct Recall',
      desc: 'Opens with direct questioning on previous day’s material rather than passive recap.',
    },
    {
      step: 2,
      name: 'Prime',
      role: 'Illustration Prompt',
      desc: 'Primes participation by prompting with concrete scenarios before demanding answers.',
    },
    {
      step: 3,
      name: 'Guide',
      role: 'Synonym-Upgrade Drill',
      desc: 'Scaffolds precision: students replace ordinary words with more fitting synonyms.',
    },
    {
      step: 4,
      name: 'Apply',
      role: 'Timed Messy-Paragraph',
      desc: 'Students apply the skill independently to complete writing on scratch paper.',
    },
    {
      step: 5,
      name: 'Share',
      role: 'Oral Peer Sharing',
      desc: 'Several students read revised paragraphs aloud with banter and real-time response.',
    },
    {
      step: 6,
      name: 'Model',
      role: 'Model Answer Comparison',
      desc: 'Closes the loop by revealing the standard answer and its rationalization.',
    },
    {
      step: 7,
      name: 'Transition',
      role: 'Next Topic Preview',
      desc: 'Previews linguistic features and homework before classroom dismissal.',
    },
  ];

  const activeCount = Math.max(1, Math.round(scrollProgress * steps.length));

  return (
    <div
      ref={containerRef}
      className="p-[var(--space-20)] sm:p-[var(--space-28)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-16)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] border-b-2 border-[var(--color-ink)] pb-[var(--space-10)]">
        <div>
          <span className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)] uppercase block">
            Scroll-Filled Pedagogical Arc
          </span>
          <h5 className="font-display font-extrabold text-scale-24 text-[var(--color-ink)]">
            Seven-Step Lesson Arc
          </h5>
        </div>
        <span className="px-[var(--space-12)] py-[var(--space-4)] font-display font-extrabold text-scale-24 bg-[var(--color-red-pen)] text-[var(--color-chalk)] border-2 border-[var(--color-ink)]">
          01 → 07
        </span>
      </div>

      {/* Scroll-filled SVG path bar */}
      <div className="relative py-[var(--space-8)]" aria-hidden="true">
        <svg className="w-full h-6 overflow-visible" viewBox="0 0 700 24" preserveAspectRatio="none">
          {/* Background dashed track */}
          <line
            x1="10"
            y1="12"
            x2="690"
            y2="12"
            stroke="var(--color-ink)"
            strokeWidth="3"
            strokeDasharray="6 6"
            opacity="0.3"
          />
          {/* Foreground scroll-filled red-pen path */}
          <line
            x1="10"
            y1="12"
            x2="690"
            y2="12"
            stroke="var(--color-red-pen)"
            strokeWidth="5"
            strokeDasharray="680"
            strokeDashoffset={680 * (1 - scrollProgress)}
            style={{ transition: 'stroke-dashoffset 150ms ease-out' }}
          />
        </svg>
      </div>

      {/* 7-Step Cards along the path */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-[var(--space-12)]">
        {steps.map((s, idx) => {
          const isReached = idx < activeCount;
          return (
            <div
              key={s.step}
              className={`p-[var(--space-12)] bg-[var(--color-chalk)] border-2 transition-colors rounded-[var(--radius-card)] space-y-[var(--space-8)] relative flex flex-col justify-between ${
                isReached
                  ? 'border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-red-pen)]'
                  : 'border-[var(--color-border-light)] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-[var(--space-6)]">
                <span
                  className={`px-[var(--space-8)] py-[2px] font-display font-extrabold text-scale-24 border border-[var(--color-ink)] leading-none ${
                    isReached
                      ? 'bg-[var(--color-red-pen)] text-[var(--color-chalk)]'
                      : 'bg-[var(--color-chalk-surface)] text-[var(--color-ink)]'
                  }`}
                >
                  0{s.step}
                </span>
                <span className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)]">
                  Step {s.step}
                </span>
              </div>

              <div>
                <strong className="font-display font-bold text-scale-17 text-[var(--color-ink)] block">
                  {s.name}
                </strong>
                <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block mb-[var(--space-4)]">
                  {s.role}
                </span>
                <p className="text-scale-12 text-[var(--color-ink)] leading-snug">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Whiteboard-style materials checklist for Activity 2-2.
 * Framed like a classroom whiteboard with tray, marker tools, and check (✓) or cross (✕) indicators.
 */
export const WhiteboardMaterialsChecklist: React.FC<{
  epId: string;
  activity: DeliveredActivity2_2;
  hidePending: boolean;
  renderCrossReferences: (text: string) => React.ReactNode;
}> = ({ epId, activity, hidePending, renderCrossReferences }) => {
  const table = activity.materialsTable;
  if (!table) return null;

  return (
    <div className="surface-whiteboard overflow-hidden">
      {/* Whiteboard Top Aluminum/Slate Frame */}
      <div className="px-[var(--space-20)] py-[var(--space-12)] bg-[#36433B] text-[var(--color-chalk)] flex flex-wrap items-center justify-between gap-[var(--space-8)]">
        <div className="flex items-center gap-[var(--space-8)]">
          <span className="w-3 h-3 rounded-full bg-[#E5301F]" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-[#FFE600]" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-[#2447FF]" aria-hidden="true" />
          <span className="font-mono text-scale-12 font-bold tracking-wider uppercase ml-[var(--space-8)]">
            Classroom Whiteboard · Instructional Materials Checklist
          </span>
        </div>
        <span className="font-mono text-scale-12 text-[var(--color-chalk)]/80">
          present: ✓ / ✕
        </span>
      </div>

      {/* Main Checklist Table on Crisp White Surface */}
      <div className="overflow-x-auto p-[var(--space-16)] sm:p-[var(--space-24)]">
        <table className="w-full border-collapse text-left text-scale-14">
          <thead>
            <tr className="border-b-2 border-[#36433B] text-[var(--color-ink)] bg-slate-100/70">
              {table.columns.map((col, cIdx) => (
                <th
                  key={col.key}
                  scope="col"
                  data-verify-id={`${epId}-materialsTable-col-${col.key}`}
                  className={`p-[var(--space-12)] font-display font-bold ${
                    cIdx === 0
                      ? 'border-r-2 border-[#36433B] w-[36%]'
                      : cIdx === 1
                      ? 'border-r-2 border-[#36433B] text-center w-[16%]'
                      : 'w-[48%]'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rIdx) => {
              const rowPathKey = `${epId}.activity2.activity2_2.materialsTable.rows[${rIdx}]`;
              if (hidePending && isStatusPending(row.status, rowPathKey)) {
                return null;
              }
              const isPresent = Boolean(row.present);

              return (
                <tr
                  key={rowPathKey}
                  className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <th
                    scope="row"
                    data-verify-id={`${rowPathKey}.material`}
                    className="p-[var(--space-16)] font-semibold text-scale-17 text-[var(--color-ink)] border-r-2 border-[#36433B] align-top bg-white/60"
                  >
                    {row.material}
                  </th>
                  <td className="p-[var(--space-16)] align-middle text-center border-r-2 border-[#36433B]">
                    {/* Verified boolean flag: renders as check ✓ or cross ✕ (24px+ on red-pen for cross) */}
                    <span
                      data-verify-id={`${rowPathKey}.present`}
                      data-verify-present={String(isPresent)}
                      className={
                        isPresent
                          ? 'inline-flex items-center justify-center w-10 h-10 rounded border-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] font-display font-extrabold text-scale-24 shadow-sm'
                          : 'inline-flex items-center justify-center w-10 h-10 rounded border-2 border-[var(--color-ink)] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-extrabold text-scale-24 shadow-sm'
                      }
                    >
                      {isPresent ? '✓' : '✕'}
                    </span>
                  </td>
                  <td className="p-[var(--space-16)] text-scale-17 text-[var(--color-ink)] align-top reading-measure">
                    {row.notes !== undefined && (
                      <span data-verify-id={`${rowPathKey}.notes`}>
                        {renderCrossReferences(row.notes)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Simulated Whiteboard Tray with Dry-Erase Markers & Felt Eraser */}
      <div className="whiteboard-tray px-[var(--space-20)] py-[var(--space-10)] flex items-center justify-between border-t border-[#36433B]">
        <div className="flex items-center gap-[var(--space-12)]">
          {/* Black marker */}
          <div className="flex items-center gap-[var(--space-4)]" title="Dry-Erase Marker (Black)">
            <span className="w-8 h-2.5 rounded-sm bg-black border border-gray-400" />
            <span className="font-mono text-scale-12 text-gray-800 hidden sm:inline">Black</span>
          </div>
          {/* Red pen marker */}
          <div className="flex items-center gap-[var(--space-4)]" title="Dry-Erase Marker (Red)">
            <span className="w-8 h-2.5 rounded-sm bg-[#E5301F] border border-gray-400" />
            <span className="font-mono text-scale-12 text-gray-800 font-bold hidden sm:inline">Red-Pen</span>
          </div>
          {/* Blue marker */}
          <div className="flex items-center gap-[var(--space-4)]" title="Dry-Erase Marker (Blue)">
            <span className="w-8 h-2.5 rounded-sm bg-[#2447FF] border border-gray-400" />
            <span className="font-mono text-scale-12 text-gray-800 hidden sm:inline">Blue</span>
          </div>
        </div>

        {/* Felt eraser */}
        <div className="flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-4)] bg-gray-700 text-gray-100 rounded font-mono text-scale-12 border border-gray-800 shadow-inner">
          <span className="w-3 h-2 bg-yellow-500 rounded-sm" />
          <span>Felt Eraser</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Five-Stop Lesson Timeline for Activity 2-3: Lesson Plan Development.
 */
export const FiveStopLessonTimeline: React.FC = () => {
  const stops = [
    {
      stop: 1,
      title: 'Anchoring & Prior Knowledge',
      questionRef: 'Q1',
      desc: 'Opening through direct recall (Pasteur) and orientation review (Mendel) to anchor new concepts.',
    },
    {
      stop: 2,
      title: 'Applied Production Task',
      questionRef: 'Q2',
      desc: 'Immediate route into student writing & messy-paragraph revision rather than abstract lecture.',
    },
    {
      stop: 3,
      title: 'Compression & Closing Loop',
      questionRef: 'Q3',
      desc: 'Managing classroom time limits via preview of upcoming linguistic features and home readings.',
    },
    {
      stop: 4,
      title: 'Cold-Calling Formative Assessment',
      questionRef: 'Q4',
      desc: 'Real-time checking via index cards + HOTS ("why is that?") questions on the spot.',
    },
    {
      stop: 5,
      title: 'Messy-Paragraph Lesson Adoption',
      questionRef: 'Q5',
      desc: 'Timed paragraph revision with immediate model-answer reveal before ideas fossilize.',
    },
  ];

  return (
    <div className="p-[var(--space-20)] sm:p-[var(--space-28)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-16)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] border-b-2 border-[var(--color-ink)] pb-[var(--space-10)]">
        <div>
          <span className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)] uppercase block">
            Lesson Plan Sequence
          </span>
          <h5 className="font-display font-extrabold text-scale-24 text-[var(--color-ink)]">
            Five-Stop Lesson Timeline
          </h5>
        </div>
        <span className="px-[var(--space-12)] py-[var(--space-4)] font-display font-extrabold text-scale-24 bg-[var(--color-red-pen)] text-[var(--color-chalk)] border-2 border-[var(--color-ink)]">
          5 Stops
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-[var(--space-12)]">
        {stops.map((s) => (
          <div
            key={s.stop}
            className="p-[var(--space-14)] bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] rounded-[var(--radius-card)] space-y-[var(--space-8)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-[var(--space-6)]">
              <span className="px-[var(--space-8)] py-[2px] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-extrabold text-scale-24 border border-[var(--color-ink)] leading-none">
                0{s.stop}
              </span>
              <span className="font-mono text-scale-12 px-[var(--space-6)] py-[1px] bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] font-bold text-[var(--color-ink)]">
                {s.questionRef}
              </span>
            </div>

            <div>
              <strong className="font-display font-bold text-scale-17 text-[var(--color-ink)] block leading-snug">
                {s.title}
              </strong>
              <p className="text-scale-12 text-[var(--color-ink)] mt-[var(--space-4)] leading-snug">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full-Bleed Reflection Set Piece for Episode 04 Reflections.
 */
export const FullBleedReflection: React.FC<{
  epId: string;
  reflections: DeliveredReflections;
  renderCrossReferences: (text: string) => React.ReactNode;
}> = ({ epId, reflections, renderCrossReferences }) => {
  return (
    <section
      id={`${epId}-reflections-section`}
      className="-mx-[var(--space-24)] sm:-mx-[var(--space-48)] p-[var(--space-24)] sm:p-[var(--space-48)] bg-[var(--color-chalkboard)] text-[var(--color-chalk)] border-y-4 border-[var(--color-red-pen)] space-y-[var(--space-32)]"
    >
      <div className="max-w-4xl mx-auto space-y-[var(--space-24)]">
        <div className="border-b-2 border-[var(--color-chalk)] pb-[var(--space-12)] flex flex-wrap items-center justify-between gap-[var(--space-12)]">
          <div>
            <span className="font-mono text-scale-12 font-bold tracking-wider text-[var(--color-highlighter)] uppercase block">
              Synthesized Field Experience
            </span>
            <h3
              data-verify-id={`${epId}-reflections-title`}
              className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]"
            >
              {reflections.title}
            </h3>
          </div>
          <span className="px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-bold text-scale-24 border border-[var(--color-chalk)]">
            Episode 04 · Synthesis
          </span>
        </div>

        {/* AnswerBlock inside crisp index-card container */}
        <div className="p-[var(--space-24)] sm:p-[var(--space-32)] bg-[var(--color-chalk-surface)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] shadow-[6px_6px_0_var(--color-red-pen)] rounded-[var(--radius-card)]">
          <AnswerBlock
            id={`${epId}-reflections`}
            prompt={reflections.prompt}
            answer={reflections.answer}
            pullQuoteExcerpt={reflections.pullquote}
            forceExpanded={true}
            renderText={renderCrossReferences}
          />
        </div>
      </div>
    </section>
  );
};
