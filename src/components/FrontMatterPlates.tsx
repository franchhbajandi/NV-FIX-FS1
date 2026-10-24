import React, { useEffect, useRef, useState } from 'react';
import { institutionalData } from '../data/institutional';
import { educationalPhilosophy } from '../data/philosophy';
import { episodesData } from '../data/episodes';
import { resolveAppendixPhotoSrc } from '../data/appendices';
import {
  getEpisodeId,
  getEpisodeStatus,
  isStatusPending,
  shouldHidePending,
} from '../data/contentIntake';

const SLOW_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function toRomanLower(num: number): string {
  const map: Array<[number, string]> = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let n = num;
  let out = '';
  for (const [val, roman] of map) {
    while (n >= val) {
      out += roman;
      n -= val;
    }
  }
  return out;
}

function usePlateReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [isInstant, setIsInstant] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.tier === 'lite'
    );
  });
  const [isVisible, setIsVisible] = useState<boolean>(() => {
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
      if (mql.matches || document.documentElement.dataset.tier === 'lite') {
        setIsInstant(true);
        setIsVisible(true);
        return true;
      }
      setIsInstant(false);
      return false;
    };

    if (checkReduced()) {
      mql.addEventListener('change', checkReduced);
      return () => mql.removeEventListener('change', checkReduced);
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(node);
    mql.addEventListener('change', checkReduced);
    return () => {
      observer.disconnect();
      mql.removeEventListener('change', checkReduced);
    };
  }, []);

  const lineStyle = (lineIndex: number, durationMs = 1200): React.CSSProperties => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 16px, 0)',
    transition: isInstant
      ? 'none'
      : `transform ${durationMs}ms ${SLOW_EASE} ${lineIndex * 140}ms, opacity ${durationMs}ms ${SLOW_EASE} ${lineIndex * 140}ms`,
  });

  const ruleStyle = (lineIndex: number, durationMs = 1300): React.CSSProperties => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
    transformOrigin: 'center',
    transition: isInstant
      ? 'none'
      : `transform ${durationMs}ms ${SLOW_EASE} ${lineIndex * 140}ms, opacity ${durationMs}ms ${SLOW_EASE} ${lineIndex * 140}ms`,
  });

  return { ref, isVisible, isInstant, lineStyle, ruleStyle };
}

interface CeremonialPlateProps {
  id?: string;
  folio: string;
  children: (helpers: {
    lineStyle: (lineIndex: number, durationMs?: number) => React.CSSProperties;
    ruleStyle: (lineIndex: number, durationMs?: number) => React.CSSProperties;
  }) => React.ReactNode;
}

const ThinDoubleRule: React.FC<{
  style?: React.CSSProperties;
  maxWidthClass?: string;
  inverted?: boolean;
}> = ({ style, maxWidthClass = 'max-w-xl', inverted = false }) => (
  <div
    aria-hidden="true"
    style={style}
    className={`w-full ${maxWidthClass} mx-auto space-y-[3px] will-change-[transform,opacity]`}
  >
    <div
      className={`h-px w-full ${
        inverted ? 'bg-[var(--color-highlighter)]/45' : 'bg-[var(--color-chalk)]/55'
      }`}
    />
    <div
      className={`h-px w-full ${
        inverted ? 'bg-[var(--color-chalk)]/55' : 'bg-[var(--color-highlighter)]/45'
      }`}
    />
  </div>
);

const CeremonialPlate: React.FC<CeremonialPlateProps> = ({ id, folio, children }) => {
  const { ref, isVisible, isInstant, lineStyle, ruleStyle } = usePlateReveal();

  return (
    <article
      ref={ref}
      id={id}
      className="relative overflow-hidden surface-chalkboard text-[var(--color-chalk)] max-w-4xl mx-auto p-[var(--space-24)] sm:p-[var(--space-48)] border border-[var(--color-chalk)]/35 shadow-[4px_4px_0_var(--color-ink)] scroll-mt-24"
    >
      {/* Symmetrical Outer & Inner Thin Double-Rule Frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[8px] sm:inset-[14px] border border-[var(--color-chalk)]/40 z-10"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.985)',
          transition: isInstant
            ? 'none'
            : `transform 1350ms ${SLOW_EASE}, opacity 1350ms ${SLOW_EASE}`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[12px] sm:inset-[18px] border border-[var(--color-highlighter)]/35 z-10"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.975)',
          transition: isInstant
            ? 'none'
            : `transform 1400ms ${SLOW_EASE} 90ms, opacity 1400ms ${SLOW_EASE} 90ms`,
        }}
      />

      {/* Centered, Symmetrical Plate Stage */}
      <div className="relative z-10 py-[var(--space-24)] sm:py-[var(--space-40)] px-[var(--space-16)] sm:px-[var(--space-32)] flex flex-col items-center text-center space-y-[var(--space-24)]">
        {/* Top Lowercase Roman-Numeral Folio */}
        <div
          style={lineStyle(0, 1100)}
          className="flex items-center justify-center gap-[var(--space-12)] will-change-[transform,opacity]"
        >
          <span aria-hidden="true" className="w-8 h-px bg-[var(--color-chalk)]/40" />
          <span className="font-display text-scale-14 text-[var(--color-highlighter)] tracking-[0.2em]">
            {folio}
          </span>
          <span aria-hidden="true" className="w-8 h-px bg-[var(--color-chalk)]/40" />
        </div>

        {children({ lineStyle, ruleStyle })}

        {/* Bottom Lowercase Roman-Numeral Folio */}
        <div
          aria-hidden="true"
          style={lineStyle(8, 1200)}
          className="pt-[var(--space-8)] flex items-center justify-center gap-[var(--space-12)] will-change-[transform,opacity]"
        >
          <span className="w-6 h-px bg-[var(--color-highlighter)]/35" />
          <span className="font-display text-scale-12 text-[var(--color-chalk-faint)] tracking-[0.2em]">
            {folio}
          </span>
          <span className="w-6 h-px bg-[var(--color-highlighter)]/35" />
        </div>
      </div>
    </article>
  );
};

/**
 * Plate i: Acknowledgement
 */
export const AcknowledgementPlate: React.FC<{ folio?: string }> = ({ folio = 'i' }) => {
  const ack = institutionalData.acknowledgement;
  if (!ack || !ack.paragraphs || ack.paragraphs.length === 0) return null;

  return (
    <CeremonialPlate id="acknowledgements" folio={folio}>
      {({ lineStyle, ruleStyle }) => (
        <>
          <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
            <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
              {ack.title}
            </h3>
          </div>

          <ThinDoubleRule style={ruleStyle(2, 1250)} />

          <div className="space-y-[var(--space-20)] max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk)]">
            {ack.paragraphs.map((p, idx) => (
              <p
                key={idx}
                style={lineStyle(3 + idx, 1250)}
                className="will-change-[transform,opacity] leading-relaxed"
              >
                {p}
              </p>
            ))}
          </div>

          <ThinDoubleRule
            style={ruleStyle(3 + ack.paragraphs.length, 1250)}
            maxWidthClass="max-w-md"
            inverted
          />

          <div
            style={lineStyle(4 + ack.paragraphs.length, 1250)}
            className="space-y-[var(--space-4)] will-change-[transform,opacity]"
          >
            <p className="font-display font-bold text-scale-20 text-[var(--color-chalk)]">
              {ack.signOff}
            </p>
            <p className="text-scale-14 text-[var(--color-chalk-faint)]">{ack.role}</p>
          </div>
        </>
      )}
    </CeremonialPlate>
  );
};

export interface FrontMatterPlatesProps {
  onNavigate?: (targetId: string) => void;
}

/**
 * Remaining Ceremonial Front-Matter Plates (folios ii+):
 * - Table of Contents
 * - Introduction (Field Study 1)
 * - Prayer of the Field Study Student
 * - Personal Educational Philosophy
 * - Certificate of Completion (hidden in production while unfilled)
 * - Curriculum Vitae
 * - VMGO of Bicol University
 * - Vision/Mission/Mandates/Core Values of DepEd
 */
export const FrontMatterPlates: React.FC<FrontMatterPlatesProps> = ({ onNavigate }) => {
  const hidePending = shouldHidePending();
  const visibleEpisodes = episodesData.filter((ep) => {
    const epId = getEpisodeId(ep);
    return !(hidePending && isStatusPending(getEpisodeStatus(ep), epId));
  });

  // Unfilled Certificate of Completion check: never invent text; keep hidden when unfilled
  const rawCertificate = (institutionalData as Record<string, unknown>).certificateOfCompletion as
    | { title?: string; file?: string; alt?: string; body?: string; status?: string }
    | undefined;
  const certSrc = rawCertificate?.file ? resolveAppendixPhotoSrc(rawCertificate.file) : undefined;
  const hasCertificateContent = Boolean(
    rawCertificate &&
      rawCertificate.title &&
      (certSrc || rawCertificate.body) &&
      !(hidePending && isStatusPending(rawCertificate.status, 'certificateOfCompletion'))
  );

  // Dynamic folio counter starting at 2 ('ii'), since Acknowledgement is 'i'
  let folioCounter = 2;
  const nextFolio = () => toRomanLower(folioCounter++);

  const tocFolio = nextFolio();
  const introFolio = nextFolio();
  const prayerFolio = nextFolio();
  const philosophyFolio = nextFolio();
  const certificateFolio = hasCertificateContent ? nextFolio() : '';
  const cvFolio = nextFolio();
  const buVmgoFolio = nextFolio();
  const depEdFolio = nextFolio();

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(targetId);
  };

  const tocEntries: Array<{ id: string; label: string; sub?: string }> = [
    { id: 'acknowledgements', label: institutionalData.acknowledgement.title },
    { id: 'introduction', label: institutionalData.course.code, sub: institutionalData.course.title },
    { id: 'prayer', label: institutionalData.prayer.title },
    { id: 'philosophy', label: educationalPhilosophy.title, sub: educationalPhilosophy.subtitle },
    ...(hasCertificateContent && rawCertificate?.title
      ? [{ id: 'certificate-of-completion', label: rawCertificate.title }]
      : []),
    { id: 'cv', label: institutionalData.student.name, sub: institutionalData.student.degree },
    { id: 'institutional-vmgo', label: institutionalData.institution.university, sub: institutionalData.institution.college },
    { id: 'deped-mandates', label: institutionalData.depEdVMGO.coreValues.join(' · ') },
    ...visibleEpisodes.map((ep) => ({
      id: getEpisodeId(ep),
      label: `${ep.number} · ${ep.title}`,
      sub: ep.school,
    })),
  ];

  const depEdMandates = (institutionalData.depEdVMGO as Record<string, unknown>).mandates as
    | string
    | undefined;

  return (
    <div className="space-y-[var(--space-48)]">
      {/* 1. Table of Contents Plate */}
      <CeremonialPlate id="front-matter-toc" folio={tocFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <p className="text-scale-14 text-[var(--color-chalk-faint)]">
                {institutionalData.course.code}
              </p>
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {institutionalData.student.portfolioTitle}
              </h3>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            <nav aria-label={institutionalData.student.portfolioTitle} className="w-full max-w-2xl mx-auto">
              <ol className="space-y-[var(--space-12)]">
                {tocEntries.map((entry, idx) => (
                  <li
                    key={entry.id}
                    style={lineStyle(3 + idx, 1150)}
                    className="will-change-[transform,opacity] border-b border-[var(--color-border-dark)] pb-[var(--space-8)] last:border-b-0"
                  >
                    <a
                      href={`#${entry.id}`}
                      onClick={(e) => handleTocClick(e, entry.id)}
                      className="inline-flex flex-col items-center gap-[var(--space-4)] text-[var(--color-chalk)] hover:text-[var(--color-highlighter)] transition-colors"
                    >
                      <span className="font-display font-bold text-scale-20">{entry.label}</span>
                      {entry.sub && (
                        <span className="text-scale-14 text-[var(--color-chalk-faint)]">
                          {entry.sub}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </>
        )}
      </CeremonialPlate>

      {/* 2. Introduction (Field Study 1) Plate */}
      <CeremonialPlate id="introduction" folio={introFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <p className="text-scale-14 text-[var(--color-highlighter)] font-semibold">
                {institutionalData.course.code}
              </p>
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {institutionalData.course.title}
              </h3>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            <p
              style={lineStyle(3, 1250)}
              className="max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk)] leading-relaxed will-change-[transform,opacity]"
            >
              {institutionalData.course.description}
            </p>

            <ThinDoubleRule style={ruleStyle(4, 1250)} maxWidthClass="max-w-md" inverted />

            <div className="space-y-[var(--space-20)] max-w-2xl mx-auto w-full">
              {institutionalData.course.outcomes.map((outcome, idx) => (
                <div
                  key={outcome.number}
                  style={lineStyle(5 + idx, 1200)}
                  className="space-y-[var(--space-4)] pb-[var(--space-16)] border-b border-[var(--color-border-dark)] last:border-b-0 will-change-[transform,opacity]"
                >
                  <p className="font-display font-bold text-scale-17 text-[var(--color-highlighter)] tabular-nums">
                    0{outcome.number} · {outcome.domainAlignment}
                  </p>
                  <p className="text-scale-17 text-[var(--color-chalk)]">{outcome.statement}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CeremonialPlate>

      {/* 3. Prayer of the Field Study Student Plate */}
      <CeremonialPlate id="prayer" folio={prayerFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {institutionalData.prayer.title}
              </h3>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            <div className="space-y-[var(--space-20)] max-w-2xl mx-auto text-scale-20 text-[var(--color-chalk)]">
              {institutionalData.prayer.content.map((para, idx) => (
                <p
                  key={idx}
                  style={lineStyle(3 + idx, 1250)}
                  className="leading-relaxed will-change-[transform,opacity]"
                >
                  {para}
                </p>
              ))}
            </div>
          </>
        )}
      </CeremonialPlate>

      {/* 4. Personal Educational Philosophy Plate */}
      <CeremonialPlate id="philosophy" folio={philosophyFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {educationalPhilosophy.title}
              </h3>
              <p className="text-scale-20 text-[var(--color-chalk-faint)]">
                {educationalPhilosophy.subtitle}
              </p>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            {educationalPhilosophy.epigraph && (
              <p
                style={lineStyle(3, 1250)}
                className="max-w-2xl mx-auto text-scale-17 italic text-[var(--color-chalk-faint)] will-change-[transform,opacity]"
              >
                {educationalPhilosophy.epigraph}
              </p>
            )}

            <div
              style={lineStyle(4, 1250)}
              className="max-w-2xl mx-auto space-y-[var(--space-8)] py-[var(--space-8)] will-change-[transform,opacity]"
            >
              <blockquote className="font-display font-bold text-scale-28 text-[var(--color-highlighter)]">
                “{educationalPhilosophy.credo}”
              </blockquote>
              <p className="text-scale-14 text-[var(--color-chalk-faint)]">
                {educationalPhilosophy.author} · {educationalPhilosophy.date}
              </p>
            </div>

            <ThinDoubleRule style={ruleStyle(5, 1250)} maxWidthClass="max-w-md" inverted />

            <div className="space-y-[var(--space-20)] max-w-2xl mx-auto">
              {educationalPhilosophy.statements.map((stmt, idx) => (
                <p
                  key={stmt.id}
                  style={lineStyle(6 + idx, 1200)}
                  className="text-scale-17 text-[var(--color-chalk)] leading-relaxed will-change-[transform,opacity]"
                >
                  <span>{stmt.lead}</span>
                  <strong className="text-[var(--color-highlighter)] font-semibold">
                    {stmt.emphasis}
                  </strong>
                  <span>{stmt.rest}</span>
                </p>
              ))}
            </div>

            {educationalPhilosophy.pillars && educationalPhilosophy.pillars.length > 0 && (
              <>
                <ThinDoubleRule style={ruleStyle(9, 1250)} maxWidthClass="max-w-md" />
                <div className="space-y-[var(--space-24)] max-w-2xl mx-auto w-full">
                  {educationalPhilosophy.pillars.map((pillar, idx) => (
                    <div
                      key={pillar.id}
                      style={lineStyle(10 + idx, 1200)}
                      className="space-y-[var(--space-8)] pb-[var(--space-16)] border-b border-[var(--color-border-dark)] last:border-b-0 will-change-[transform,opacity]"
                    >
                      <p className="font-display font-bold text-scale-20 text-[var(--color-chalk)]">
                        {pillar.numeral} · {pillar.title}
                      </p>
                      <p className="font-semibold text-scale-17 text-[var(--color-highlighter)]">
                        {pillar.thesis}
                      </p>
                      <p className="text-scale-17 text-[var(--color-chalk)] leading-relaxed">
                        {pillar.elaboration}
                      </p>
                      <p className="text-scale-14 text-[var(--color-chalk-faint)]">
                        {pillar.theoristAnchor}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {educationalPhilosophy.closingReflection && (
              <p
                style={lineStyle(14, 1250)}
                className="max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk-faint)] pt-[var(--space-8)] will-change-[transform,opacity]"
              >
                {educationalPhilosophy.closingReflection}
              </p>
            )}
          </>
        )}
      </CeremonialPlate>

      {/* 5. Certificate of Completion Plate (Hidden when unfilled; never invents text) */}
      {hasCertificateContent && rawCertificate && (
        <CeremonialPlate id="certificate-of-completion" folio={certificateFolio}>
          {({ lineStyle, ruleStyle }) => (
            <>
              <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
                <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                  {rawCertificate.title}
                </h3>
              </div>
              <ThinDoubleRule style={ruleStyle(2, 1250)} />
              {certSrc && (
                <div className="w-full max-w-2xl mx-auto space-y-[var(--space-12)]">
                  <div className="p-[var(--space-12)] shape-index-card-plain">
                    <a
                      href={certSrc}
                      target="_blank"
                      rel="noopener"
                      className="block"
                    >
                      <img
                        src={certSrc}
                        alt={rawCertificate.alt || rawCertificate.title}
                        loading="lazy"
                        className="w-full h-auto block"
                      />
                    </a>
                  </div>
                  <div>
                    <a
                      href={certSrc}
                      target="_blank"
                      rel="noopener"
                      className="inline-block text-scale-14 font-semibold text-[var(--color-highlighter)] underline underline-offset-4"
                    >
                      Open full size
                    </a>
                  </div>
                </div>
              )}
              {rawCertificate.body && (
                <p
                  style={lineStyle(3, 1250)}
                  className="max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk)] leading-relaxed will-change-[transform,opacity]"
                >
                  {rawCertificate.body}
                </p>
              )}
            </>
          )}
        </CeremonialPlate>
      )}

      {/* 6. Curriculum Vitae Plate */}
      <CeremonialPlate id="cv" folio={cvFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {institutionalData.student.name}
              </h3>
              <p className="text-scale-17 text-[var(--color-highlighter)] font-semibold">
                {institutionalData.student.degree} · {institutionalData.student.major}
              </p>
              <p className="text-scale-14 text-[var(--color-chalk-faint)]">
                {institutionalData.student.yearLevel} · {institutionalData.student.email}
              </p>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            {institutionalData.cv?.profileSummary && (
              <p
                style={lineStyle(3, 1250)}
                className="max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk)] leading-relaxed will-change-[transform,opacity]"
              >
                {institutionalData.cv.profileSummary}
              </p>
            )}

            {institutionalData.cv?.education && institutionalData.cv.education.length > 0 && (
              <>
                <ThinDoubleRule style={ruleStyle(4, 1250)} maxWidthClass="max-w-md" inverted />
                <div className="space-y-[var(--space-16)] max-w-2xl mx-auto w-full">
                  {institutionalData.cv.education.map((edu, idx) => (
                    <div
                      key={idx}
                      style={lineStyle(5 + idx, 1200)}
                      className="space-y-[var(--space-4)] will-change-[transform,opacity]"
                    >
                      <p className="font-display font-bold text-scale-20 text-[var(--color-chalk)]">
                        {edu.institution}
                      </p>
                      <p className="text-scale-17 text-[var(--color-highlighter)]">{edu.degree}</p>
                      <p className="text-scale-14 text-[var(--color-chalk-faint)]">
                        {edu.location} · {edu.period}
                      </p>
                      {edu.highlights.map((h, hIdx) => (
                        <p key={hIdx} className="text-scale-14 text-[var(--color-chalk)]">
                          {h}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            {institutionalData.cv?.editorialExperience &&
              institutionalData.cv.editorialExperience.length > 0 && (
                <>
                  <ThinDoubleRule style={ruleStyle(7, 1250)} maxWidthClass="max-w-md" />
                  <div className="space-y-[var(--space-16)] max-w-2xl mx-auto w-full">
                    {institutionalData.cv.editorialExperience.map((exp, idx) => (
                      <div
                        key={idx}
                        style={lineStyle(8 + idx, 1200)}
                        className="space-y-[var(--space-4)] will-change-[transform,opacity]"
                      >
                        <p className="font-display font-bold text-scale-20 text-[var(--color-chalk)]">
                          {exp.organization}
                        </p>
                        <p className="text-scale-17 text-[var(--color-highlighter)]">{exp.role}</p>
                        <p className="text-scale-14 text-[var(--color-chalk-faint)]">{exp.period}</p>
                        {exp.contributions.map((c, cIdx) => (
                          <p key={cIdx} className="text-scale-14 text-[var(--color-chalk)]">
                            {c}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}

            {institutionalData.cv?.competencies &&
              institutionalData.cv.competencies.length > 0 && (
                <>
                  <ThinDoubleRule style={ruleStyle(10, 1250)} maxWidthClass="max-w-md" inverted />
                  <div className="space-y-[var(--space-16)] max-w-2xl mx-auto w-full">
                    {institutionalData.cv.competencies.map((comp, idx) => (
                      <div
                        key={idx}
                        style={lineStyle(11 + idx, 1200)}
                        className="space-y-[var(--space-4)] will-change-[transform,opacity]"
                      >
                        <p className="font-display font-bold text-scale-17 text-[var(--color-highlighter)]">
                          {comp.category}
                        </p>
                        <p className="text-scale-14 text-[var(--color-chalk)]">
                          {comp.skills.join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </>
        )}
      </CeremonialPlate>

      {/* 7. VMGO of Bicol University Plate */}
      <CeremonialPlate id="institutional-vmgo" folio={buVmgoFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <p className="text-scale-14 text-[var(--color-highlighter)] font-semibold">
                {institutionalData.institution.republic}
              </p>
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {institutionalData.institution.university}
              </h3>
              <p className="text-scale-20 text-[var(--color-chalk-faint)]">
                {institutionalData.institution.college}
              </p>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            <div className="space-y-[var(--space-20)] max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk)]">
              <p style={lineStyle(3, 1250)} className="leading-relaxed will-change-[transform,opacity]">
                {institutionalData.buVMGO.vision}
              </p>
              <p style={lineStyle(4, 1250)} className="leading-relaxed will-change-[transform,opacity]">
                {institutionalData.buVMGO.mission}
              </p>
              {institutionalData.buVMGO.qualityPolicy && (
                <p
                  style={lineStyle(5, 1250)}
                  className="text-scale-14 text-[var(--color-chalk-faint)] leading-relaxed will-change-[transform,opacity]"
                >
                  {institutionalData.buVMGO.qualityPolicy}
                </p>
              )}
            </div>

            <ThinDoubleRule style={ruleStyle(6, 1250)} maxWidthClass="max-w-md" inverted />

            <p
              style={lineStyle(7, 1200)}
              className="font-display font-bold text-scale-20 text-[var(--color-highlighter)] will-change-[transform,opacity]"
            >
              {institutionalData.buVMGO.coreValues.join(' · ')}
            </p>

            {institutionalData.buVMGO.collegeGoals &&
              institutionalData.buVMGO.collegeGoals.length > 0 && (
                <div className="space-y-[var(--space-12)] max-w-2xl mx-auto pt-[var(--space-8)]">
                  {institutionalData.buVMGO.collegeGoals.map((goal, idx) => (
                    <p
                      key={idx}
                      style={lineStyle(8 + idx, 1200)}
                      className="text-scale-14 text-[var(--color-chalk)] leading-relaxed will-change-[transform,opacity]"
                    >
                      {goal}
                    </p>
                  ))}
                </div>
              )}
          </>
        )}
      </CeremonialPlate>

      {/* 8. Vision / Mission / Mandates / Core Values of DepEd Plate */}
      <CeremonialPlate id="deped-mandates" folio={depEdFolio}>
        {({ lineStyle, ruleStyle }) => (
          <>
            <div style={lineStyle(1, 1200)} className="space-y-[var(--space-8)] max-w-2xl mx-auto">
              <p className="text-scale-14 text-[var(--color-highlighter)] font-semibold">
                {institutionalData.institution.republic}
              </p>
              <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
                {institutionalData.depEdVMGO.coreValues.join(' · ')}
              </h3>
            </div>

            <ThinDoubleRule style={ruleStyle(2, 1250)} />

            <div className="space-y-[var(--space-20)] max-w-2xl mx-auto text-scale-17 text-[var(--color-chalk)]">
              <p style={lineStyle(3, 1250)} className="leading-relaxed will-change-[transform,opacity]">
                {institutionalData.depEdVMGO.vision}
              </p>
              <p style={lineStyle(4, 1250)} className="leading-relaxed will-change-[transform,opacity]">
                {institutionalData.depEdVMGO.mission}
              </p>
              {depEdMandates && (
                <p style={lineStyle(5, 1250)} className="leading-relaxed will-change-[transform,opacity]">
                  {depEdMandates}
                </p>
              )}
            </div>

            <ThinDoubleRule style={ruleStyle(6, 1250)} maxWidthClass="max-w-md" inverted />

            <p
              style={lineStyle(7, 1200)}
              className="font-display font-bold text-scale-20 text-[var(--color-highlighter)] will-change-[transform,opacity]"
            >
              {institutionalData.depEdVMGO.coreValues.join(' · ')}
            </p>
          </>
        )}
      </CeremonialPlate>
    </div>
  );
};
