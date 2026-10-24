import React, { useEffect, useRef, useState } from 'react';
import { FlexibleTable } from '../data/types';
import { shouldHidePending, isStatusPending } from '../data/contentIntake';

export interface MatrixTableProps {
  table: FlexibleTable;
  className?: string;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({ table, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hidePending = shouldHidePending();

  const updateScrollShadows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollShadows();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => updateScrollShadows());
      resizeObserver.observe(el);
      return () => resizeObserver.disconnect();
    }
  }, [table]);

  // Pending tables are hidden in production
  if (hidePending && (table.isPending || isStatusPending(table.status, table.id))) {
    return null;
  }

  const visibleRows = table.rows
    .map((row, originalRowIndex) => ({ row, originalRowIndex }))
    .filter(({ row, originalRowIndex }) => {
      if (!hidePending) return true;
      const rowKey = `${table.id}-r${originalRowIndex}`;
      if (isStatusPending(String(row.status || ''), rowKey)) return false;
      return true;
    });

  if (hidePending && visibleRows.length === 0) {
    return null;
  }

  return (
    <div
      data-redpen-component="MatrixTable"
      data-redpen-tokens="--color-chalk-surface, --color-ink, --radius-seating, --text-14"
      className={`my-[var(--space-32)] break-inside-avoid space-y-[var(--space-12)] ${className}`}
    >
      {/* Table Header & Description */}
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-8)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
        <div className="space-y-[var(--space-4)]">
          <h4 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
            {table.title}
          </h4>
          {table.description && (
            <p className="text-scale-14 text-[var(--color-chalk-muted)]">
              {table.description}
            </p>
          )}
        </div>
        {canScrollRight && (
          <span className="text-scale-12 font-semibold text-[var(--color-notebook)] sm:hidden">
            Scroll horizontally for more columns
          </span>
        )}
      </div>

      {/* Seating-chart grid wrapper (0px square radius, sticky first column, overflow shadow cues) */}
      <div className="relative shape-seating-grid shadow-[4px_4px_0_var(--color-ink)]">
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-0 w-[var(--space-24)] z-20"
            style={{
              background: 'linear-gradient(to right, rgba(12, 22, 18, 0.16), transparent)',
            }}
          />
        )}

        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 right-0 w-[var(--space-24)] z-20"
            style={{
              background: 'linear-gradient(to left, rgba(12, 22, 18, 0.16), transparent)',
            }}
          />
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollShadows}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse text-left text-scale-14">
            <thead>
              <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)]">
                {table.columns.map((col, cIdx) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={`p-[var(--space-12)] font-display font-bold text-scale-14 border-r border-[var(--color-border-light)] last:border-r-0 ${
                      cIdx === 0
                        ? 'sticky left-0 z-10 bg-[var(--color-chalk)] border-r-2 border-r-[var(--color-ink)]'
                        : ''
                    } ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ row, originalRowIndex }) => (
                <tr
                  key={originalRowIndex}
                  className="border-b border-[var(--color-border-light)] last:border-b-0 transition-colors hover:bg-[var(--color-chalk)]"
                >
                  {table.columns.map((col, cIdx) => {
                    const rawValue = row[col.key];
                    const cellVerifyId = `${table.id}-r${originalRowIndex}-${col.key}`;
                    const cellPending = isStatusPending(
                      typeof rawValue === 'string' ? rawValue : undefined,
                      cellVerifyId
                    );

                    const isHiddenPending = hidePending && cellPending;
                    const isEmptyCell =
                      rawValue === undefined ||
                      rawValue === null ||
                      rawValue === '' ||
                      rawValue === 'N/A' ||
                      isHiddenPending;

                    const verifyId = !isEmptyCell ? cellVerifyId : undefined;

                    const isObservedOrAvailable =
                      rawValue === 'Observed' ||
                      rawValue === 'Available' ||
                      rawValue === 'A' ||
                      rawValue === true;

                    const isNotObserved =
                      rawValue === 'Not Observed' ||
                      rawValue === 'Not Available' ||
                      rawValue === 'NA' ||
                      rawValue === false;

                    // Render exact verbatim string inside data-verify-id span (never alter casing or wording)
                    const cellContent = isEmptyCell ? null : col.format === 'tick' ? (
                      isObservedOrAvailable ? (
                        <span
                          className="inline-flex items-center gap-[var(--space-4)] font-semibold text-[var(--color-red-pen)]"
                          title={String(rawValue)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M2.5 8.5L6.5 12.5L13.5 3.5" />
                          </svg>
                          <span data-verify-id={verifyId}>{String(rawValue)}</span>
                        </span>
                      ) : (
                        <span
                          data-verify-id={verifyId}
                          className={isNotObserved ? 'text-[var(--color-chalk-muted)] italic' : ''}
                        >
                          {String(rawValue)}
                        </span>
                      )
                    ) : (
                      <span
                        data-verify-id={verifyId}
                        className={isNotObserved ? 'text-[var(--color-chalk-muted)] italic' : ''}
                      >
                        {String(rawValue)}
                      </span>
                    );

                    if (cIdx === 0) {
                      return (
                        <th
                          key={col.key}
                          scope="row"
                          className="sticky left-0 z-10 bg-[var(--color-chalk-surface)] p-[var(--space-12)] font-semibold text-[var(--color-ink)] border-r-2 border-r-[var(--color-ink)] align-top text-left"
                        >
                          {cellContent}
                        </th>
                      );
                    }

                    return (
                      <td
                        key={col.key}
                        className={`p-[var(--space-12)] align-top border-r border-[var(--color-border-light)] last:border-r-0 text-[var(--color-ink)] tabular-nums ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
