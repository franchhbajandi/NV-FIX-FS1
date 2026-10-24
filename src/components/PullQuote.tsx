import React, { useEffect, useRef, useState } from 'react';

export interface PullQuoteProps {
  quote: string;
  attribution?: string;
  role?: string;
  context?: string;
  verifyId?: string;
  className?: string;
}

export const PullQuote: React.FC<PullQuoteProps> = ({
  quote,
  attribution,
  role,
  context,
  verifyId,
  className = '',
}) => {
  const figureRef = useRef<HTMLElement>(null);
  const [isDrawn, setIsDrawn] = useState(false);

  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsDrawn(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={figureRef}
      data-redpen-component="PullQuote"
      data-redpen-tokens="--color-highlighter, --color-ink, --text-20, --dur-slow"
      className={`p-[var(--space-16)] shape-index-card-plain break-inside-avoid ${className}`}
    >
      <blockquote className="font-display font-bold text-scale-20 text-[var(--color-ink)] leading-snug">
        <span aria-hidden="true">“</span>
        <span
          data-verify-id={verifyId}
          className="highlighter-mark"
          data-drawn={isDrawn ? 'true' : 'false'}
        >
          {quote}
        </span>
        <span aria-hidden="true">”</span>
      </blockquote>

      {(attribution || role || context) && (
        <figcaption className="mt-[var(--space-12)] text-scale-12 text-[var(--color-chalk-muted)] flex items-center flex-wrap gap-[var(--space-8)]">
          {attribution && (
            <span className="font-semibold text-[var(--color-ink)]">{attribution}</span>
          )}
          {role && (
            <>
              <span aria-hidden="true">·</span>
              <span>{role}</span>
            </>
          )}
          {context && (
            <>
              <span aria-hidden="true">·</span>
              <span>{context}</span>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
};
