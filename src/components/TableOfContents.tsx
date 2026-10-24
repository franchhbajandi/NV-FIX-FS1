import React, { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { episodesData } from '../data/episodes';
import {
  isStatusPending,
  getEpisodeId,
  getEpisodeStatus,
  shouldHidePending,
  getEpisodeActivities,
} from '../data/contentIntake';
import { Button } from './Button';

export interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (targetId: string) => void;
  onOpenPrint: () => void;
}

const EPISODE_TAB_COLOR: Record<string, string> = {
  '01': 'var(--color-notebook)',
  '02': 'var(--color-construction)',
  '03': 'var(--color-plum)',
  '04': 'var(--color-red-pen)',
  '05': 'var(--color-highlighter)',
  '06': 'var(--color-construction-dark)',
};

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenPrint,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Trap focus inside full-screen chalkboard overlay and restore on close (Section 5 requirement)
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 20);
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    onClose();
    onNavigate(targetId);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Table of contents"
      data-redpen-component="TableOfContents"
      data-redpen-tokens="--color-chalkboard, --color-chalk, --space-32"
      className="fixed inset-0 z-50 surface-chalkboard overflow-y-auto p-[var(--space-24)] sm:p-[var(--space-48)] no-print"
    >
      <div className="max-w-5xl mx-auto space-y-[var(--space-32)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[var(--color-border-dark)] pb-[var(--space-16)]">
          <div>
            <p className="text-scale-14 text-[var(--color-chalk-faint)]">
              Field Study 1 portfolio contents
            </p>
            <h2 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
              Table of contents
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close table of contents"
            className="btn-base btn-secondary-dark"
          >
            <X size={18} aria-hidden="true" />
            <span>Close</span>
          </button>
        </div>

        {/* Full-screen chalkboard list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-32)]">
          {/* Left column: Act I, Act II, Act IV */}
          <div className="space-y-[var(--space-32)]">
            {/* Act I */}
            <div className="space-y-[var(--space-12)]">
              <h3 className="font-display font-bold text-scale-20 text-[var(--color-chalk)] border-b border-[var(--color-border-dark)] pb-[var(--space-8)]">
                Act I: Opening
              </h3>
              <ul className="space-y-[var(--space-8)] text-scale-17">
                <li>
                  <a
                    href="#act-1"
                    onClick={(e) => handleLinkClick(e, 'act-1')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Title page and institutional header
                  </a>
                </li>
                <li>
                  <a
                    href="#acknowledgements"
                    onClick={(e) => handleLinkClick(e, 'acknowledgements')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Acknowledgement
                  </a>
                </li>
              </ul>
            </div>

            {/* Act II */}
            <div className="space-y-[var(--space-12)]">
              <h3 className="font-display font-bold text-scale-20 text-[var(--color-chalk)] border-b border-[var(--color-border-dark)] pb-[var(--space-8)]">
                Act II: Foundations
              </h3>
              <ul className="space-y-[var(--space-8)] text-scale-17">
                <li>
                  <a
                    href="#introduction"
                    onClick={(e) => handleLinkClick(e, 'introduction')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Course description and learning outcomes
                  </a>
                </li>
                <li>
                  <a
                    href="#prayer"
                    onClick={(e) => handleLinkClick(e, 'prayer')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Prayer of the field study student
                  </a>
                </li>
                <li>
                  <a
                    href="#philosophy"
                    onClick={(e) => handleLinkClick(e, 'philosophy')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] font-semibold transition-colors"
                  >
                    Personal educational philosophy
                  </a>
                </li>
                <li>
                  <a
                    href="#cv"
                    onClick={(e) => handleLinkClick(e, 'cv')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Curriculum vitae
                  </a>
                </li>
                <li>
                  <a
                    href="#institutional-vmgo"
                    onClick={(e) => handleLinkClick(e, 'institutional-vmgo')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Bicol University and DepEd vision and mission
                  </a>
                </li>
              </ul>
            </div>

            {/* Act IV */}
            <div className="space-y-[var(--space-12)]">
              <h3 className="font-display font-bold text-scale-20 text-[var(--color-chalk)] border-b border-[var(--color-border-dark)] pb-[var(--space-8)]">
                Act IV: Evidence and appendices
              </h3>
              <ul className="space-y-[var(--space-8)] text-scale-17">
                <li>
                  <a
                    href="#resource-teacher-profile"
                    onClick={(e) => handleLinkClick(e, 'resource-teacher-profile')}
                    className="block py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    Resource teacher profile (Herson N. Alamo)
                  </a>
                </li>
                <li>
                  <a
                    href="#class-program"
                    onClick={(e) => handleLinkClick(e, 'class-program')}
                    className="flex items-center justify-between py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    <span>Class program and documentation</span>
                    <span className="text-scale-12 text-[var(--color-chalk-faint)]">pending</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#dtr"
                    onClick={(e) => handleLinkClick(e, 'dtr')}
                    className="flex items-center justify-between py-[var(--space-8)] px-[var(--space-12)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                  >
                    <span>Daily time record and clearance</span>
                    <span className="text-scale-12 text-[var(--color-chalk-faint)]">pending</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right column: Act III Episodes with Episode Color Tabs */}
          <div className="space-y-[var(--space-16)]">
            <h3 className="font-display font-bold text-scale-20 text-[var(--color-chalk)] border-b border-[var(--color-border-dark)] pb-[var(--space-8)]">
              Act III: The field (Learning episodes 01–06)
            </h3>

            <ul className="space-y-[var(--space-12)]">
              <li>
                <a
                  href="#school-site"
                  onClick={(e) => handleLinkClick(e, 'school-site')}
                  className="flex items-center justify-between p-[var(--space-16)] surface-chalkboard-elevated border border-[var(--color-border-dark)] hover:border-[var(--color-chalk)] transition-colors"
                >
                  <span className="font-display font-bold text-scale-17">
                    School site and classroom rules
                  </span>
                  <span className="text-scale-12 text-[var(--color-chalk-faint)]">pending</span>
                </a>
              </li>

              {episodesData.map((ep) => {
                const epId = getEpisodeId(ep);
                const tabColor = EPISODE_TAB_COLOR[ep.number] || 'var(--color-notebook)';
                const pending = isStatusPending(getEpisodeStatus(ep), epId);
                if (shouldHidePending() && pending) return null;
                const summaryLine = ep.thesis || ep.themeQuote;
                const activities = getEpisodeActivities(ep);
                return (
                  <li
                    key={epId}
                    className="surface-chalkboard-elevated border-2 border-[var(--color-border-dark)] overflow-hidden"
                  >
                    <a
                      href={`#${epId}`}
                      onClick={(e) => handleLinkClick(e, epId)}
                      className="flex items-stretch hover:bg-[var(--color-chalkboard)] transition-colors"
                    >
                      {/* Episode color tab */}
                      <span
                        style={{ backgroundColor: tabColor }}
                        className="w-[var(--space-16)] shrink-0"
                        aria-hidden="true"
                      />
                      <div className="p-[var(--space-16)] flex-1 flex items-center justify-between gap-[var(--space-12)]">
                        <div>
                          <span className="font-display font-bold text-scale-20 text-[var(--color-chalk)] block">
                            {ep.number} · {ep.title}
                          </span>
                          {summaryLine && (
                            <span className="text-scale-14 text-[var(--color-chalk-faint)] block mt-[var(--space-4)]">
                              {summaryLine}
                            </span>
                          )}
                        </div>
                        {pending && (
                          <span className="text-scale-12 text-[var(--color-chalk-faint)] shrink-0">
                            pending
                          </span>
                        )}
                      </div>
                    </a>

                    {activities.length > 0 && (
                      <ul className="border-t border-[var(--color-border-dark)] bg-[var(--color-chalkboard)] px-[var(--space-16)] py-[var(--space-8)] space-y-[var(--space-4)]">
                        {activities.map((act) => (
                          <li
                            key={act.id}
                            className={act.isSubActivity ? 'pl-[var(--space-16)]' : ''}
                          >
                            <a
                              href={`#${act.id}`}
                              onClick={(e) => handleLinkClick(e, act.id)}
                              className="block py-[var(--space-4)] text-scale-14 text-[var(--color-chalk-faint)] hover:text-[var(--color-chalk)] transition-colors"
                            >
                              <span className="font-mono font-semibold text-[var(--color-chalk)]">
                                {act.label}
                              </span>
                              {act.title ? ` · ${act.title}` : ''}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="pt-[var(--space-16)] border-t border-[var(--color-border-dark)] flex flex-wrap items-center justify-between gap-[var(--space-12)]">
              <Button
                variant="primary-highlighter"
                onClick={() => {
                  onClose();
                  onOpenPrint();
                }}
              >
                <Printer size={16} aria-hidden="true" />
                <span>Open print edition (A4)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
