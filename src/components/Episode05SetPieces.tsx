import React, { useState } from 'react';
import {
  DeliveredActivity1,
  DeliveredActivity2,
  DeliveredQuestionGroup,
} from '../data/types';
import {
  formatObservationStatusSymbol,
  getEpisodeShortId,
  getQuestionPrompt,
  getQuestionPullquote,
  isStatusPending,
} from '../data/contentIntake';
import { AnswerBlock } from './AnswerBlock';
import { Smartphone, Box, RotateCcw, Eye, Layers, Quote } from 'lucide-react';

/**
 * Set Piece 1: "Phone Drawer" Opener (21 phones, derived strictly from the text).
 * Activity 1 Q1 & Q3: "only 21 students submitted their phones, and the teacher had to stop
 * mid-lesson to remind the rest... surrendering students' mobile phones into a dedicated drawer
 * atop the teacher's table, at the front, before classes start. Despite the rule being enforced
 * since Term 1, nearly half of the students did not observe it"
 */
export const PhoneDrawerOpener: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // 21 submitted phones (from the text: "only 21 students submitted their phones")
  const submittedPhones = Array.from({ length: 21 }, (_, idx) => idx + 1);
  // Empty compartment slots illustrating "nearly half of the students did not observe it"
  // without asserting an unstated exact class roster size
  const emptyCompartments = Array.from({ length: 14 }, (_, idx) => idx + 1);

  return (
    <div
      aria-hidden="true"
      className="no-print p-[var(--space-24)] sm:p-[var(--space-32)] bg-[var(--color-chalkboard)] text-[var(--color-chalk)] border-2 border-[var(--color-ink)] shadow-[6px_6px_0_var(--color-ink)] space-y-[var(--space-20)]"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] border-b-2 border-[var(--color-highlighter)] pb-[var(--space-12)]">
        <div className="space-y-[var(--space-4)]">
          <span className="inline-block px-[var(--space-10)] py-[2px] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
            THE PHONE DRAWER · GRADE 8 — HOOKE
          </span>
          <h3 className="font-display font-extrabold text-scale-28 text-[var(--color-chalk)]">
            Teacher’s Table Collection Drawer · 21 Phones Surrendered
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          className="px-[var(--space-14)] py-[var(--space-8)] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-chalk)] hover:translate-y-[-1px] transition-transform cursor-pointer"
        >
          {isDrawerOpen ? 'Slide Drawer Closed' : 'Pull Drawer Open (21 Phones)'}
        </button>
      </div>

      {/* Wooden Desk & Drawer Housing */}
      <div className="p-[var(--space-16)] sm:p-[var(--space-24)] bg-[#232A25] border-2 border-[var(--color-border-dark)] rounded-[var(--radius-card)] space-y-[var(--space-16)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] text-scale-12 font-mono">
          <div className="flex items-center gap-[var(--space-8)]">
            <span className="inline-block w-3 h-3 bg-[var(--color-highlighter)] border border-[var(--color-ink)]" />
            <span className="text-[var(--color-chalk)] font-bold">
              21 Phones Submitted (Morning Arrival Trigger · Monitored by Class President)
            </span>
          </div>
          <div className="flex items-center gap-[var(--space-8)]">
            <span className="inline-block w-3 h-3 border border-dashed border-[var(--color-chalk-faint)]" />
            <span className="text-[var(--color-chalk-faint)]">
              Unsubmitted Slots (Nearly half of the room · Mid-lesson reminder required)
            </span>
          </div>
        </div>

        {isDrawerOpen ? (
          <div className="p-[var(--space-16)] bg-[#161B18] border-2 border-[var(--color-highlighter)] space-y-[var(--space-16)]">
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-[var(--space-8)]">
              {submittedPhones.map((num) => {
                const isSelected = selectedSlot === num;
                return (
                  <button
                    key={`phone-${num}`}
                    type="button"
                    onClick={() => setSelectedSlot(isSelected ? null : num)}
                    className={`p-[var(--space-8)] border-2 transition-all flex flex-col items-center justify-center gap-[var(--space-4)] rounded cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] border-[var(--color-ink)] scale-105 shadow-[2px_2px_0_var(--color-chalk)]'
                        : 'bg-[var(--color-chalk-surface)] text-[var(--color-ink)] border-[var(--color-ink)] hover:bg-[var(--color-highlighter)]'
                    }`}
                  >
                    <Smartphone size={18} />
                    <span className="font-mono text-scale-12 font-bold">
                      #{String(num).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}

              {emptyCompartments.map((slot) => (
                <div
                  key={`empty-${slot}`}
                  className="p-[var(--space-8)] border border-dashed border-[var(--color-chalk-faint)]/50 bg-[#1B221E] text-[var(--color-chalk-faint)] flex flex-col items-center justify-center gap-[var(--space-4)] rounded opacity-65"
                >
                  <span className="font-mono text-scale-12">◌</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">Missing</span>
                </div>
              ))}
            </div>

            <div className="pt-[var(--space-8)] border-t border-[var(--color-border-dark)] flex flex-wrap items-center justify-between gap-[var(--space-8)] font-mono text-scale-12 text-[var(--color-chalk-faint)]">
              <span>
                Policy active since Term 1 · Dedicated drawer atop teacher’s front table
              </span>
              <span className="text-[var(--color-highlighter)] font-bold">
                {selectedSlot
                  ? `Inspecting surrendered phone #${String(selectedSlot).padStart(2, '0')} of 21`
                  : '21 phones collected · Teacher paused mid-lesson to remind remaining students'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-[var(--space-24)] px-[var(--space-16)] bg-[#1B221E] border-2 border-[var(--color-border-dark)] flex flex-col items-center justify-center gap-[var(--space-8)]">
            <div className="w-28 h-3 bg-[var(--color-highlighter)] border border-[var(--color-ink)] rounded-full" />
            <span className="font-mono text-scale-12 text-[var(--color-chalk-faint)]">
              Drawer Closed · 21 Phones Stored Inside Front Table
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Set Piece 2: Tile-Grid Routine Board for Activity 1 (routinesTable — 21 items).
 * Status values ("Observed", "Not observed", "No opportunity to observe") render as
 * check (✓), cross (✕), and ghost (◌) states, and counts are computed from data.
 */
export const RoutinesTileGrid: React.FC<{
  epId: string;
  activity: DeliveredActivity1;
  hidePending: boolean;
}> = ({ epId, activity, hidePending }) => {
  const table = activity.routinesTable;
  const [viewMode, setViewMode] = useState<'tiles' | 'table'>('tiles');
  if (!table) return null;

  const rows = table.rows || [];
  const columns = table.columns || [];

  // Dynamically compute counts from data
  const observedCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === 'observed'
  ).length;
  const notObservedCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === 'not observed'
  ).length;
  const noOpportunityCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === 'no opportunity to observe'
  ).length;
  const totalCount = rows.length;

  return (
    <div className="space-y-[var(--space-20)]">
      {/* Computed Counts Bar & View Toggle */}
      <div className="p-[var(--space-16)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] flex flex-wrap items-center justify-between gap-[var(--space-12)]">
        <div className="flex flex-wrap items-center gap-[var(--space-12)]">
          <span className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
            ✓ Observed: {observedCount}
          </span>
          <span className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-chalk)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
            ✕ Not observed: {notObservedCount}
          </span>
          {noOpportunityCount > 0 && (
            <span className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-chalk)]/60 text-[var(--color-chalk-muted)] font-mono text-scale-12 font-bold border border-dashed border-[var(--color-ink)]">
              ◌ No opportunity: {noOpportunityCount}
            </span>
          )}
          <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] font-semibold">
            Total Routines: {totalCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'tiles' ? 'table' : 'tiles')}
          className="px-[var(--space-12)] py-[var(--space-4)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] hover:bg-[var(--color-highlighter)] transition-colors cursor-pointer"
        >
          {viewMode === 'tiles' ? 'Switch to Table View' : 'Switch to Tile-Grid Board'}
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] overflow-x-auto">
          <table className="w-full border-collapse text-left text-scale-14">
            <thead>
              <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-highlighter)] text-[var(--color-ink)]">
                {columns.map((col, cIdx) => (
                  <th
                    key={col.key}
                    scope="col"
                    data-verify-id={`${epId}-routinesTable-col-${col.key}`}
                    className={`p-[var(--space-12)] font-display font-bold ${
                      cIdx === 0
                        ? 'border-r-2 border-[var(--color-ink)] w-[68%]'
                        : 'text-center w-[32%]'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => {
                const rowPathKey = `${epId}.activity1.routinesTable.rows[${rIdx}]`;
                if (hidePending && isStatusPending(undefined, rowPathKey)) return null;
                const symbol = formatObservationStatusSymbol(row.status);
                const isObs = symbol === '✓';

                return (
                  <tr
                    key={rowPathKey}
                    className={`border-b border-[var(--color-border-light)] last:border-b-0 ${
                      isObs ? 'bg-[var(--color-chalk-surface)]' : 'bg-[var(--color-chalk)]/60'
                    }`}
                  >
                    <th
                      scope="row"
                      data-verify-id={`${rowPathKey}.routine`}
                      className="p-[var(--space-14)] font-semibold text-scale-17 text-[var(--color-ink)] border-r-2 border-[var(--color-ink)]"
                    >
                      {row.routine}
                    </th>
                    <td className="p-[var(--space-14)] text-center align-middle">
                      <span
                        data-verify-id={`${rowPathKey}.status`}
                        data-verify-status={row.status}
                        className={`inline-flex items-center justify-center w-8 h-8 font-display font-extrabold text-scale-17 border-2 border-[var(--color-ink)] ${
                          isObs
                            ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)]'
                            : 'bg-[var(--color-chalk)] text-[var(--color-chalk-muted)]'
                        }`}
                      >
                        {symbol}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tile-Grid Routine Board */
        <div>
          {/* Semantic column headers for verification */}
          <div className="sr-only">
            {columns.map((col) => (
              <span
                key={col.key}
                data-verify-id={`${epId}-routinesTable-col-${col.key}`}
              >
                {col.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-16)]">
            {rows.map((row, rIdx) => {
              const rowPathKey = `${epId}.activity1.routinesTable.rows[${rIdx}]`;
              if (hidePending && isStatusPending(undefined, rowPathKey)) return null;
              const symbol = formatObservationStatusSymbol(row.status);
              const isObs = symbol === '✓';
              const isGhost = symbol === '◌';

              return (
                <div
                  key={rowPathKey}
                  className={`p-[var(--space-16)] rounded-[var(--radius-card)] flex items-start justify-between gap-[var(--space-12)] transition-colors ${
                    isObs
                      ? 'bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]'
                      : isGhost
                      ? 'bg-[var(--color-chalk)]/40 border-2 border-dashed border-[var(--color-ink)]/40 opacity-75'
                      : 'bg-[var(--color-chalk)] border-2 border-[var(--color-border-light)]'
                  }`}
                >
                  <div className="space-y-[var(--space-4)]">
                    <h4
                      data-verify-id={`${rowPathKey}.routine`}
                      className="font-display font-bold text-scale-17 text-[var(--color-ink)] leading-snug"
                    >
                      {row.routine}
                    </h4>
                    <span
                      aria-hidden="true"
                      className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block"
                    >
                      {row.status}
                    </span>
                  </div>

                  <span
                    data-verify-id={`${rowPathKey}.status`}
                    data-verify-status={row.status}
                    title={row.status}
                    className={`shrink-0 inline-flex items-center justify-center w-9 h-9 font-display font-extrabold text-scale-20 border-2 ${
                      isObs
                        ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] border-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]'
                        : isGhost
                        ? 'border-dashed border-[var(--color-ink)]/50 text-[var(--color-chalk-muted)] bg-transparent'
                        : 'bg-[var(--color-chalk-surface)] text-[var(--color-ink)] border-[var(--color-ink)]'
                    }`}
                  >
                    {symbol}
                  </span>
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
 * Set Piece 3: 15 Strategy Cards for Activity 2 (strategiesTable).
 * - Observed: solid card with check (✓) and highlighter accent
 * - Not observed: cross (✕)
 * - No opportunity to observe: ghost card (◌)
 * - Remarks render ONLY where present.
 * - Counts are computed dynamically from data.
 */
export const StrategiesCardDeck: React.FC<{
  epId: string;
  activity: DeliveredActivity2;
  hidePending: boolean;
  renderCrossReferences: (text: string) => React.ReactNode;
}> = ({ epId, activity, hidePending, renderCrossReferences }) => {
  const table = activity.strategiesTable;
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  if (!table) return null;

  const rows = table.rows || [];
  const columns = table.columns || [];

  // Dynamically compute counts from data
  const observedCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === 'observed'
  ).length;
  const notObservedCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === 'not observed'
  ).length;
  const noOpportunityCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === 'no opportunity to observe'
  ).length;
  const totalCount = rows.length;

  return (
    <div className="space-y-[var(--space-20)]">
      {/* Computed Strategy Counts & View Switcher */}
      <div className="p-[var(--space-16)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] flex flex-wrap items-center justify-between gap-[var(--space-12)]">
        <div className="flex flex-wrap items-center gap-[var(--space-12)]">
          <span className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
            ✓ Observed: {observedCount}
          </span>
          <span className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-chalk)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
            ✕ Not observed: {notObservedCount}
          </span>
          <span className="px-[var(--space-10)] py-[var(--space-4)] bg-[var(--color-chalk)]/60 text-[var(--color-chalk-muted)] font-mono text-scale-12 font-bold border border-dashed border-[var(--color-ink)]">
            ◌ No opportunity (Ghost): {noOpportunityCount}
          </span>
          <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] font-semibold">
            Total Strategies: {totalCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
          className="px-[var(--space-12)] py-[var(--space-4)] font-mono text-scale-12 font-bold border-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] hover:bg-[var(--color-highlighter)] transition-colors cursor-pointer"
        >
          {viewMode === 'cards' ? 'Switch to Table View' : 'Switch to 15 Strategy Cards'}
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] overflow-x-auto">
          <table className="w-full border-collapse text-left text-scale-14">
            <thead>
              <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-highlighter)] text-[var(--color-ink)]">
                {columns.map((col, cIdx) => (
                  <th
                    key={col.key}
                    scope="col"
                    data-verify-id={`${epId}-strategiesTable-col-${col.key}`}
                    className={`p-[var(--space-12)] font-display font-bold ${
                      cIdx === 0
                        ? 'border-r-2 border-[var(--color-ink)] w-[38%]'
                        : cIdx === 1
                        ? 'border-r-2 border-[var(--color-ink)] text-center w-[20%]'
                        : 'w-[42%]'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => {
                const rowPathKey = `${epId}.activity2.strategiesTable.rows[${rIdx}]`;
                if (hidePending && isStatusPending(undefined, rowPathKey)) return null;
                const symbol = formatObservationStatusSymbol(row.status);
                const isObs = symbol === '✓';
                const isGhost = symbol === '◌';

                return (
                  <tr
                    key={rowPathKey}
                    className={`border-b border-[var(--color-border-light)] last:border-b-0 ${
                      isGhost ? 'bg-[var(--color-chalk)]/40 opacity-75' : 'bg-[var(--color-chalk-surface)]'
                    }`}
                  >
                    <th
                      scope="row"
                      data-verify-id={`${rowPathKey}.strategy`}
                      className="p-[var(--space-14)] font-semibold text-scale-17 text-[var(--color-ink)] border-r-2 border-[var(--color-ink)] align-top"
                    >
                      {row.strategy}
                    </th>
                    <td className="p-[var(--space-14)] text-center align-middle border-r-2 border-[var(--color-ink)]">
                      <span
                        data-verify-id={`${rowPathKey}.status`}
                        data-verify-status={row.status}
                        className={`inline-flex items-center justify-center w-8 h-8 font-display font-extrabold text-scale-17 border-2 ${
                          isObs
                            ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] border-[var(--color-ink)]'
                            : isGhost
                            ? 'border-dashed border-[var(--color-ink)]/50 text-[var(--color-chalk-muted)]'
                            : 'bg-[var(--color-chalk)] text-[var(--color-ink)] border-[var(--color-ink)]'
                        }`}
                      >
                        {symbol}
                      </span>
                    </td>
                    <td className="p-[var(--space-14)] text-scale-17 text-[var(--color-ink)] align-top reading-measure">
                      {row.remarks !== undefined && row.remarks !== '' && (
                        <span data-verify-id={`${rowPathKey}.remarks`}>
                          {renderCrossReferences(row.remarks)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 15 Strategy Cards (Ghosts for "No opportunity to observe") */
        <div>
          <div className="sr-only">
            {columns.map((col) => (
              <span
                key={col.key}
                data-verify-id={`${epId}-strategiesTable-col-${col.key}`}
              >
                {col.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-20)]">
            {rows.map((row, rIdx) => {
              const rowPathKey = `${epId}.activity2.strategiesTable.rows[${rIdx}]`;
              if (hidePending && isStatusPending(undefined, rowPathKey)) return null;
              const symbol = formatObservationStatusSymbol(row.status);
              const isObs = symbol === '✓';
              const isGhost = symbol === '◌';
              const hasRemarks = row.remarks !== undefined && row.remarks !== '';

              return (
                <div
                  key={rowPathKey}
                  className={`p-[var(--space-20)] rounded-[var(--radius-card)] flex flex-col justify-between gap-[var(--space-12)] transition-all ${
                    isGhost
                      ? 'border-2 border-dashed border-[var(--color-ink)]/40 bg-[var(--color-chalk)]/50 opacity-80'
                      : 'border-2 border-[var(--color-ink)] bg-[var(--color-chalk-surface)] shadow-[4px_4px_0_var(--color-ink)]'
                  }`}
                >
                  <div className="space-y-[var(--space-10)]">
                    <div className="flex items-center justify-between gap-[var(--space-8)] border-b border-[var(--color-border-light)] pb-[var(--space-8)]">
                      <span
                        aria-hidden="true"
                        className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)] uppercase"
                      >
                        Classroom Strategy
                      </span>

                      <div className="flex items-center gap-[var(--space-6)]">
                        <span
                          aria-hidden="true"
                          className="font-mono text-scale-12 text-[var(--color-chalk-muted)]"
                        >
                          {isObs ? 'Observed' : isGhost ? 'No opportunity' : 'Not observed'}
                        </span>
                        <span
                          data-verify-id={`${rowPathKey}.status`}
                          data-verify-status={row.status}
                          title={row.status}
                          className={`inline-flex items-center justify-center w-8 h-8 font-display font-extrabold text-scale-17 border-2 ${
                            isObs
                              ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] border-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]'
                              : isGhost
                              ? 'border-dashed border-[var(--color-ink)]/50 text-[var(--color-chalk-muted)] bg-transparent'
                              : 'bg-[var(--color-chalk)] text-[var(--color-ink)] border-[var(--color-ink)]'
                          }`}
                        >
                          {symbol}
                        </span>
                      </div>
                    </div>

                    <h5
                      data-verify-id={`${rowPathKey}.strategy`}
                      className={`font-display font-bold text-scale-20 leading-snug ${
                        isGhost ? 'text-[var(--color-chalk-muted)]' : 'text-[var(--color-ink)]'
                      }`}
                    >
                      {row.strategy}
                    </h5>

                    {/* Remarks render ONLY where present */}
                    {hasRemarks && (
                      <div className="p-[var(--space-12)] bg-[var(--color-highlighter)]/35 border-l-4 border-[var(--color-ink)] text-scale-14 text-[var(--color-ink)] leading-relaxed">
                        <p data-verify-id={`${rowPathKey}.remarks`}>
                          {renderCrossReferences(row.remarks!)}
                        </p>
                      </div>
                    )}
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
 * Set Piece 4: Quote Slabs for Activity 2 Resource Teacher Interview (rtInterview).
 * Teacher answers render as attributed quotes; yearsInService is PENDING and hidden.
 */
export const RtInterviewQuoteSlabs: React.FC<{
  epId: string;
  activity: DeliveredActivity2;
  hidePending: boolean;
  renderCrossReferences: (text: string) => React.ReactNode;
}> = ({ epId, activity, hidePending, renderCrossReferences }) => {
  const rti = activity.rtInterview;
  if (!rti) return null;

  const profileFields: { key: string; label: string }[] = [
    { key: 'nameOfResourceTeacher', label: 'Name of Resource Teacher' },
    { key: 'gradeLevelSubject', label: 'Grade Level / Subject' },
    { key: 'dateOfInterview', label: 'Date of Interview' },
    { key: 'yearsInService', label: 'Years in Service' },
  ];

  const useFullAttribution = rti.attribution === 'full' ? rti.profile : undefined;

  return (
    <div className="space-y-[var(--space-24)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]">
      <h4
        data-verify-id={`${epId}-rtInterview-title`}
        className="font-display font-bold text-scale-24 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
      >
        {rti.title}
      </h4>

      {/* Resource Teacher Profile Header (hiding PENDING yearsInService) */}
      {rti.profile && (
        <div className="p-[var(--space-20)] bg-[var(--color-highlighter)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-16)]">
          {profileFields.map(({ key, label }) => {
            const rawVal = (rti.profile as Record<string, unknown>)[key];
            if (rawVal === undefined || rawVal === null) return null;
            const pathKey = `${epId}.activity2.rtInterview.profile.${key}`;
            const inlineStatus =
              typeof rawVal === 'object' && rawVal !== null && 'status' in rawVal
                ? (rawVal as { status?: string }).status
                : undefined;
            const valStr =
              typeof rawVal === 'object' && rawVal !== null && 'value' in rawVal
                ? String((rawVal as { value?: string }).value ?? '')
                : String(rawVal);

            if (hidePending && isStatusPending(inlineStatus, pathKey)) {
              return null;
            }
            if (isStatusPending(inlineStatus, pathKey)) {
              return null;
            }

            return (
              <div key={key} className="space-y-[var(--space-4)]">
                <span className="font-mono text-scale-12 font-bold uppercase text-[var(--color-ink)]/80 block">
                  {label}
                </span>
                <strong
                  data-verify-id={`${epId}-rti-profile-${key}`}
                  className="font-display font-extrabold text-scale-17 text-[var(--color-ink)] block"
                >
                  {valStr}
                </strong>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote Slabs for Teacher Interview Answers */}
      <div className="space-y-[var(--space-24)]">
        {rti.questions.map((q, qIdx) => {
          const pathKey = `${epId}.activity2.rtInterview.questions[${qIdx}]`;
          if (hidePending && isStatusPending(q.status, pathKey)) return null;
          const verifyId = `${epId}-act2-rti-q${q.n ?? qIdx + 1}`;
          const epShort = getEpisodeShortId(epId.replace(/^ep-/, ''));
          const domId = `${epShort}-act${activity.number}-rti-q${q.n ?? qIdx + 1}`;

          return (
            <div
              key={verifyId}
              className="p-[var(--space-20)] sm:p-[var(--space-24)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] border-l-8 border-l-[var(--color-highlighter)] shadow-[5px_5px_0_var(--color-ink)] space-y-[var(--space-8)]"
            >
              <div
                aria-hidden="true"
                className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-[var(--space-6)]"
              >
                <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-8)] py-[2px] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
                  <Quote size={12} />
                  Attributed Teacher Interview
                </span>
                <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)]">
                  {rti.profile.nameOfResourceTeacher}
                </span>
              </div>

              <AnswerBlock
                id={domId}
                verifyId={verifyId}
                questionNumber={q.n}
                prompt={getQuestionPrompt(q)}
                answer={q.answer}
                pullQuoteExcerpt={getQuestionPullquote(q)}
                forceExpanded={q.display === 'prose'}
                quoteAttribution={useFullAttribution}
                renderText={renderCrossReferences}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Set Piece 5: 3D Classroom Placeholder Box-Room for Activity 3.
 * Rendered while classroomDrawing.status === "PENDING" (until the notebook drawing arrives).
 * Depicts the exact spatial zones described in Activity 3 Q1.
 */
export const ClassroomBoxRoom3D: React.FC = () => {
  const [viewAngle, setViewAngle] = useState<'iso' | 'plan' | 'front'>('iso');

  const transformStyle =
    viewAngle === 'iso'
      ? 'perspective(1100px) rotateX(26deg) rotateZ(-8deg)'
      : viewAngle === 'plan'
      ? 'perspective(1100px) rotateX(0deg) rotateZ(0deg)'
      : 'perspective(1100px) rotateX(42deg) rotateZ(0deg)';

  return (
    <div
      aria-hidden="true"
      className="no-print p-[var(--space-20)] sm:p-[var(--space-28)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[5px_5px_0_var(--color-ink)] space-y-[var(--space-20)] overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] border-b-2 border-[var(--color-ink)] pb-[var(--space-12)]">
        <div className="space-y-[var(--space-4)]">
          <span className="inline-block px-[var(--space-8)] py-[2px] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
            3D SPATIAL BOX-ROOM · GRADE 8 — HOOKE
          </span>
          <h4 className="font-display font-extrabold text-scale-24 text-[var(--color-ink)]">
            Classroom Layout Box-Room (Spatial Zones from Observation)
          </h4>
        </div>

        <div className="flex items-center gap-[var(--space-8)]">
          <button
            type="button"
            onClick={() => setViewAngle('iso')}
            className={`px-[var(--space-10)] py-[var(--space-4)] font-mono text-scale-12 font-bold border border-[var(--color-ink)] cursor-pointer ${
              viewAngle === 'iso'
                ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]'
                : 'bg-[var(--color-chalk)] text-[var(--color-ink)]'
            }`}
          >
            3D Isometric
          </button>
          <button
            type="button"
            onClick={() => setViewAngle('plan')}
            className={`px-[var(--space-10)] py-[var(--space-4)] font-mono text-scale-12 font-bold border border-[var(--color-ink)] cursor-pointer ${
              viewAngle === 'plan'
                ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]'
                : 'bg-[var(--color-chalk)] text-[var(--color-ink)]'
            }`}
          >
            Top-Down Plan
          </button>
          <button
            type="button"
            onClick={() => setViewAngle('front')}
            className={`px-[var(--space-10)] py-[var(--space-4)] font-mono text-scale-12 font-bold border border-[var(--color-ink)] cursor-pointer ${
              viewAngle === 'front'
                ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]'
                : 'bg-[var(--color-chalk)] text-[var(--color-ink)]'
            }`}
          >
            Front Elevation
          </button>
        </div>
      </div>

      {/* 3D Box-Room Stage */}
      <div className="py-[var(--space-16)] px-[var(--space-8)] bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] rounded-[var(--radius-card)]">
        <div
          style={{
            transform: transformStyle,
            transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="max-w-3xl mx-auto p-[var(--space-20)] bg-[var(--color-chalk-surface)] border-4 border-[var(--color-ink)] shadow-[10px_12px_0_var(--color-ink)] space-y-[var(--space-16)]"
        >
          {/* FRONT INSTRUCTIONAL WALL: Whiteboard + Central TV + Whiteboard & Attendance Chart by Door */}
          <div className="grid grid-cols-12 gap-[var(--space-8)] items-center border-b-2 border-dashed border-[var(--color-ink)] pb-[var(--space-12)]">
            <div className="col-span-2 p-[var(--space-6)] bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] text-center font-mono text-[11px] font-bold">
              Front Door &amp; Attendance Chart
            </div>
            <div className="col-span-3 p-[var(--space-8)] bg-white border-2 border-[var(--color-ink)] text-center font-mono text-scale-12 font-bold">
              Left Whiteboard
            </div>
            <div className="col-span-3 p-[var(--space-8)] bg-[var(--color-chalkboard)] text-[var(--color-highlighter)] border-2 border-[var(--color-ink)] text-center font-mono text-scale-12 font-bold">
              Central TV
            </div>
            <div className="col-span-4 p-[var(--space-8)] bg-white border-2 border-[var(--color-ink)] text-center font-mono text-scale-12 font-bold">
              Right Whiteboard
            </div>
          </div>

          {/* TEACHER'S DESK + DEDICATED PHONE DRAWER (FRONT CENTER) */}
          <div className="flex justify-center">
            <div className="px-[var(--space-20)] py-[var(--space-10)] bg-[var(--color-highlighter)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] text-center">
              <span className="font-display font-extrabold text-scale-14 block">
                Teacher’s Desk (Front Center)
              </span>
              <span className="font-mono text-scale-12 block">
                Dedicated Cell Phone Collection Drawer (21 Phones)
              </span>
            </div>
          </div>

          {/* STUDENT SEATING ZONE + SIDE WALL COOLING APPLIANCES */}
          <div className="grid grid-cols-12 gap-[var(--space-12)] items-stretch">
            {/* Left Wall Cooling */}
            <div className="col-span-2 flex flex-col justify-between p-[var(--space-8)] bg-[var(--color-chalk)] border border-dashed border-[var(--color-ink)] text-center font-mono text-[11px]">
              <span>AC Unit #1</span>
              <span>Wall Fans</span>
            </div>

            {/* Three Columns of Desks (Dual-column left/right, Middle column holding 3) */}
            <div className="col-span-8 grid grid-cols-3 gap-[var(--space-10)]">
              {/* Left Dual-Column */}
              <div className="space-y-[var(--space-6)]">
                <span className="font-mono text-[10px] uppercase text-[var(--color-chalk-muted)] block text-center">
                  Left Column (2-Seat)
                </span>
                {[1, 2, 3, 4].map((r) => (
                  <div
                    key={`L-${r}`}
                    className="grid grid-cols-2 gap-1 p-1.5 bg-[var(--color-chalk)] border border-[var(--color-ink)]"
                  >
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                  </div>
                ))}
              </div>

              {/* Middle Column Holding 3 */}
              <div className="space-y-[var(--space-6)]">
                <span className="font-mono text-[10px] uppercase text-[var(--color-chalk-muted)] block text-center">
                  Middle Column (3-Seat)
                </span>
                {[1, 2, 3, 4].map((r) => (
                  <div
                    key={`M-${r}`}
                    className="grid grid-cols-3 gap-1 p-1.5 bg-[var(--color-chalk)] border border-[var(--color-ink)]"
                  >
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                  </div>
                ))}
              </div>

              {/* Right Dual-Column */}
              <div className="space-y-[var(--space-6)]">
                <span className="font-mono text-[10px] uppercase text-[var(--color-chalk-muted)] block text-center">
                  Right Column (2-Seat)
                </span>
                {[1, 2, 3, 4].map((r) => (
                  <div
                    key={`R-${r}`}
                    className="grid grid-cols-2 gap-1 p-1.5 bg-[var(--color-chalk)] border border-[var(--color-ink)]"
                  >
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                    <span className="h-4 bg-[var(--color-chalk-surface)] border border-[var(--color-ink)] block" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Wall Cooling */}
            <div className="col-span-2 flex flex-col justify-between p-[var(--space-8)] bg-[var(--color-chalk)] border border-dashed border-[var(--color-ink)] text-center font-mono text-[11px]">
              <span>AC Unit #2</span>
              <span>Wall Fans</span>
            </div>
          </div>

          {/* REAR PERIPHERAL ZONE: Bulletin Board at Rear + Water Dispenser in Back Right Corner */}
          <div className="grid grid-cols-12 gap-[var(--space-8)] items-center border-t-2 border-dashed border-[var(--color-ink)] pt-[var(--space-12)]">
            <div className="col-span-8 p-[var(--space-8)] bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] text-center font-mono text-scale-12 font-bold">
              Rear Wall Bulletin Board (Peripheral Zone)
            </div>
            <div className="col-span-4 p-[var(--space-8)] bg-[var(--color-highlighter)]/50 border-2 border-[var(--color-ink)] text-center font-mono text-scale-12 font-bold">
              Water Dispenser (Back Right Corner)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Set Piece 6: Full-Bleed Reflection Close for Episode 05 (reflectionQuestions).
 */
export const FullBleedReflectionQuestions: React.FC<{
  epId: string;
  reflectionQuestions: DeliveredQuestionGroup;
  hidePending: boolean;
  renderCrossReferences: (text: string) => React.ReactNode;
}> = ({ epId, reflectionQuestions, hidePending, renderCrossReferences }) => {
  return (
    <section
      id={`${epId}-reflection-questions`}
      className="-mx-[var(--space-24)] sm:-mx-[var(--space-48)] p-[var(--space-24)] sm:p-[var(--space-48)] bg-[var(--color-chalkboard)] text-[var(--color-chalk)] border-y-4 border-[var(--color-highlighter)] space-y-[var(--space-32)]"
    >
      <div className="max-w-4xl mx-auto space-y-[var(--space-24)]">
        <div className="border-b-2 border-[var(--color-highlighter)] pb-[var(--space-12)] flex flex-wrap items-center justify-between gap-[var(--space-12)]">
          <div>
            <span
              aria-hidden="true"
              className="font-mono text-scale-12 font-bold tracking-wider text-[var(--color-highlighter)] uppercase block"
            >
              Episode 05 · Classroom Management Synthesis
            </span>
            <h3
              data-verify-id={`${epId}-reflectionQuestions-title`}
              className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]"
            >
              {reflectionQuestions.title}
            </h3>
          </div>
          <span
            aria-hidden="true"
            className="px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-display font-bold text-scale-20 border-2 border-[var(--color-ink)]"
          >
            Full-Bleed Close
          </span>
        </div>

        <div className="space-y-[var(--space-20)]">
          {reflectionQuestions.questions.map((q, qIdx) => {
            const pathKey = `${epId}.reflectionQuestions.questions[${qIdx}]`;
            if (hidePending && isStatusPending(q.status, pathKey)) return null;
            const verifyId = `${epId}-ref-q${q.n ?? qIdx + 1}`;
            const epShort = getEpisodeShortId(epId.replace(/^ep-/, ''));
            const domId = `${epShort}-ref-q${q.n ?? qIdx + 1}`;

            return (
              <div
                key={verifyId}
                className="p-[var(--space-24)] sm:p-[var(--space-32)] bg-[var(--color-chalk-surface)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] shadow-[6px_6px_0_var(--color-highlighter)] rounded-[var(--radius-card)]"
              >
                <AnswerBlock
                  id={domId}
                  verifyId={verifyId}
                  questionNumber={q.n}
                  prompt={getQuestionPrompt(q)}
                  answer={q.answer}
                  pullQuoteExcerpt={getQuestionPullquote(q)}
                  forceExpanded={q.display === 'prose'}
                  renderText={renderCrossReferences}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
