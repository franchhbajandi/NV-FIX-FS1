import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface EpisodesTransitionProps {
  onSkipToEpisodes?: () => void;
}

const EASE_SWEEP = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Full-screen transition between the last ceremonial front-matter plate and Episode 01.
 * Sequence:
 * 1. Thin horizontal rule sweeps across the chalkboard stage (scaleX 0 -> 1).
 * 2. Chalkboard wipes into Episode 01's color (--color-notebook) via transform & opacity.
 * 3. Centered label "Learning Episodes" resolves and holds for ~1.5 seconds.
 * Under prefers-reduced-motion: shows the label statically with no wipe animation.
 * Skippable via click, keyboard, or skip button.
 */
export const EpisodesTransition: React.FC<EpisodesTransitionProps> = ({ onSkipToEpisodes }) => {
  const stageRef = useRef<HTMLElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.tier === 'lite'
    );
  });

  // Phase:
  // 0 = idle dark chalkboard before scroll entry
  // 1 = thin rule sweeps across (0ms -> 650ms)
  // 2 = chalkboard wipes into Episode 01's color + "Learning Episodes" resolves & holds ~1.5s (650ms -> 2350ms)
  // 3 = completed / settled
  const [phase, setPhase] = useState<number>(() => (reducedMotion ? 3 : 0));
  const [hasTriggered, setHasTriggered] = useState<boolean>(() => reducedMotion);

  const handleSkip = useCallback(() => {
    setPhase(3);
    setHasTriggered(true);
    onSkipToEpisodes?.();
  }, [onSkipToEpisodes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      if (mql.matches || document.documentElement.dataset.tier === 'lite') {
        setReducedMotion(true);
        setPhase(3);
        setHasTriggered(true);
      } else {
        setReducedMotion(false);
      }
    };
    handleMotionChange();
    mql.addEventListener('change', handleMotionChange);
    return () => mql.removeEventListener('change', handleMotionChange);
  }, []);

  // Trigger transition sequence when entering viewport
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || hasTriggered) return;
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHasTriggered(true);
      setPhase(3);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasTriggered(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, hasTriggered]);

  // Run rule sweep -> color wipe -> 1.5s hold sequence
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || !hasTriggered || phase >= 3) return;

    setPhase(1);
    const tWipe = window.setTimeout(() => setPhase((p) => Math.max(p, 2)), 650);
    const tHoldEnd = window.setTimeout(() => setPhase(3), 2350);

    return () => {
      window.clearTimeout(tWipe);
      window.clearTimeout(tHoldEnd);
    };
  }, [reducedMotion, hasTriggered, phase]);

  // Allow keyboard skip while transition is active
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || !hasTriggered || phase >= 3) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reducedMotion, hasTriggered, phase, handleSkip]);

  const ruleExpanded = phase >= 1;
  const wipeExpanded = !reducedMotion && phase >= 2;
  const labelVisible = reducedMotion || phase >= 2;

  return (
    <section
      ref={stageRef}
      id="episodes-transition"
      aria-label="Learning Episodes"
      onClick={phase < 3 ? handleSkip : undefined}
      className="relative w-screen left-1/2 -translate-x-1/2 min-h-screen surface-chalkboard border-y-2 border-[var(--color-ink)] overflow-hidden flex flex-col items-center justify-center p-[var(--space-24)] sm:p-[var(--space-48)] select-none"
    >
      {/* Episode 01 Color Wipe Layer (--color-notebook) — disabled under reduced motion */}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[var(--color-notebook)] z-0 will-change-[transform,opacity]"
          style={{
            transformOrigin: 'left center',
            transform: wipeExpanded ? 'scaleX(1)' : 'scaleX(0)',
            opacity: wipeExpanded ? 1 : 0,
            transition: `transform 900ms ${EASE_SWEEP}, opacity 600ms ${EASE_SWEEP}`,
          }}
        />
      )}

      {/* Sweeping Thin Horizontal Rule across Full Screen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-[4px]"
      >
        <div
          className="h-px w-full bg-[var(--color-highlighter)] will-change-[transform,opacity]"
          style={{
            transformOrigin: 'left center',
            transform: reducedMotion || ruleExpanded ? 'scaleX(1)' : 'scaleX(0)',
            opacity: reducedMotion || ruleExpanded ? 0.85 : 0,
            transition: reducedMotion
              ? 'none'
              : `transform 650ms ${EASE_SWEEP}, opacity 400ms ${EASE_SWEEP}`,
          }}
        />
        <div
          className="h-px w-full bg-[var(--color-chalk)]/60 will-change-[transform,opacity]"
          style={{
            transformOrigin: 'left center',
            transform: reducedMotion || ruleExpanded ? 'scaleX(1)' : 'scaleX(0)',
            opacity: reducedMotion || ruleExpanded ? 0.65 : 0,
            transition: reducedMotion
              ? 'none'
              : `transform 750ms ${EASE_SWEEP} 80ms, opacity 450ms ${EASE_SWEEP} 80ms`,
          }}
        />
      </div>

      {/* Centered "Learning Episodes" Label Box */}
      <div
        className="relative z-20 px-[var(--space-32)] py-[var(--space-24)] surface-chalkboard/95 border border-[var(--color-chalk)]/50 shadow-[4px_4px_0_var(--color-ink)] text-center space-y-[var(--space-12)] will-change-[transform,opacity]"
        style={{
          opacity: labelVisible ? 1 : 0,
          transform: labelVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
          transition: reducedMotion
            ? 'none'
            : `transform 700ms ${EASE_SWEEP}, opacity 700ms ${EASE_SWEEP}`,
        }}
      >
        <div aria-hidden="true" className="w-24 mx-auto space-y-[2px]">
          <div className="h-px w-full bg-[var(--color-highlighter)]" />
          <div className="h-px w-full bg-[var(--color-chalk)]/50" />
        </div>

        <h2 className="font-display font-extrabold text-scale-64 text-[var(--color-chalk)]">
          Learning Episodes
        </h2>

        <div aria-hidden="true" className="w-24 mx-auto space-y-[2px]">
          <div className="h-px w-full bg-[var(--color-chalk)]/50" />
          <div className="h-px w-full bg-[var(--color-highlighter)]" />
        </div>
      </div>

      {/* Accessible Skip Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        aria-label="Skip to Learning Episodes"
        className="relative z-20 mt-[var(--space-32)] px-[var(--space-16)] py-[var(--space-8)] border border-[var(--color-chalk)]/45 bg-[var(--color-chalkboard)]/85 text-[var(--color-chalk)] hover:border-[var(--color-highlighter)] hover:text-[var(--color-highlighter)] text-scale-12 font-semibold transition-opacity"
      >
        ↓
      </button>
    </section>
  );
};
