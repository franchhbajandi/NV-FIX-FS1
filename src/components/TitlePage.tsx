import React, { useCallback, useEffect, useRef, useState } from 'react';
import { institutionalData } from '../data/institutional';

let brandLogoModules: Record<string, { default: string }> = {};
try {
  brandLogoModules = import.meta.glob('../assets/brand/*.{png,webp}', {
    eager: true,
  }) as Record<string, { default: string }>;
} catch {
  brandLogoModules = {};
}

export const buLogoSrc: string =
  brandLogoModules['../assets/brand/logo-bicol-university.png']?.default ||
  '/assets/brand/logo-bicol-university.png';

export const buceLogoSrc: string =
  brandLogoModules['../assets/brand/logo-buce.webp']?.default ||
  '/assets/brand/logo-buce.webp';

const SESSION_STORAGE_KEY = 'fs1_title_page_seen_v1';
const SLOW_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const RESERVED_LOGOS: Array<{ id: string; src: string; alt: string }> = [
  { id: 'logo-university', src: buLogoSrc, alt: 'Bicol University logo' },
  { id: 'logo-college', src: buceLogoSrc, alt: 'Bicol University College of Education logo' },
];

interface PerLetterRevealProps {
  text: string;
  isVisible: boolean;
  isInstant: boolean;
  durationMs?: number;
  staggerMs?: number;
  className?: string;
}

/**
 * Letter-by-letter reveal using ONLY per-letter transform (translate3d) and opacity.
 * Never animates letter-spacing.
 */
const PerLetterReveal: React.FC<PerLetterRevealProps> = ({
  text,
  isVisible,
  isInstant,
  durationMs = 1150,
  staggerMs = 28,
  className = '',
}) => {
  const characters = Array.from(text);

  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      <span aria-hidden="true">
        {characters.map((char, idx) => (
          <span
            key={idx}
            className="inline-block will-change-[transform,opacity]"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 18px, 0)',
              transition: isInstant
                ? 'none'
                : `transform ${durationMs}ms ${SLOW_EASE} ${idx * staggerMs}ms, opacity ${durationMs}ms ${SLOW_EASE} ${idx * staggerMs}ms`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </span>
  );
};

export const TitlePage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLogos = RESERVED_LOGOS.some((logo) => Boolean(logo.src));

  const [isInstant, setIsInstant] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      if (window.sessionStorage.getItem(SESSION_STORAGE_KEY) === '1') return true;
    } catch {
      // Ignore storage access errors
    }
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.tier === 'lite'
    );
  });

  // Steps:
  // 0 = dark stage
  // 1 = vertical aperture curtain opens + double-rule frame resolves
  // 2 = university & college lines resolve (logo beat skipped while logos are unavailable)
  // 3 = portfolio title resolves
  // 4 = student's name resolves
  // 5 = course line resolves (final state)
  const [step, setStep] = useState<number>(() => (isInstant ? 5 : 0));
  const [hasStarted, setHasStarted] = useState<boolean>(() => isInstant);

  const markCompleteAndSkip = useCallback(() => {
    setStep(5);
    setHasStarted(true);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      if (mql.matches || document.documentElement.dataset.tier === 'lite') {
        setIsInstant(true);
        markCompleteAndSkip();
      }
    };
    handleMotionChange();
    mql.addEventListener('change', handleMotionChange);
    return () => mql.removeEventListener('change', handleMotionChange);
  }, [markCompleteAndSkip]);

  // Start sequence when Title Page enters the viewport (once per session)
  useEffect(() => {
    if (typeof window === 'undefined' || isInstant || hasStarted) return;

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasStarted(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isInstant, hasStarted]);

  // Schedule the ~8-second formal reveal sequence
  useEffect(() => {
    if (typeof window === 'undefined' || isInstant || !hasStarted || step >= 5) return;

    const logoBeatOffset = hasLogos ? 900 : 0;

    const timers: number[] = [
      window.setTimeout(() => setStep((s) => Math.max(s, 1)), 150),
      window.setTimeout(() => setStep((s) => Math.max(s, 2)), 1450 + logoBeatOffset),
      window.setTimeout(() => setStep((s) => Math.max(s, 3)), 3100 + logoBeatOffset),
      window.setTimeout(() => setStep((s) => Math.max(s, 4)), 4900 + logoBeatOffset),
      window.setTimeout(() => {
        setStep(5);
        try {
          window.sessionStorage.setItem(SESSION_STORAGE_KEY, '1');
        } catch {
          // Ignore storage errors
        }
      }, 6550 + logoBeatOffset),
    ];

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isInstant, hasStarted, hasLogos, step]);

  // Allow skipping by key press while sequence is actively playing
  useEffect(() => {
    if (typeof window === 'undefined' || isInstant || !hasStarted || step >= 5) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      markCompleteAndSkip();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInstant, hasStarted, step, markCompleteAndSkip]);

  const blockStyle = (visibleAtStep: number, durationMs = 1250): React.CSSProperties => {
    const visible = step >= visibleAtStep;
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 16px, 0)',
      transition: isInstant
        ? 'none'
        : `transform ${durationMs}ms ${SLOW_EASE}, opacity ${durationMs}ms ${SLOW_EASE}`,
    };
  };

  const ruleScaleStyle = (visibleAtStep: number, durationMs = 1300): React.CSSProperties => {
    const visible = step >= visibleAtStep;
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'scaleX(1)' : 'scaleX(0)',
      transformOrigin: 'center',
      transition: isInstant
        ? 'none'
        : `transform ${durationMs}ms ${SLOW_EASE}, opacity ${durationMs}ms ${SLOW_EASE}`,
    };
  };

  const isApertureOpen = step >= 1;

  return (
    <div
      ref={containerRef}
      data-redpen-component="InstitutionalTitleCard"
      data-redpen-tokens="--color-chalkboard, --color-chalk, --color-highlighter"
      onClick={step < 5 ? markCompleteAndSkip : undefined}
      className={`relative overflow-hidden surface-chalkboard text-[var(--color-chalk)] max-w-4xl mx-auto p-[var(--space-24)] sm:p-[var(--space-48)] border border-[var(--color-chalk)]/35 shadow-[4px_4px_0_var(--color-ink)] select-none ${
        step < 5 ? 'cursor-pointer' : ''
      }`}
    >
      {/* Symmetrical Outer & Inner Thin Double-Rule Frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[8px] sm:inset-[14px] border border-[var(--color-chalk)]/40 z-10"
        style={{
          opacity: isApertureOpen ? 1 : 0,
          transform: isApertureOpen ? 'scale(1)' : 'scale(0.985)',
          transition: isInstant
            ? 'none'
            : `transform 1350ms ${SLOW_EASE}, opacity 1350ms ${SLOW_EASE}`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[12px] sm:inset-[18px] border border-[var(--color-highlighter)]/35 z-10"
        style={{
          opacity: isApertureOpen ? 1 : 0,
          transform: isApertureOpen ? 'scale(1)' : 'scale(0.975)',
          transition: isInstant
            ? 'none'
            : `transform 1400ms ${SLOW_EASE} 90ms, opacity 1400ms ${SLOW_EASE} 90ms`,
        }}
      />

      {/* Vertical Aperture Curtain Panels (Left & Right halves parting from center) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[var(--color-chalkboard)] border-r border-[var(--color-highlighter)]/40 z-20 will-change-[transform,opacity]"
        style={{
          transformOrigin: 'left center',
          transform: isApertureOpen ? 'scaleX(0)' : 'scaleX(1)',
          opacity: isApertureOpen ? 0 : 1,
          transition: isInstant
            ? 'none'
            : `transform 1350ms ${SLOW_EASE}, opacity 1350ms ${SLOW_EASE}`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[var(--color-chalkboard)] border-l border-[var(--color-highlighter)]/40 z-20 will-change-[transform,opacity]"
        style={{
          transformOrigin: 'right center',
          transform: isApertureOpen ? 'scaleX(0)' : 'scaleX(1)',
          opacity: isApertureOpen ? 0 : 1,
          transition: isInstant
            ? 'none'
            : `transform 1350ms ${SLOW_EASE}, opacity 1350ms ${SLOW_EASE}`,
        }}
      />

      {/* Centered, Symmetrical Formal Stage Content */}
      <div className="relative z-10 py-[var(--space-32)] sm:py-[var(--space-48)] px-[var(--space-16)] sm:px-[var(--space-32)] flex flex-col items-center text-center space-y-[var(--space-32)]">
        {/* University & College Emblems on Light Circular Plates */}
        <div
          style={blockStyle(2, 1250)}
          data-logo-slots="active"
          className="flex items-center justify-center gap-[var(--space-24)] will-change-[transform,opacity]"
        >
          {RESERVED_LOGOS.map((logo) => (
            <div
              key={logo.id}
              data-logo-slot={logo.id}
              className="w-20 h-20 rounded-full bg-[var(--color-chalk)] p-2 flex items-center justify-center"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                width={64}
                height={64}
                className="w-16 h-16 min-w-[48px] min-h-[48px] object-contain"
              />
            </div>
          ))}
        </div>

        {/* Beat 2: University and College Lines */}
        <div
          style={blockStyle(2, 1250)}
          className="space-y-[var(--space-8)] max-w-2xl mx-auto will-change-[transform,opacity]"
        >
          <p className="text-scale-12 uppercase tracking-[0.22em] [font-variant-caps:small-caps] text-[var(--color-chalk-faint)] font-semibold">
            {institutionalData.institution.republic}
          </p>
          <p className="font-display font-bold text-scale-28 text-[var(--color-chalk)]">
            {institutionalData.institution.university}
          </p>
          <p className="font-display font-semibold text-scale-20 text-[var(--color-chalk)]">
            {institutionalData.institution.college}
          </p>
          <p className="text-scale-12 uppercase tracking-[0.18em] [font-variant-caps:small-caps] text-[var(--color-highlighter)] font-semibold pt-[var(--space-4)]">
            {institutionalData.institution.office}
          </p>
          <p className="text-scale-12 uppercase tracking-[0.16em] [font-variant-caps:small-caps] text-[var(--color-chalk-faint)]">
            {institutionalData.institution.location}
          </p>
        </div>

        {/* Top Symmetrical Thin Double Rule */}
        <div
          aria-hidden="true"
          style={ruleScaleStyle(3, 1250)}
          className="w-full max-w-xl mx-auto space-y-[3px] will-change-[transform,opacity]"
        >
          <div className="h-px w-full bg-[var(--color-chalk)]/55" />
          <div className="h-px w-full bg-[var(--color-highlighter)]/45" />
        </div>

        {/* Beat 3: Portfolio Title (Per-Letter Transform & Opacity Reveal) */}
        <div className="py-[var(--space-8)] max-w-3xl mx-auto">
          <h3 className="font-display font-extrabold text-scale-64 text-[var(--color-chalk)]">
            <PerLetterReveal
              text={institutionalData.student.portfolioTitle}
              isVisible={step >= 3}
              isInstant={isInstant}
              durationMs={1200}
              staggerMs={32}
            />
          </h3>
        </div>

        {/* Middle Symmetrical Thin Double Rule */}
        <div
          aria-hidden="true"
          style={ruleScaleStyle(4, 1250)}
          className="w-full max-w-xl mx-auto space-y-[3px] will-change-[transform,opacity]"
        >
          <div className="h-px w-full bg-[var(--color-highlighter)]/45" />
          <div className="h-px w-full bg-[var(--color-chalk)]/55" />
        </div>

        {/* Beat 4: Student's Name & Degree */}
        <div
          style={blockStyle(4, 1250)}
          className="space-y-[var(--space-8)] max-w-2xl mx-auto will-change-[transform,opacity]"
        >
          <p className="font-display font-bold text-scale-28 text-[var(--color-chalk)]">
            <PerLetterReveal
              text={institutionalData.student.name}
              isVisible={step >= 4}
              isInstant={isInstant}
              durationMs={1150}
              staggerMs={24}
            />
          </p>
          <p className="text-scale-14 text-[var(--color-chalk-faint)]">
            {institutionalData.student.degree} · {institutionalData.student.major}
          </p>
          <p className="text-scale-12 uppercase tracking-[0.18em] [font-variant-caps:small-caps] text-[var(--color-chalk-faint)]">
            {institutionalData.student.yearLevel}
          </p>
        </div>

        {/* Bottom Symmetrical Thin Double Rule */}
        <div
          aria-hidden="true"
          style={ruleScaleStyle(5, 1250)}
          className="w-full max-w-md mx-auto space-y-[3px] will-change-[transform,opacity]"
        >
          <div className="h-px w-full bg-[var(--color-chalk)]/45" />
          <div className="h-px w-full bg-[var(--color-highlighter)]/35" />
        </div>

        {/* Beat 5: Course Line */}
        <div
          style={blockStyle(5, 1300)}
          className="space-y-[var(--space-8)] max-w-2xl mx-auto will-change-[transform,opacity]"
        >
          <p className="text-scale-12 uppercase tracking-[0.22em] [font-variant-caps:small-caps] text-[var(--color-highlighter)] font-semibold">
            {institutionalData.course.code}
          </p>
          <p className="font-display font-bold text-scale-20 text-[var(--color-chalk)]">
            {institutionalData.course.title}
          </p>
          <p className="text-scale-12 uppercase tracking-[0.18em] [font-variant-caps:small-caps] text-[var(--color-chalk-faint)]">
            {institutionalData.student.academicYear}
          </p>
        </div>
      </div>
    </div>
  );
};
