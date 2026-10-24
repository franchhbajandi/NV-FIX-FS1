import React, { useEffect, useRef, useState } from 'react';
import { shouldHidePending } from '../data/contentIntake';

export interface PhotoFrameProps {
  src?: string;
  alt?: string;
  caption: string;
  credit?: string;
  role?: string;
  needsFaceCheck?: boolean;
  verifyId?: string;
  treatment?: 'none' | 'duotone' | 'halftone';
  shape?: 'index-card' | 'sticky' | 'plain';
  tilt?: boolean;
  assetSlotLabel?: string;
  className?: string;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  src,
  alt,
  caption,
  credit,
  role,
  needsFaceCheck = false,
  verifyId,
  treatment = 'none',
  shape = 'index-card',
  tilt = false,
  assetSlotLabel,
  className = '',
}) => {
  const figureRef = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const hidePending = shouldHidePending();

  const resolvedAlt =
    (alt && alt.trim().length > 0 ? alt : caption) || 'Classroom observation photograph';

  const isIllustrationRole =
    role === 'illustration' ||
    Boolean(assetSlotLabel && assetSlotLabel.includes('personal-illustration'));

  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // In production, hide non-illustration frames that have no image src
  if (!src && !isIllustrationRole && hidePending) {
    return null;
  }

  const shapeClass =
    shape === 'sticky'
      ? 'shape-sticky-note'
      : shape === 'index-card'
      ? 'shape-index-card'
      : 'shape-index-card-plain';

  const treatmentClass = treatment === 'duotone' ? 'treatment-duotone' : '';

  return (
    <figure
      ref={figureRef}
      data-redpen-component="PhotoFrame"
      data-redpen-tokens="--color-chalk-surface, --color-ink, --shadow-hard, --dur-slow"
      style={{
        transform: tilt ? 'rotate(-1deg)' : undefined,
      }}
      className={`p-[var(--space-16)] ${shapeClass} ${treatmentClass} break-inside-avoid ${className}`}
    >
      {/* Image container with clip-path reveal on enter only */}
      <div
        style={{
          clipPath: isRevealed ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          transition: 'clip-path var(--dur-slow) var(--ease-classroom)',
        }}
        className="relative overflow-hidden border border-[var(--color-ink)] bg-[var(--color-chalk)]"
      >
        {treatment === 'halftone' && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-halftone opacity-20 pointer-events-none z-10 text-[var(--color-ink)]"
          />
        )}

        {src ? (
          <img
            src={src}
            alt={resolvedAlt}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover block"
          />
        ) : isIllustrationRole ? (
          /* Inked architectural line-art sketch of ideal classroom when binary file is not yet mounted */
          <div
            role="img"
            aria-label={resolvedAlt}
            className="p-[var(--space-16)] bg-[#F8FAF6]"
          >
            <svg
              viewBox="0 0 760 400"
              className="w-full h-auto block"
              aria-hidden="true"
            >
              {/* Architectural Graph Lines */}
              <g stroke="rgba(12,22,18,0.08)" strokeWidth="1">
                {Array.from({ length: 19 }).map((_, i) => (
                  <line key={`vg-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={400} />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`hg-${i}`} x1={0} y1={i * 40} x2={760} y2={i * 40} />
                ))}
              </g>
              {/* Room Perimeter */}
              <rect
                x="28"
                y="24"
                width="704"
                height="352"
                fill="none"
                stroke="#0C1612"
                strokeWidth="2.5"
              />
              {/* Content-Rich Bulletin Board (Back/Left Wall) */}
              <rect
                x="48"
                y="44"
                width="180"
                height="86"
                fill="#FFE600"
                fillOpacity="0.22"
                stroke="#0C1612"
                strokeWidth="2"
              />
              <text x="60" y="66" fill="#0C1612" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                CONTENT-RICH BULLETIN BOARD
              </text>
              <rect x="60" y="76" width="44" height="38" fill="#F8FAF6" stroke="#0C1612" strokeWidth="1.5" />
              <rect x="112" y="76" width="44" height="38" fill="#F8FAF6" stroke="#0C1612" strokeWidth="1.5" />
              <rect x="164" y="76" width="50" height="38" fill="#F8FAF6" stroke="#0C1612" strokeWidth="1.5" />

              {/* Dedicated Reading / Study Nook (Right Corner) */}
              <rect
                x="520"
                y="44"
                width="192"
                height="120"
                fill="#0F6B45"
                fillOpacity="0.10"
                stroke="#0F6B45"
                strokeWidth="2"
              />
              <text x="534" y="66" fill="#09472D" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                READING &amp; STUDY NOOK
              </text>
              <circle cx="575" cy="115" r="22" fill="#F8FAF6" stroke="#0C1612" strokeWidth="1.8" />
              <rect x="620" y="84" width="76" height="62" fill="#F8FAF6" stroke="#0C1612" strokeWidth="1.8" />

              {/* Teacher at Student Eye-Level (Center Collaborative Station) */}
              <circle
                cx="370"
                cy="110"
                r="34"
                fill="#2447FF"
                fillOpacity="0.12"
                stroke="#2447FF"
                strokeWidth="2"
              />
              <text x="370" y="106" textAnchor="middle" fill="#0C1612" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                TEACHER AT
              </text>
              <text x="370" y="120" textAnchor="middle" fill="#0C1612" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                EYE-LEVEL
              </text>

              {/* Clustered Desks Instead of Rigid Rows (3 Inclusive Clusters) */}
              {[
                { cx: 155, cy: 255, label: 'CLUSTER A · COLLABORATIVE POD' },
                { cx: 375, cy: 265, label: 'CLUSTER B · INCLUSIVE DIALOGUE' },
                { cx: 595, cy: 255, label: 'CLUSTER C · PEER GROUP' },
              ].map((pod, idx) => (
                <g key={idx}>
                  <rect
                    x={pod.cx - 75}
                    y={pod.cy - 48}
                    width="150"
                    height="92"
                    rx="4"
                    fill="#F8FAF6"
                    stroke="#0C1612"
                    strokeWidth="2"
                  />
                  <line
                    x1={pod.cx}
                    y1={pod.cy - 48}
                    x2={pod.cx}
                    y2={pod.cy + 44}
                    stroke="#0C1612"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1={pod.cx - 75}
                    y1={pod.cy - 2}
                    x2={pod.cx + 75}
                    y2={pod.cy - 2}
                    stroke="#0C1612"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  {/* Student seats around cluster (no isolated figures) */}
                  <circle cx={pod.cx - 38} cy={pod.cy - 60} r="8" fill="#0F6B45" />
                  <circle cx={pod.cx + 38} cy={pod.cy - 60} r="8" fill="#0F6B45" />
                  <circle cx={pod.cx - 38} cy={pod.cy + 56} r="8" fill="#0F6B45" />
                  <circle cx={pod.cx + 38} cy={pod.cy + 56} r="8" fill="#0F6B45" />
                  <text
                    x={pod.cx}
                    y={pod.cy + 80}
                    textAnchor="middle"
                    fill="#3E4E46"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                  >
                    {pod.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="p-[var(--space-24)] min-h-[160px] flex flex-col items-start justify-center gap-[var(--space-8)] bg-[var(--color-chalk)] text-[var(--color-ink)]"
          >
            <div className="flex flex-wrap items-center gap-[var(--space-8)]">
              <span className="font-display font-bold text-scale-14 text-[var(--color-ink)]">
                {assetSlotLabel ? `Photo file: ${assetSlotLabel}` : 'Classroom documentation slot'}
              </span>
              {role && (
                <span className="px-[var(--space-8)] py-[2px] border border-[var(--color-ink)] bg-[var(--color-chalk-surface)] text-scale-12 font-semibold">
                  {role}
                </span>
              )}
              {needsFaceCheck && (
                <span className="px-[var(--space-8)] py-[2px] border border-[var(--color-red-pen)] text-[var(--color-red-pen)] text-scale-12 font-semibold">
                  needsFaceCheck
                </span>
              )}
            </div>
            <p className="text-scale-12 text-[var(--color-chalk-muted)]">{caption || alt}</p>
          </div>
        )}
      </div>

      {/* Caption and optional credit */}
      {(caption || credit || verifyId) && (
        <figcaption
          className={
            verifyId === 'ep-02-illustration-caption'
              ? 'sr-only'
              : 'mt-[var(--space-12)] pt-[var(--space-8)] border-t border-[var(--color-border-light)] flex flex-wrap items-baseline justify-between gap-[var(--space-8)] text-scale-12 text-[var(--color-chalk-muted)]'
          }
        >
          <span
            data-verify-id={verifyId}
            className={
              verifyId === 'ep-02-illustration-caption'
                ? 'hidden'
                : 'text-[var(--color-ink)] font-medium'
            }
          >
            {caption}
          </span>
          {!caption && alt && (
            <span aria-hidden="true" data-verify-source="" className="text-[var(--color-ink)] font-medium">
              {alt}
            </span>
          )}
          {credit && <span>{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
};
