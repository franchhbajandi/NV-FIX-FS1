import React, { useEffect, useRef, useState } from 'react';

/**
 * Hook that triggers SVG stroke-draw animation when the element scrolls into view.
 * Immediately renders in its final drawn state when prefers-reduced-motion: reduce
 * or lite tier is active.
 */
function useDrawOnScroll<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.tier === 'lite'
    );
  });
  const [isDrawn, setIsDrawn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.tier === 'lite'
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkReduced = () => {
      const isLite = document.documentElement.dataset.tier === 'lite';
      if (mql.matches || isLite) {
        setReducedMotion(true);
        setIsDrawn(true);
        return true;
      }
      setReducedMotion(false);
      return false;
    };

    if (checkReduced()) {
      mql.addEventListener('change', checkReduced);
      return () => mql.removeEventListener('change', checkReduced);
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsDrawn(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsDrawn(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(node);
    mql.addEventListener('change', checkReduced);

    return () => {
      observer.disconnect();
      mql.removeEventListener('change', checkReduced);
    };
  }, []);

  return { ref, isDrawn, reducedMotion };
}

export interface OrnamentCornerBracketsProps {
  /** Primary stroke token (defaults to --color-construction) */
  primaryColor?: string;
  /** Secondary accent token (defaults to --color-highlighter) */
  accentColor?: string;
  /** Size of each corner SVG in px */
  size?: number;
  className?: string;
}

/**
 * Four SVG corner brackets positioned around a container's perimeter.
 * Sits strictly around content (pointer-events-none, aria-hidden) and never under body text.
 */
export const OrnamentCornerBrackets: React.FC<OrnamentCornerBracketsProps> = ({
  primaryColor = 'var(--color-construction)',
  accentColor = 'var(--color-highlighter)',
  size = 22,
  className = '',
}) => {
  const { ref, isDrawn, reducedMotion } = useDrawOnScroll<HTMLDivElement>();

  const drawStyle = (delayMs = 0): React.CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: isDrawn ? 0 : 1,
    transition: reducedMotion
      ? 'none'
      : `stroke-dashoffset var(--dur-slow) var(--ease-classroom) ${delayMs}ms`,
  });

  const corners: Array<{ key: string; posClass: string; rotate: string }> = [
    { key: 'tl', posClass: 'top-[4px] left-[4px]', rotate: 'rotate-0' },
    { key: 'tr', posClass: 'top-[4px] right-[4px]', rotate: 'rotate-90' },
    { key: 'br', posClass: 'bottom-[4px] right-[4px]', rotate: 'rotate-180' },
    { key: 'bl', posClass: 'bottom-[4px] left-[4px]', rotate: '-rotate-90' },
  ];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 z-10 ${className}`}
    >
      {corners.map((corner, idx) => (
        <svg
          key={corner.key}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`absolute ${corner.posClass} ${corner.rotate}`}
        >
          {/* Outer corner bracket in ink + primary token */}
          <path
            d="M2 22V2H22"
            stroke="var(--color-ink)"
            strokeWidth="2.5"
            strokeLinecap="square"
            pathLength={1}
            style={drawStyle(idx * 45)}
          />
          {/* Inner offset step rule in primary token */}
          <path
            d="M6 17V6H17"
            stroke={primaryColor}
            strokeWidth="1.75"
            strokeLinecap="square"
            pathLength={1}
            style={drawStyle(90 + idx * 45)}
          />
          {/* Corner registration square in accent token */}
          <rect
            x="1.5"
            y="1.5"
            width="4"
            height="4"
            fill={accentColor}
            stroke="var(--color-ink)"
            strokeWidth="1"
            style={{
              opacity: isDrawn ? 1 : 0,
              transition: reducedMotion ? 'none' : 'opacity var(--dur-base) var(--ease-classroom)',
            }}
          />
        </svg>
      ))}
    </div>
  );
};

export interface OrnamentDoubleRuleProps {
  /** Primary stroke token */
  primaryColor?: string;
  /** Secondary parallel stroke token */
  secondaryColor?: string;
  /** Accent tick token */
  accentColor?: string;
  className?: string;
}

/**
 * Horizontal SVG double rule with terminal ticks that draws across on scroll.
 */
export const OrnamentDoubleRule: React.FC<OrnamentDoubleRuleProps> = ({
  primaryColor = 'var(--color-ink)',
  secondaryColor = 'var(--color-construction)',
  accentColor = 'var(--color-highlighter)',
  className = '',
}) => {
  const { ref, isDrawn, reducedMotion } = useDrawOnScroll<SVGSVGElement>();

  const primaryLineStyle: React.CSSProperties = {
    strokeDasharray: 1,
    strokeDashoffset: isDrawn ? 0 : 1,
    transition: reducedMotion
      ? 'none'
      : 'stroke-dashoffset var(--dur-slow) var(--ease-classroom)',
  };

  const secondaryLineStyle: React.CSSProperties = {
    strokeDasharray: 1,
    strokeDashoffset: isDrawn ? 0 : 1,
    transition: reducedMotion
      ? 'none'
      : 'stroke-dashoffset var(--dur-slow) var(--ease-classroom) 110ms',
  };

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 800 14"
      preserveAspectRatio="none"
      fill="none"
      className={`w-full h-[14px] block pointer-events-none select-none ${className}`}
    >
      {/* Upper thick structural rule */}
      <line
        x1="0"
        y1="3.5"
        x2="800"
        y2="3.5"
        stroke={primaryColor}
        strokeWidth="2.5"
        pathLength={1}
        style={primaryLineStyle}
      />
      {/* Lower parallel editorial rule */}
      <line
        x1="0"
        y1="9.5"
        x2="800"
        y2="9.5"
        stroke={secondaryColor}
        strokeWidth="1.5"
        pathLength={1}
        style={secondaryLineStyle}
      />
      {/* Left & right registration stops */}
      <rect
        x="0"
        y="1"
        width="10"
        height="11"
        fill={accentColor}
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        style={{
          opacity: isDrawn ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity var(--dur-base) var(--ease-classroom)',
        }}
      />
      <rect
        x="790"
        y="1"
        width="10"
        height="11"
        fill={secondaryColor}
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        style={{
          opacity: isDrawn ? 1 : 0,
          transition: reducedMotion
            ? 'none'
            : 'opacity var(--dur-base) var(--ease-classroom) 180ms',
        }}
      />
    </svg>
  );
};

export interface OrnamentSectionDividerProps {
  /** Primary wing rule color token */
  primaryColor?: string;
  /** Accent emblem fill token */
  accentColor?: string;
  className?: string;
}

/**
 * Full-width SVG section divider that draws outward from center on scroll.
 * Sits between content sections and never under body text.
 */
export const OrnamentSectionDivider: React.FC<OrnamentSectionDividerProps> = ({
  primaryColor = 'var(--color-construction)',
  accentColor = 'var(--color-highlighter)',
  className = '',
}) => {
  const { ref, isDrawn, reducedMotion } = useDrawOnScroll<HTMLDivElement>();

  const wingStyle = (delayMs = 0): React.CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: isDrawn ? 0 : 1,
    transition: reducedMotion
      ? 'none'
      : `stroke-dashoffset var(--dur-slow) var(--ease-classroom) ${delayMs}ms`,
  });

  const emblemStyle: React.CSSProperties = {
    opacity: isDrawn ? 1 : 0,
    transform: isDrawn ? 'scale(1)' : 'scale(0.85)',
    transformOrigin: 'center',
    transition: reducedMotion
      ? 'none'
      : 'opacity var(--dur-base) var(--ease-classroom), transform var(--dur-base) var(--ease-classroom)',
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`w-full py-[var(--space-8)] pointer-events-none select-none ${className}`}
    >
      <svg
        viewBox="0 0 960 28"
        fill="none"
        className="w-full h-[28px] block overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Left Wing Double Rule (draws from center 436 outward to 4) */}
        <path
          d="M436 11H4"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="square"
          pathLength={1}
          style={wingStyle(0)}
        />
        <path
          d="M436 17H28"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeLinecap="square"
          pathLength={1}
          style={wingStyle(90)}
        />
        {/* Left Wing End Bracket Tick */}
        <path
          d="M4 6V22"
          stroke="var(--color-ink)"
          strokeWidth="2"
          pathLength={1}
          style={wingStyle(180)}
        />

        {/* Right Wing Double Rule (draws from center 524 outward to 956) */}
        <path
          d="M524 11H956"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="square"
          pathLength={1}
          style={wingStyle(0)}
        />
        <path
          d="M524 17H932"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeLinecap="square"
          pathLength={1}
          style={wingStyle(90)}
        />
        {/* Right Wing End Bracket Tick */}
        <path
          d="M956 6V22"
          stroke="var(--color-ink)"
          strokeWidth="2"
          pathLength={1}
          style={wingStyle(180)}
        />

        {/* Center Geometric Editorial Emblem */}
        <g style={emblemStyle}>
          {/* Left & Right flank chevrons */}
          <path
            d="M454 8L448 14L454 20"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M506 8L512 14L506 20"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="square"
          />
          {/* Outer rotated diamond in construction green */}
          <polygon
            points="480,2 494,14 480,26 466,14"
            fill={primaryColor}
            stroke="var(--color-ink)"
            strokeWidth="2"
          />
          {/* Inner highlighter registration square */}
          <rect
            x="476"
            y="10"
            width="8"
            height="8"
            fill={accentColor}
            stroke="var(--color-ink)"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
};
