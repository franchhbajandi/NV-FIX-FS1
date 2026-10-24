import React, { useEffect, useRef, useState } from 'react';
import { Episode, EpisodeQuestion } from '../data/types';
import {
  shouldHidePending,
  isStatusPending,
  getEpisodeId,
  getEpisodeShortId,
  getEpisodeColorToken,
  getEpisodeStatus,
  getQuestionPrompt,
  getQuestionPullquote,
  getQuestionId,
  getClassroomMatrixData,
  getSchoolFacilitiesData,
  getPsychosocialChecklistData,
  getPsychosocialItemText,
  splitParagraphs,
  isIgnoredKey,
} from '../data/contentIntake';
import { AnswerBlock, renderAsteriskEmphasis } from './AnswerBlock';
import { EmphasizedText } from './EmphasizedText';
import { MatrixTable } from './MatrixTable';
import { PullQuote } from './PullQuote';
import {
  AutoPhotoFrame,
  getPhotosForEpisode,
  getPhotoByFileMatch,
} from './AutoPhotoFrame';
import { CampusBlockMap } from './CampusBlockMap';
import {
  MethodsFlipDeck,
  SevenStepLessonArc,
  WhiteboardMaterialsChecklist,
  FiveStopLessonTimeline,
  FullBleedReflection,
} from './Episode04SetPieces';
import {
  PhoneDrawerOpener,
  RoutinesTileGrid,
  StrategiesCardDeck,
  RtInterviewQuoteSlabs,
  ClassroomBoxRoom3D,
  FullBleedReflectionQuestions,
} from './Episode05SetPieces';
import { Button } from './Button';
import { BackToContents } from './BackToContents';
import {
  OrnamentCornerBrackets,
  OrnamentDoubleRule,
  OrnamentSectionDivider,
} from './OrnamentKit';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Users,
  School,
  UserCheck,
} from 'lucide-react';

export interface EpisodeChapterProps {
  episode: Episode;
}

const EPISODE_SURFACE_CLASS: Record<string, string> = {
  '01': 'episode-surface-01',
  '02': 'episode-surface-02',
  '03': 'episode-surface-03',
  '04': 'episode-surface-04',
  '05': 'episode-surface-05',
  '06': 'episode-surface-06',
};

const EPISODE_NAV_MAP: Record<
  string,
  {
    prev?: { id: string; label: string };
    next?: { id: string; label: string };
  }
> = {
  '01': {
    prev: { id: 'act-2', label: 'Act II: Foundations' },
    next: { id: 'ep-02', label: 'Episode 02: The Learning Environment' },
  },
  '02': {
    prev: { id: 'act-2', label: 'Act II: Foundations' },
    next: { id: 'ep-03', label: 'Episode 03: Learner Behavior and Motivation' },
  },
  '03': {
    prev: { id: 'ep-02', label: 'Episode 02: The Learning Environment' },
    next: { id: 'ep-04', label: 'Episode 04: Teaching Learning Process' },
  },
  '04': {
    prev: { id: 'ep-03', label: 'Episode 03: Learner Behavior and Motivation' },
    next: { id: 'act-4', label: 'Act IV: Evidence and appendices' },
  },
  '05': {
    prev: { id: 'ep-04', label: 'Episode 04: Teaching Learning Process' },
    next: { id: 'ep-06', label: 'Episode 06: Assessment and reporting' },
  },
  '06': {
    prev: { id: 'ep-05', label: 'Episode 05: Classroom management' },
    next: { id: 'act-4', label: 'Act IV: Evidence and appendices' },
  },
};

let tintedMoodModules: Record<string, { default: string }> = {};
try {
  tintedMoodModules = import.meta.glob('../assets/photos/tinted/*.webp', {
    eager: true,
  }) as Record<string, { default: string }>;
} catch {
  tintedMoodModules = {};
}

function getTintedMoodUrl(baseSlug: string): string {
  for (const [modPath, mod] of Object.entries(tintedMoodModules)) {
    if (modPath.includes(baseSlug) && mod?.default) {
      return mod.default;
    }
  }
  const cleanSlug = baseSlug.replace(/-duotone$/i, '');
  return `/assets/photos/tinted/${cleanSlug}-duotone.webp`;
}

export const EpisodeChapter: React.FC<EpisodeChapterProps> = ({ episode }) => {
  const openerRef = useRef<HTMLElement>(null);
  const numeralRef = useRef<HTMLDivElement>(null);
  const sfHeaderRef = useRef<HTMLDivElement>(null);
  const sfBackdropRef = useRef<HTMLDivElement>(null);
  const isEp02 = episode.number === '02';

  const ep02MoodNumeralUrl = isEp02 ? getTintedMoodUrl('misc-schoolhallway-duotone') : '';
  const ep02MoodOpenerArchUrl = isEp02
    ? getTintedMoodUrl('misc-school-entrance-hallway-duotone')
    : '';
  const ep02MoodSfBackdropUrl = isEp02
    ? getTintedMoodUrl('misc-school-entrance-hallway-2-duotone')
    : '';
  const ep02MoodCmShapeUrl = isEp02 ? getTintedMoodUrl('misc-ramps-for-pwd-duotone') : '';
  const ep02MoodPsyShapeUrl = isEp02
    ? getTintedMoodUrl('misc-schoolhallway-zoomed-on-nosmokingsign-duotone')
    : '';

  const epId = getEpisodeId(episode);
  const epShort = getEpisodeShortId(episode);
  const colorToken = getEpisodeColorToken(episode);
  const epStatus = getEpisodeStatus(episode);
  const isEpisodePending = isStatusPending(epStatus, epId);
  const hidePending = shouldHidePending();

  const surfaceClass = EPISODE_SURFACE_CLASS[episode.number] || 'episode-surface-02';
  const navInfo = EPISODE_NAV_MAP[episode.number];
  const hasWorksheetPdf = Boolean(episode.worksheetPdf && episode.worksheetPdf.trim().length > 0);

  // Subtle parallax on the giant opener numeral and Episode 02 section header backdrop (disabled on touch, lite tier, and reduced-motion)
  useEffect(() => {
    if (isEpisodePending) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLite = document.documentElement.dataset.tier === 'lite';
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (isTouch || isLite || mql.matches) {
      if (numeralRef.current) numeralRef.current.style.transform = 'none';
      if (sfBackdropRef.current) sfBackdropRef.current.style.transform = 'none';
      return;
    }

    let rafId = 0;
    const updateParallax = () => {
      if (
        document.documentElement.dataset.tier === 'lite' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        if (numeralRef.current) numeralRef.current.style.transform = 'none';
        if (sfBackdropRef.current) sfBackdropRef.current.style.transform = 'none';
        return;
      }
      const vh = window.innerHeight;
      if (openerRef.current && numeralRef.current) {
        const rect = openerRef.current.getBoundingClientRect();
        if (rect.top <= vh && rect.bottom >= 0) {
          const progress = (vh - rect.top) / (vh + rect.height);
          const shiftY = (progress - 0.5) * 48;
          numeralRef.current.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0)`;
        }
      }
      if (isEp02 && sfHeaderRef.current && sfBackdropRef.current) {
        const rect = sfHeaderRef.current.getBoundingClientRect();
        if (rect.top <= vh && rect.bottom >= 0) {
          const progress = (vh - rect.top) / (vh + rect.height);
          const shiftY = (progress - 0.5) * 36;
          sfBackdropRef.current.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0)`;
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isEpisodePending, isEp02]);

  // Hide pending episodes completely in production builds and verify-content
  if (isEpisodePending && hidePending) {
    return null;
  }

  // In development, render a compact placeholder card stub for pending episodes (no data-verify-id)
  if (isEpisodePending) {
    return (
      <article
        id={epId}
        data-episode={episode.number}
        aria-hidden="true"
        className="my-[var(--space-24)] p-[var(--space-24)] surface-chalk border-2 border-dashed border-[var(--color-ink)] flex flex-wrap items-center justify-between gap-[var(--space-16)]"
      >
        <div className="flex items-center gap-[var(--space-16)]">
          <span className="font-display font-extrabold text-scale-28 text-[var(--color-chalk-muted)] tabular-nums">
            {episode.number}
          </span>
          <div>
            <p className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
              Episode {episode.number}: {episode.title}
            </p>
            <p className="text-scale-14 text-[var(--color-chalk-muted)]">
              Status: PENDING in src/content/status-registry.json — hidden in production builds and print edition.
            </p>
          </div>
        </div>
        <span className="px-[var(--space-8)] py-[2px] border border-[var(--color-ink)] font-mono text-scale-12 font-bold">
          PENDING INTAKE
        </span>
      </article>
    );
  }

  // Parse [See also: Episode 0X — Topic] and single-asterisk spans (*like this*) while preserving exact verbatim text
  const renderCrossReferences = (text: string): React.ReactNode => {
    const regex = /\[See also:\s*Episode\s*(0[1-6])(?:\s*[—,]\s*([^\]]+))?\]/gi;
    if (!regex.test(text)) return renderAsteriskEmphasis(text);

    regex.lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderAsteriskEmphasis(text.substring(lastIndex, match.index)));
      }
      const epNum = match[1];
      parts.push(
        <a
          key={match.index}
          href={`#ep-${epNum}`}
          className="btn-ghost font-semibold text-[var(--color-notebook)]"
        >
          {match[0]}
        </a>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(renderAsteriskEmphasis(text.substring(lastIndex)));
    }

    return parts;
  };

  const cmData = getClassroomMatrixData(episode);
  const sfData = getSchoolFacilitiesData(episode);
  const psyData = getPsychosocialChecklistData(episode);

  // Track which photo files are already rendered inline in Episode 02 rows/illustration
  const inlinePhotoKeys = new Set<string>();
  cmData.rows.forEach((row) => {
    (row.photos || []).forEach((p) => {
      const rec = getPhotoByFileMatch(p);
      if (rec) inlinePhotoKeys.add(rec.cleanKey);
    });
  });
  sfData.rows.forEach((row) => {
    (row.photos || []).forEach((p) => {
      const rec = getPhotoByFileMatch(p);
      if (rec) inlinePhotoKeys.add(rec.cleanKey);
    });
  });
  if (episode.personalIllustration?.image) {
    const rec = getPhotoByFileMatch(episode.personalIllustration.image);
    if (rec) inlinePhotoKeys.add(rec.cleanKey);
  }

  const allEpisodePhotos = getPhotosForEpisode(episode.number);
  const sidebarPhotos = allEpisodePhotos.filter(
    (p) => p.role !== 'mood' && !inlinePhotoKeys.has(p.cleanKey)
  );

  // Filter sections, questions, tables, quotes, and reflection strictly by status: "PENDING"
  const visibleSections = (episode.sections || []).filter((sec, sIdx) => {
    if (!hidePending) return true;
    const secPath = `${epId}.sections[${sIdx}]`;
    const legacyKey = `${epId}.${sec.id}`;
    return !isStatusPending(sec.status, secPath, legacyKey);
  });

  const filterQuestionList = (
    list: EpisodeQuestion[] | undefined,
    pathPrefix: string,
    prefix: string
  ) =>
    (list || []).filter((q, idx) => {
      if (!hidePending) return true;
      const pathKey = `${pathPrefix}[${idx}]`;
      const qId = getQuestionId(episode.number, prefix, q, idx);
      return !isStatusPending(q.status, pathKey, qId);
    });

  const visibleQuestions = filterQuestionList(episode.questions, `${epId}.questions`, 'q');
  const visibleClassroomQuestions = filterQuestionList(
    episode.classroomQuestions,
    `${epId}.classroomQuestions`,
    'cq'
  );
  const visibleReflectSchool = filterQuestionList(
    episode.reflectSchool,
    `${epId}.reflectSchool`,
    'rs'
  );
  const visiblePsychosocialReflect = filterQuestionList(
    episode.psychosocialReflect,
    `${epId}.psychosocialReflect`,
    'pr'
  );

  const visibleTables = (episode.tables || []).filter((t, tIdx) => {
    if (!hidePending) return true;
    return !t.isPending && !isStatusPending(t.status, `${epId}.tables[${tIdx}]`, t.id);
  });

  const visibleQuotes = (episode.quotes || []).filter((q, idx) => {
    if (!hidePending) return true;
    return !isStatusPending(q.status, `${epId}.quotes[${idx}]`, `${epId}-quote-${idx}`);
  });

  const showReflection =
    episode.reflection &&
    (!hidePending ||
      !isStatusPending(
        episode.reflection.status,
        `${epId}.reflection`,
        `${epId}-reflection`
      ));

  const reflectionParagraphs = episode.reflection
    ? splitParagraphs(episode.reflection.text)
    : [];

  const hasOpenerRightNote = Boolean(
    episode.keyFinding ||
      episode.themeQuote ||
      (episode.ppstDomains && episode.ppstDomains.length > 0)
  );

  const hasMainColumnContent =
    visibleSections.length > 0 || visibleClassroomQuestions.length > 0;

  return (
    <article
      id={epId}
      data-episode={episode.number}
      data-redpen-component={`EpisodeChapter (${episode.number})`}
      data-redpen-tokens={`${colorToken}, --color-chalk, --color-ink, --space-48`}
      className="my-[var(--space-48)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] overflow-hidden"
    >
      {/* ============================================================== */}
      {/* (1) EPISODE OPENER (surface-episode-02 construction green /    */}
      {/*     surface-episode-03 plum; sticky-note only when present)    */}
      {/* ============================================================== */}
      <header
        ref={openerRef}
        data-redpen-component={`EpisodeOpener (${episode.number})`}
        data-redpen-tokens={`${colorToken}, --text-160, --text-64, --text-28`}
        className={`${surfaceClass} p-[var(--space-24)] sm:p-[var(--space-48)] border-b-2 border-[var(--color-ink)] relative overflow-hidden`}
      >
        {/* Episode 02 ONLY: Decorative masked arch & diagonal stripe bleeding off opener right edge */}
        {isEp02 && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -right-12 -top-8 bottom-0 w-[340px] sm:w-[440px] z-0 hidden md:flex items-end justify-end opacity-95"
          >
            <div
              className="w-[260px] sm:w-[340px] h-[92%] rounded-t-full border-l-4 border-t-4 border-[var(--color-highlighter)] shadow-[-6px_0_0_var(--color-ink)] bg-cover bg-center"
              style={{ backgroundImage: `url("${ep02MoodOpenerArchUrl}")` }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-32)] items-end relative z-10">
          {/* Left columns (expands to 12 cols when no sticky note is present) */}
          <div
            className={`${
              hasOpenerRightNote ? 'lg:col-span-7' : 'lg:col-span-12'
            } space-y-[var(--space-16)]`}
          >
            <div ref={numeralRef} className="will-change-transform flex items-center gap-[var(--space-16)]">
              <span
                className="font-display font-extrabold text-scale-160 block select-none tabular-nums"
                style={
                  isEp02
                    ? {
                        backgroundImage: `url("${ep02MoodNumeralUrl}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextStroke: '3px var(--color-highlighter)',
                        filter: 'drop-shadow(6px 6px 0 var(--color-ink))',
                      }
                    : undefined
                }
              >
                {episode.number}
              </span>
            </div>

            {episode.titleLines && episode.titleLines.length > 0 ? (
              <h2 className="font-display font-extrabold text-scale-64 space-y-[var(--space-4)]">
                {episode.titleLines.map((line, lIdx) => (
                  <span
                    key={lIdx}
                    data-verify-id={`${epId}-titleLine-${lIdx + 1}`}
                    className="block"
                  >
                    {line}
                  </span>
                ))}
              </h2>
            ) : (
              <h2
                data-verify-id={`${epId}-title`}
                className="font-display font-extrabold text-scale-64"
              >
                {episode.title}
              </h2>
            )}

            {isEp02 && (
              <OrnamentDoubleRule
                primaryColor="var(--color-highlighter)"
                secondaryColor="var(--color-chalk)"
                accentColor="var(--color-highlighter)"
              />
            )}

            {episode.thesis && (
              <p
                data-verify-id={`${epId}-thesis`}
                className="font-display font-bold text-scale-28 reading-measure"
              >
                {episode.thesis}
              </p>
            )}

            {/* Delivered Observation Metadata Badges (only fields present in JSON) */}
            {(episode.school ||
              episode.date ||
              episode.timeObserved ||
              episode.gradeSection ||
              episode.gradeSections ||
              episode.sectionsObserved ||
              episode.resourceTeacher) && (
              <div className="pt-[var(--space-8)] flex flex-wrap items-center gap-[var(--space-12)] text-scale-14 font-semibold">
                {episode.school && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <School size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-school`}>{episode.school}</span>
                  </span>
                )}
                {episode.date && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <Calendar size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-date`}>{episode.date}</span>
                  </span>
                )}
                {episode.timeObserved && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <Clock size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-timeObserved`}>{episode.timeObserved}</span>
                  </span>
                )}
                {episode.gradeSection && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <Users size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-gradeSection`}>{episode.gradeSection}</span>
                  </span>
                )}
                {episode.gradeSections && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <Users size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-gradeSections`}>{episode.gradeSections}</span>
                  </span>
                )}
                {episode.sectionsObserved && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <Users size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-sectionsObserved`}>
                      {episode.sectionsObserved}
                    </span>
                  </span>
                )}
                {episode.resourceTeacher && (
                  <span className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-12)] py-[var(--space-6)] bg-[var(--color-ink)] text-[var(--color-chalk)] border border-[var(--color-chalk)]">
                    <UserCheck size={15} aria-hidden="true" />
                    <span data-verify-id={`${epId}-resourceTeacher`}>
                      {episode.resourceTeacher}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right 5 columns: Sticky-Note Thesis (rendered ONLY when themeQuote / keyFinding is present) */}
          {hasOpenerRightNote && (
            <div className="lg:col-span-5">
              <div
                data-redpen-component="StickyNoteThesis"
                data-redpen-tokens="--color-highlighter, --color-ink, --shadow-hard"
                className={`relative p-[var(--space-24)] ${
                  episode.number === '05' ? 'shape-index-card' : 'shape-sticky-note'
                } space-y-[var(--space-12)]`}
              >
                {isEp02 && (
                  <OrnamentCornerBrackets
                    primaryColor="var(--color-construction)"
                    accentColor="var(--color-chalk)"
                    size={18}
                  />
                )}
                {episode.keyFinding && (
                  <>
                    <p className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                      Key observation finding
                    </p>
                    <p
                      data-verify-id={`${epId}-keyFinding`}
                      className="text-scale-17 text-[var(--color-ink)]"
                    >
                      {episode.keyFinding}
                    </p>
                  </>
                )}

                {episode.themeQuote && (
                  <>
                    <p
                      aria-hidden="true"
                      className="font-mono text-scale-12 font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-ink)]/30 pb-[var(--space-4)]"
                    >
                      Episode {episode.number} thesis · {episode.title}
                    </p>
                    <blockquote
                      data-verify-id={`${epId}-themeQuote`}
                      className="font-display font-bold text-scale-20 text-[var(--color-ink)] leading-snug"
                    >
                      {episode.themeQuote}
                    </blockquote>
                  </>
                )}

                {episode.ppstDomains && episode.ppstDomains.length > 0 && (
                  <div className="pt-[var(--space-8)] border-t border-[var(--color-border-light)] space-y-[var(--space-4)]">
                    {episode.ppstDomains.map((domain, idx) => (
                      <p
                        key={idx}
                        className="text-scale-12 font-semibold text-[var(--color-chalk-muted)]"
                      >
                        {domain}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3.3 READING SECTION (Chalk background #F2F5F0)                 */}
      {/* ============================================================== */}
      <div className="surface-chalk p-[var(--space-24)] sm:p-[var(--space-48)] space-y-[var(--space-48)] relative">
        {isEp02 && <OrnamentCornerBrackets size={24} />}
        {/* ============================================================== */}
        {/* (2) CAMPUS BLOCK MAP & SCHOOL FACILITIES CHECKLIST             */}
        {/* ============================================================== */}
        {sfData.rows.length > 0 && (
          <section className="space-y-[var(--space-24)] relative">
            <div
              ref={sfHeaderRef}
              className={`relative overflow-hidden border-b-2 border-[var(--color-ink)] ${
                isEp02
                  ? 'p-[var(--space-16)] sm:p-[var(--space-24)] border-2 shadow-[4px_4px_0_var(--color-ink)] bg-[var(--color-construction)]'
                  : 'pb-[var(--space-8)]'
              } flex flex-wrap items-center justify-between gap-[var(--space-12)]`}
            >
              {/* Episode 02 ONLY: Parallax duotone backdrop layer behind section header */}
              {isEp02 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
                >
                  <div
                    ref={sfBackdropRef}
                    className="will-change-transform absolute -inset-y-10 inset-x-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${ep02MoodSfBackdropUrl}")`,
                      clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 16% 100%)',
                    }}
                  />
                </div>
              )}

              <h3
                data-verify-id={sfData.title ? `${epId}-schoolFacilities-title` : undefined}
                className={`font-display font-bold text-scale-28 text-[var(--color-ink)] relative z-10 ${
                  isEp02
                    ? 'bg-[var(--color-chalk)] px-[var(--space-16)] py-[var(--space-8)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)]'
                    : ''
                }`}
              >
                {sfData.title || 'School Facilities Checklist'}
              </h3>
            </div>

            {isEp02 && <OrnamentDoubleRule />}

            {/* Interactive Isometric Campus Ghost-Block Map */}
            <CampusBlockMap facilities={sfData.rows} title={sfData.title} />

            {/* Full School Facilities Seating-Chart Audit Table (Zero Stamps per Revision 4) */}
            <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] overflow-x-auto">
              <table className="w-full border-collapse text-left text-scale-14">
                <thead>
                  <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)]">
                    <th
                      scope="col"
                      className="p-[var(--space-12)] font-display font-bold border-r-2 border-[var(--color-ink)] w-[28%]"
                    >
                      Facility
                    </th>
                    <th
                      scope="col"
                      className="p-[var(--space-12)] font-display font-bold border-r border-[var(--color-border-light)] text-center w-[16%]"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="p-[var(--space-12)] font-display font-bold"
                    >
                      Description &amp; photographic documentation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sfData.rows.map((fac, fIdx) => {
                    const facId = `${epId}-fac-${fIdx + 1}`;
                    const isNA = fac.status === 'NA';
                    const statusVisibleLabel = isNA
                      ? 'Not available'
                      : fac.status === 'A'
                      ? 'Available'
                      : fac.status;
                    const rowPhotos = (fac.photos || [])
                      .map((p) => getPhotoByFileMatch(p))
                      .filter(Boolean);

                    return (
                      <tr
                        key={facId}
                        id={`facility-row-${facId}`}
                        className="border-b border-[var(--color-border-light)] last:border-b-0 hover:bg-[var(--color-chalk)]"
                      >
                        <th
                          scope="row"
                          className="p-[var(--space-12)] font-semibold text-[var(--color-ink)] border-r-2 border-[var(--color-ink)] align-top bg-[var(--color-chalk-surface)]"
                        >
                          <span data-verify-id={`${facId}-facility`}>{fac.facility}</span>
                        </th>
                        <td className="p-[var(--space-12)] align-top text-center border-r border-[var(--color-border-light)]">
                          <span
                            data-verify-id={`${facId}-status`}
                            data-verify-status={fac.status}
                            className={`inline-block px-[var(--space-8)] py-[2px] font-mono text-scale-12 font-bold border ${
                              isNA
                                ? 'border-dashed border-[var(--color-red-pen)] text-[var(--color-red-pen)] bg-[var(--color-chalk)]'
                                : 'border-[var(--color-ink)] text-[var(--color-chalk)] bg-[var(--color-construction)]'
                            }`}
                          >
                            {statusVisibleLabel}
                          </span>
                        </td>
                        <td className="p-[var(--space-12)] align-top space-y-[var(--space-12)]">
                          <p
                            data-verify-id={`${facId}-description`}
                            className="text-[var(--color-ink)] reading-measure"
                          >
                            {fac.description}
                          </p>

                          {rowPhotos.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-16)] pt-[var(--space-8)]">
                              {rowPhotos.map((photoRec) => (
                                <AutoPhotoFrame
                                  key={photoRec!.cleanKey}
                                  photo={photoRec!}
                                  shape="plain"
                                  treatment="halftone"
                                />
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isEp02 && sfData.rows.length > 0 && (hasMainColumnContent || sidebarPhotos.length > 0) && (
          <OrnamentSectionDivider />
        )}

        {/* ============================================================== */}
        {/* (4a) CLASSROOM GUIDE QUESTIONS & WORKSHEET SIDEBAR             */}
        {/* ============================================================== */}
        {(hasMainColumnContent || sidebarPhotos.length > 0) && (
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-32)] items-start ${
              isEp02 ? 'pt-[var(--space-16)]' : 'border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]'
            }`}
          >
            {/* Main Column (8 cols) */}
            <div className="lg:col-span-8 space-y-[var(--space-32)]">
              {visibleSections.map((section) => {
                const paras = section.paragraphs || section.content || [];
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="space-y-[var(--space-16)] reading-measure"
                  >
                    <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
                      {section.title}
                    </h3>

                    <div className="space-y-[var(--space-16)] text-scale-17 text-[var(--color-ink)]">
                      {paras.map((paragraph, pIdx) => (
                        <p key={pIdx}>{renderCrossReferences(paragraph)}</p>
                      ))}
                    </div>
                  </section>
                );
              })}

              {visibleClassroomQuestions.length > 0 && (
                <section className="space-y-[var(--space-16)]">
                  <div
                    className={`flex flex-wrap items-center justify-between gap-[var(--space-12)] ${
                      isEp02 ? 'pb-[var(--space-4)]' : 'border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]'
                    }`}
                  >
                    <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
                      Classroom environment observation guide questions
                    </h3>
                  </div>
                  {isEp02 && <OrnamentDoubleRule />}
                  <div>
                    {visibleClassroomQuestions.map((q, qIdx) => {
                      const qId = getQuestionId(episode.number, 'cq', q, qIdx);
                      return (
                        <AnswerBlock
                          key={qId}
                          id={qId}
                          questionNumber={q.n}
                          prompt={getQuestionPrompt(q)}
                          answer={q.answer}
                          pullQuoteExcerpt={getQuestionPullquote(q)}
                          forceExpanded={q.display === 'prose'}
                          renderText={renderCrossReferences}
                        />
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column (4 cols): Sidebar Photos & Worksheet Ticket Stub */}
            <aside className="lg:col-span-4 space-y-[var(--space-24)]">
              {sidebarPhotos.map((photo) => (
                <AutoPhotoFrame
                  key={photo.cleanKey}
                  photo={photo}
                  shape="index-card"
                  treatment="halftone"
                  tilt
                />
              ))}

              {/* Ticket / Stub for Original Worksheet PDF */}
              <div
                data-redpen-component="WorksheetTicketStub"
                data-redpen-tokens="--color-chalk-surface, --color-ink, --shadow-hard"
                className="relative p-[var(--space-24)] shape-ticket-stub space-y-[var(--space-12)]"
              >
                {isEp02 && <OrnamentCornerBrackets size={18} />}
                <h4 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                  Episode {episode.number} worksheet artifact
                </h4>
                <p className="text-scale-17 text-[var(--color-chalk-muted)]">
                  Primary course worksheet filed for Field Study 1 Episode {episode.number}.
                </p>
                {hasWorksheetPdf ? (
                  <Button
                    variant="primary"
                    href={episode.worksheetPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    redpenName="Button (View original worksheet)"
                  >
                    <FileText size={16} aria-hidden="true" />
                    <span>View original worksheet</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    aria-disabled="true"
                    redpenName="Button (Worksheet PDF coming soon)"
                  >
                    <FileText size={16} aria-hidden="true" />
                    <span>Worksheet PDF coming soon</span>
                  </Button>
                )}
              </div>
            </aside>
          </div>
        )}

        {isEp02 && cmData.rows.length > 0 && <OrnamentSectionDivider />}

        {/* ============================================================== */}
        {/* (3) CLASSROOM: classroomMatrix AS A SEATING-CHART GRID         */}
        {/*     WITH EACH ROW'S PHOTOS ALONGSIDE; NO-PHOTO ROWS SHOW NONE  */}
        {/* ============================================================== */}
        {cmData.rows.length > 0 && (
          <section
            className={`space-y-[var(--space-24)] relative overflow-hidden ${
              isEp02 ? 'pt-[var(--space-16)]' : 'border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]'
            }`}
          >
            {/* Episode 02 ONLY: Masked circle & diagonal stripe bleeding off right section edge */}
            {isEp02 && (
              <div
                aria-hidden="true"
                className="pointer-events-none select-none absolute -right-8 top-3 z-0 hidden sm:flex items-center gap-[var(--space-8)]"
              >
                <div
                  className="w-16 h-16 rounded-full border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] bg-cover bg-center"
                  style={{ backgroundImage: `url("${ep02MoodCmShapeUrl}")` }}
                />
                <div
                  className="w-44 h-16 -skew-x-12 border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] bg-cover bg-center"
                  style={{ backgroundImage: `url("${ep02MoodCmShapeUrl}")` }}
                />
              </div>
            )}

            <div
              className={`flex flex-wrap items-center justify-between gap-[var(--space-12)] relative z-10 ${
                isEp02 ? 'pb-[var(--space-4)]' : 'border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]'
              }`}
            >
              <h3
                data-verify-id={cmData.title ? `${epId}-classroomMatrix-title` : undefined}
                className={`font-display font-bold text-scale-28 text-[var(--color-ink)] ${
                  isEp02 ? 'bg-[var(--color-chalk)] pr-[var(--space-16)]' : ''
                }`}
              >
                {cmData.title || 'Classroom Facilities Matrix'}
              </h3>
            </div>

            {isEp02 && <OrnamentDoubleRule />}

            {/* Seating-Chart Grid Container */}
            <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] bg-[var(--color-chalk-surface)]">
              {/* Architectural 2x5 | 3x5 | 2x5 Seating-Plan Header Strip (decorative) */}
              <div
                aria-hidden="true"
                className="p-[var(--space-16)] bg-[var(--color-chalk)] border-b-2 border-[var(--color-ink)] flex flex-wrap items-center justify-between gap-[var(--space-12)] font-mono text-scale-12 text-[var(--color-ink)]"
              >
                <span>FRONT: WHITEBOARD &amp; TV · CENTER TEACHER’S TABLE (WITH DEVICE CONTAINER)</span>
                <span className="px-[var(--space-8)] py-[2px] bg-[var(--color-highlighter)] font-bold border border-[var(--color-ink)]">
                  SEATING LAYOUT: 2×5 | 3×5 | 2×5 VERTICAL ROWS (30–35 LEARNERS)
                </span>
                <span>BACK: BULLETIN BOARD &amp; WATER DISPENSER</span>
              </div>

              {/* Seating-Chart Grid Rows */}
              <div className="divide-y-2 divide-[var(--color-ink)]">
                {cmData.rows.map((row, rIdx) => {
                  const rowId = `${epId}-cm-r${rIdx + 1}`;
                  const textKeys = Object.keys(row).filter(
                    (k) =>
                      k !== 'id' &&
                      k !== 'photos' &&
                      k !== 'status' &&
                      !isIgnoredKey(k) &&
                      typeof row[k] === 'string'
                  );
                  const rowPhotos = (row.photos || [])
                    .map((p) => getPhotoByFileMatch(p))
                    .filter(Boolean);

                  return (
                    <div
                      key={rowId}
                      id={`classroom-matrix-${rowId}`}
                      className="grid grid-cols-1 lg:grid-cols-12 items-stretch break-inside-avoid"
                    >
                      {/* Column 1: Item / Station Cell */}
                      <div className="lg:col-span-3 p-[var(--space-20)] bg-[var(--color-chalk)] border-b lg:border-b-0 lg:border-r-2 border-[var(--color-ink)] flex flex-col justify-between gap-[var(--space-8)]">
                        <div>
                          {textKeys[0] && (
                            <h4
                              data-verify-id={`${rowId}-${textKeys[0]}`}
                              className="font-display font-bold text-scale-20 text-[var(--color-ink)]"
                            >
                              {String(row[textKeys[0]] ?? '')}
                            </h4>
                          )}
                        </div>
                        {rowPhotos.length > 0 && (
                          <span
                            aria-hidden="true"
                            className="inline-block self-start px-[var(--space-8)] py-[2px] bg-[var(--color-construction)] text-[var(--color-chalk)] font-mono text-scale-12 font-bold"
                          >
                            {rowPhotos.length} photo{rowPhotos.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Column 2: Description Cell (expands to 9 cols when row has no photos) */}
                      <div
                        className={`${
                          rowPhotos.length > 0
                            ? 'lg:col-span-5 lg:border-r-2 border-[var(--color-ink)]'
                            : 'lg:col-span-9'
                        } p-[var(--space-20)] flex items-center`}
                      >
                        <div className="space-y-[var(--space-8)] reading-measure">
                          {textKeys.slice(1).map((k) => (
                            <p
                              key={k}
                              data-verify-id={`${rowId}-${k}`}
                              className="text-scale-17 text-[var(--color-ink)]"
                            >
                              {String(row[k] ?? '')}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Column 3: Photos alongside (rows with no photos show none) */}
                      {rowPhotos.length > 0 && (
                        <div className="lg:col-span-4 p-[var(--space-20)] bg-[var(--color-chalk)]/50 grid grid-cols-1 gap-[var(--space-16)]">
                          {rowPhotos.map((photoRec) => (
                            <AutoPhotoFrame
                              key={photoRec!.cleanKey}
                              photo={photoRec!}
                              shape="plain"
                              treatment="halftone"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {isEp02 && visibleReflectSchool.length > 0 && <OrnamentSectionDivider />}

        {/* ============================================================== */}
        {/* (4b) SCHOOL & CLASSROOM REFLECTIONS (reflectSchool)            */}
        {/* ============================================================== */}
        {visibleReflectSchool.length > 0 && (
          <section
            className={`space-y-[var(--space-16)] ${
              isEp02 ? 'pt-[var(--space-16)]' : 'border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]'
            }`}
          >
            <h3
              className={`font-display font-bold text-scale-28 text-[var(--color-ink)] ${
                isEp02 ? 'pb-[var(--space-4)]' : 'border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]'
              }`}
            >
              School campus and classroom environment reflections
            </h3>
            {isEp02 && <OrnamentDoubleRule />}
            {visibleReflectSchool.map((q, qIdx) => {
              const qId = getQuestionId(episode.number, 'rs', q, qIdx);
              return (
                <AnswerBlock
                  key={qId}
                  id={qId}
                  questionNumber={q.n}
                  prompt={getQuestionPrompt(q)}
                  answer={q.answer}
                  pullQuoteExcerpt={getQuestionPullquote(q)}
                  forceExpanded={q.display === 'prose'}
                  renderText={renderCrossReferences}
                />
              );
            })}
          </section>
        )}

        {isEp02 && episode.personalIllustration && <OrnamentSectionDivider />}

        {/* ============================================================== */}
        {/* (6) PERSONAL ILLUSTRATION: FRAMED IMAGE WITH CAPTION, NO SLIDER*/}
        {/* ============================================================== */}
        {episode.personalIllustration && (
          <section
            className={`space-y-[var(--space-16)] break-inside-avoid ${
              isEp02 ? 'pt-[var(--space-16)]' : 'border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]'
            }`}
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-[var(--space-12)] ${
                isEp02 ? 'pb-[var(--space-4)]' : 'border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]'
              }`}
            >
              <div className="space-y-[var(--space-4)]">
                <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
                  Personal illustration of an ideal classroom environment
                </h3>
                {episode.personalIllustration.format && (
                  <p
                    data-verify-id={`${epId}-illustration-format`}
                    className="font-mono text-scale-12 font-semibold text-[var(--color-chalk-muted)]"
                  >
                    {episode.personalIllustration.format}
                  </p>
                )}
              </div>
            </div>

            {isEp02 && <OrnamentDoubleRule />}

            <div className={isEp02 ? 'relative p-[var(--space-16)] sm:p-[var(--space-24)]' : ''}>
              {isEp02 && <OrnamentCornerBrackets size={22} />}
              <AutoPhotoFrame
                assetKey={episode.personalIllustration.image}
                captionOverride={episode.personalIllustration.caption}
                verifyIdOverride={`${epId}-illustration-caption`}
                shape="index-card"
                treatment="none"
              />
            </div>
          </section>
        )}

        {isEp02 && psyData.items.length > 0 && <OrnamentSectionDivider />}

        {/* ============================================================== */}
        {/* (5) PSYCHOSOCIAL CHECKLIST AS RED-PEN STAMPS (EXCLUSIVE USAGE):*/}
        {/*     CHECK (✓) / OBSERVED FOR TRUE, X (✕) / Not observed FALSE  */}
        {/* ============================================================== */}
        {psyData.items.length > 0 && (
          <section
            className={`space-y-[var(--space-24)] relative overflow-hidden ${
              isEp02 ? 'pt-[var(--space-16)]' : 'border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]'
            }`}
          >
            {/* Episode 02 ONLY: Masked arch shape bleeding off right section edge */}
            {isEp02 && (
              <div
                aria-hidden="true"
                className="pointer-events-none select-none absolute -right-6 top-2 z-0 hidden sm:block"
              >
                <div
                  className="w-52 h-20 rounded-l-full border-2 border-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] bg-cover bg-center"
                  style={{ backgroundImage: `url("${ep02MoodPsyShapeUrl}")` }}
                />
              </div>
            )}

            <div
              className={`flex flex-wrap items-center justify-between gap-[var(--space-12)] relative z-10 ${
                isEp02 ? 'pb-[var(--space-4)]' : 'border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]'
              }`}
            >
              <h3
                data-verify-id={psyData.title ? `${epId}-psychosocialChecklist-title` : undefined}
                className={`font-display font-bold text-scale-28 text-[var(--color-ink)] ${
                  isEp02 ? 'bg-[var(--color-chalk)] pr-[var(--space-16)]' : ''
                }`}
              >
                {psyData.title || 'Psychosocial Environment Checklist'}
              </h3>
            </div>

            {isEp02 && <OrnamentDoubleRule />}

            <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] overflow-x-auto">
              <table className="w-full border-collapse text-left text-scale-14">
                <thead>
                  <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)]">
                    <th
                      scope="col"
                      className="p-[var(--space-12)] font-display font-bold border-r-2 border-[var(--color-ink)] w-[72%]"
                    >
                      Psychosocial environment indicator
                    </th>
                    <th
                      scope="col"
                      className="p-[var(--space-12)] font-display font-bold text-center w-[28%]"
                    >
                      Red-pen observation stamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {psyData.items.map((item, iIdx) => {
                    const itemId = `${epId}-psy-${iIdx + 1}`;
                    const itemText = getPsychosocialItemText(item);
                    const isObs = Boolean(item.observed);

                    return (
                      <tr
                        key={itemId}
                        className="border-b border-[var(--color-border-light)] last:border-b-0 hover:bg-[var(--color-chalk)]"
                      >
                        <th
                          scope="row"
                          className="p-[var(--space-16)] font-medium text-scale-17 text-[var(--color-ink)] border-r-2 border-[var(--color-ink)] bg-[var(--color-chalk-surface)] align-middle"
                        >
                          <span data-verify-id={`${itemId}-text`}>{itemText}</span>
                        </th>
                        <td className="p-[var(--space-16)] align-middle text-center">
                          {/* Verified boolean flag in visually hidden node */}
                          <span
                            data-verify-id={`${itemId}-observed`}
                            data-verify-observed={String(isObs)}
                            className="sr-only"
                          >
                            {String(isObs)}
                          </span>

                          {/* Red-pen stamp: check/OBSERVED for true, red X/"Not observed" for false */}
                          <span
                            aria-hidden="true"
                            data-verify-source={String(isObs)}
                            className={`inline-flex items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-6)] border-2 border-[var(--color-red-pen)] text-[var(--color-red-pen)] font-mono font-bold text-scale-14 tracking-wider select-none ${
                              isObs
                                ? 'bg-[#E5301F]/10 -rotate-2'
                                : 'bg-[#E5301F]/15 rotate-2'
                            }`}
                          >
                            {isObs ? (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 9.5L7 13.5L15 4.5" />
                              </svg>
                            ) : (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 4L14 14M14 4L4 14" />
                              </svg>
                            )}
                            <span>{isObs ? 'OBSERVED' : 'Not observed'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isEp02 && visiblePsychosocialReflect.length > 0 && <OrnamentSectionDivider />}

        {/* ============================================================== */}
        {/* (4c) PSYCHOSOCIAL REFLECTIONS (psychosocialReflect)            */}
        {/* ============================================================== */}
        {visiblePsychosocialReflect.length > 0 && (
          <section
            className={`space-y-[var(--space-16)] ${
              isEp02 ? 'pt-[var(--space-16)]' : 'border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]'
            }`}
          >
            <h3
              className={`font-display font-bold text-scale-28 text-[var(--color-ink)] ${
                isEp02 ? 'pb-[var(--space-4)]' : 'border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]'
              }`}
            >
              Psychosocial environment reflections
            </h3>
            {isEp02 && <OrnamentDoubleRule />}
            {visiblePsychosocialReflect.map((q, qIdx) => {
              const qId = getQuestionId(episode.number, 'pr', q, qIdx);
              return (
                <AnswerBlock
                  key={qId}
                  id={qId}
                  questionNumber={q.n}
                  prompt={getQuestionPrompt(q)}
                  answer={q.answer}
                  pullQuoteExcerpt={getQuestionPullquote(q)}
                  forceExpanded={q.display === 'prose'}
                  renderText={renderCrossReferences}
                />
              );
            })}
          </section>
        )}

        {/* ============================================================== */}
        {/* EPISODE 03 & 04: ACTIVITY 1                                     */}
        {/* ============================================================== */}
        {/* EPISODE 05: THE PHONE DRAWER OPENER (21 PHONES FROM TEXT)      */}
        {/* ============================================================== */}
        {episode.number === '05' && <PhoneDrawerOpener />}

        {/* ============================================================== */}
        {/* EPISODE 03, 04, & 05: ACTIVITY 1                               */}
        {/* ============================================================== */}
        {episode.activity1 && (
          <section
            id={`${epShort}-act${episode.activity1.number}`}
            className="space-y-[var(--space-32)]"
          >
            {/* Verbatim Module Heading: Activity 1 */}
            <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
              {episode.activity1.title ? (
                <>
                  <span
                    className={`inline-block px-[var(--space-10)] py-[2px] ${
                      episode.number === '05'
                        ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)]'
                        : episode.number === '04'
                        ? 'bg-[var(--color-red-pen)] text-[var(--color-chalk)] text-scale-24'
                        : 'bg-[var(--color-plum)] text-[var(--color-chalk)]'
                    } font-mono text-scale-12 font-bold border border-[var(--color-ink)]`}
                  >
                    Activity {episode.activity1.number}
                  </span>
                  <h3
                    data-verify-id={`${epId}-act1-title`}
                    className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]"
                  >
                    {episode.activity1.title}
                  </h3>
                </>
              ) : (
                <h3 className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]">
                  Activity {episode.activity1.number}
                </h3>
              )}
            </div>

            {/* Episode 05 Activity 1: Tile-Grid Routine Board (21 Classroom Routines) */}
            {episode.activity1.routinesTable && (
              <RoutinesTileGrid
                epId={epId}
                activity={episode.activity1}
                hidePending={hidePending}
              />
            )}

            {/* Episode 04 & 05 Activity 1 direct questions list */}
            {episode.activity1.questions && episode.activity1.questions.length > 0 && (
              <div className="space-y-[var(--space-20)]">
                {episode.activity1.questions.map((q, qIdx) => {
                  const pathKey = `${epId}.activity1.questions[${qIdx}]`;
                  if (hidePending && isStatusPending(q.status, pathKey)) return null;
                  const verifyId = `${epId}-act1-q${q.n ?? qIdx + 1}`;
                  const domId = `${epShort}-act${episode.activity1!.number}-q${q.n ?? qIdx + 1}`;
                  if (episode.number === '04') {
                    return (
                      <div
                        key={verifyId}
                        className="p-[var(--space-20)] sm:p-[var(--space-24)] shape-index-card space-y-[var(--space-12)] break-inside-avoid border-2 border-[var(--color-ink)]"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--color-rule-red)] pb-[var(--space-8)]">
                          <span className="font-mono text-scale-12 font-bold tracking-wider text-[var(--color-chalk-muted)] uppercase">
                            Activity {episode.activity1!.number} · Coursework Foundations
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-red-pen)]" aria-hidden="true" />
                        </div>
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
                  }
                  return (
                    <AnswerBlock
                      key={verifyId}
                      id={domId}
                      verifyId={verifyId}
                      questionNumber={q.n}
                      prompt={getQuestionPrompt(q)}
                      answer={q.answer}
                      pullQuoteExcerpt={getQuestionPullquote(q)}
                      forceExpanded={q.display === 'prose'}
                      renderText={renderCrossReferences}
                    />
                  );
                })}
              </div>
            )}

            {/* Learners Observed: 2x2 Index-Card Grid by Learner Code (A1, A2, H1, H2) */}
            {episode.activity1.learnersObserved && (
              <div className="space-y-[var(--space-20)]">
                <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)] border-b border-[var(--color-border-light)] pb-[var(--space-8)]">
                  <h4
                    data-verify-id={`${epId}-learnersObserved-title`}
                    className="font-display font-bold text-scale-24 text-[var(--color-ink)]"
                  >
                    {episode.activity1.learnersObserved.title}
                  </h4>
                  {episode.activity1.learnersObserved.gradeSection && (
                    <span
                      data-verify-id={`${epId}-learnersObserved-gradeSection`}
                      className="px-[var(--space-12)] py-[var(--space-4)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] font-mono text-scale-12 font-bold text-[var(--color-ink)]"
                    >
                      {episode.activity1.learnersObserved.gradeSection}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-20)]">
                  {episode.activity1.learnersObserved.rows.map((learner, lIdx) => {
                    const rowPathKey = `${epId}.activity1.learnersObserved.rows[${lIdx}]`;
                    if (hidePending && isStatusPending(learner.status, rowPathKey)) {
                      return null;
                    }
                    const lId = `${epId}-learner-${lIdx}`;
                    const isActiveGroup = learner.code.startsWith('A');

                    return (
                      <div
                        key={learner.code}
                        className="p-[var(--space-24)] shape-index-card space-y-[var(--space-12)] break-inside-avoid"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-[var(--space-8)] border-b border-[var(--color-border-light)] pb-[var(--space-10)]">
                          <div className="flex items-center gap-[var(--space-10)]">
                            <span
                              data-verify-id={`${lId}-code`}
                              className={`px-[var(--space-10)] py-[var(--space-4)] font-mono text-scale-17 font-bold border-2 border-[var(--color-ink)] ${
                                isActiveGroup
                                  ? 'bg-[var(--color-plum)] text-[var(--color-chalk)]'
                                  : 'bg-[var(--color-chalk)] text-[var(--color-ink)]'
                              }`}
                            >
                              {learner.code}
                            </span>
                            <span
                              data-verify-id={`${lId}-group`}
                              className="font-display font-bold text-scale-17 text-[var(--color-ink)]"
                            >
                              {learner.group}
                            </span>
                          </div>

                          {/* Render age and gender ONLY when present in source JSON */}
                          {(learner.age !== undefined || learner.gender !== undefined) && (
                            <div className="flex flex-wrap items-center gap-[var(--space-8)] font-mono text-scale-12 text-[var(--color-chalk-muted)]">
                              {learner.age !== undefined && (
                                <span className="px-[var(--space-8)] py-[2px] bg-[var(--color-chalk)] border border-[var(--color-ink)] text-[var(--color-ink)]">
                                  Age: <strong data-verify-id={`${lId}-age`}>{learner.age}</strong>
                                </span>
                              )}
                              {learner.gender !== undefined && (
                                <span className="px-[var(--space-8)] py-[2px] bg-[var(--color-chalk)] border border-[var(--color-ink)] text-[var(--color-ink)]">
                                  Gender:{' '}
                                  <strong data-verify-id={`${lId}-gender`}>{learner.gender}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <p
                          data-verify-id={`${lId}-description`}
                          className="text-scale-17 text-[var(--color-ink)]"
                        >
                          {learner.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interview Guide to the Learners (8 questions) */}
            {episode.activity1.interviewGuide && (
              <div className="space-y-[var(--space-16)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]">
                <h4
                  data-verify-id={`${epId}-interviewGuide-title`}
                  className="font-display font-bold text-scale-24 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                >
                  {episode.activity1.interviewGuide.title}
                </h4>
                <div>
                  {episode.activity1.interviewGuide.questions.map((q, qIdx) => {
                    const pathKey = `${epId}.activity1.interviewGuide.questions[${qIdx}]`;
                    if (hidePending && isStatusPending(q.status, pathKey)) return null;
                    const verifyId = `${epId}-act1-ig-q${q.n ?? qIdx + 1}`;
                    const domId = `${epShort}-act${episode.activity1!.number}-ig-q${q.n ?? qIdx + 1}`;
                    return (
                      <AnswerBlock
                        key={verifyId}
                        id={domId}
                        verifyId={verifyId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={q.display === 'prose'}
                        renderText={renderCrossReferences}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity 1 — Answer the following question: */}
            {episode.activity1.answer && (
              <div className="space-y-[var(--space-16)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]">
                <h4
                  data-verify-id={`${epId}-act1-answer-title`}
                  className="font-display font-bold text-scale-24 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                >
                  {episode.activity1.answer.title}
                </h4>
                <div>
                  {episode.activity1.answer.questions.map((q, qIdx) => {
                    const pathKey = `${epId}.activity1.answer.questions[${qIdx}]`;
                    if (hidePending && isStatusPending(q.status, pathKey)) return null;
                    const verifyId = `${epId}-act1-ans-q${q.n ?? qIdx + 1}`;
                    const domId = `${epShort}-act${episode.activity1!.number}-q${q.n ?? qIdx + 1}`;
                    return (
                      <AnswerBlock
                        key={verifyId}
                        id={domId}
                        verifyId={verifyId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={q.display === 'prose'}
                        renderText={renderCrossReferences}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* EPISODE 03 & 04: ACTIVITY 2                                     */}
        {/* ============================================================== */}
        {episode.activity2 && (
          <section
            id={`${epShort}-act${episode.activity2.number}`}
            className="space-y-[var(--space-32)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]"
          >
            {/* Verbatim Module Heading: Activity 2 */}
            {episode.number === '04' ? (
              <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
                <h3 className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]">
                  Activity {episode.activity2.number}:{' '}
                  <span data-verify-id={`${epId}-act2-title`}>{episode.activity2.title}</span>
                </h3>
              </div>
            ) : (
              <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
                <div className="flex flex-wrap items-center gap-[var(--space-8)]">
                  <span
                    className={`inline-block px-[var(--space-10)] py-[2px] ${
                      episode.number === '05'
                        ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)]'
                        : 'bg-[var(--color-plum)] text-[var(--color-chalk)]'
                    } font-mono text-scale-12 font-bold border border-[var(--color-ink)]`}
                  >
                    Activity {episode.activity2.number}
                  </span>
                  {episode.activity2.note && (
                    <span
                      data-verify-id={`${epId}-act2-note`}
                      className="font-mono text-scale-12 font-semibold text-[var(--color-chalk-muted)]"
                    >
                      {episode.activity2.note}
                    </span>
                  )}
                </div>
                <h3
                  data-verify-id={`${epId}-act2-title`}
                  className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]"
                >
                  {episode.activity2.title}
                </h3>
              </div>
            )}

            {/* Episode 05 Activity 2: 15 Strategy Cards (Ghosts for "No opportunity to observe") */}
            {episode.activity2.strategiesTable && (
              <StrategiesCardDeck
                epId={epId}
                activity={episode.activity2}
                hidePending={hidePending}
                renderCrossReferences={renderCrossReferences}
              />
            )}

            {/* Episode 05 Activity 2: Resource Teacher Interview Quote Slabs */}
            {episode.activity2.rtInterview && (
              <RtInterviewQuoteSlabs
                epId={epId}
                activity={episode.activity2}
                hidePending={hidePending}
                renderCrossReferences={renderCrossReferences}
              />
            )}

            {/* Episode 04 Observation Sheet Index Card (hiding PENDING fields like gradeLevel) */}
            {episode.activity2.observationSheet && (
              <div className="p-[var(--space-24)] shape-index-card bg-[var(--color-chalk-surface)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-16)]">
                {[
                  { key: 'nameOfTeacher', label: 'Name of Teacher' },
                  { key: 'school', label: 'School' },
                  { key: 'date', label: 'Date' },
                  { key: 'sessions', label: 'Sessions' },
                  { key: 'gradeLevel', label: 'Grade Level' },
                  { key: 'subjectArea', label: 'Subject Area' },
                ].map(({ key, label }) => {
                  const rawField = episode.activity2?.observationSheet?.[key];
                  if (rawField === undefined || rawField === null) return null;
                  const pathKey = `${epId}.activity2.observationSheet.${key}`;
                  const inlineStatus =
                    typeof rawField === 'object' && 'status' in rawField
                      ? rawField.status
                      : undefined;
                  const val =
                    typeof rawField === 'object' && 'value' in rawField
                      ? String(rawField.value ?? '')
                      : String(rawField);
                  if (hidePending && isStatusPending(inlineStatus, pathKey)) {
                    return null;
                  }
                  if (isStatusPending(inlineStatus, pathKey)) {
                    return null;
                  }
                  return (
                    <div key={key} className="space-y-[var(--space-4)]">
                      <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block">
                        {label}
                      </span>
                      <strong
                        data-verify-id={`${epId}-obs-${key}`}
                        className="font-display font-bold text-scale-17 text-[var(--color-ink)] block"
                      >
                        {val}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Episode 04 Activity 2-1: Teaching Methods and Approaches */}
            {episode.activity2.activity2_1 && (
              <div
                id={`${epShort}-act${episode.activity2.activity2_1.number}`}
                className="space-y-[var(--space-28)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]"
              >
                <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-10)] flex flex-wrap items-center gap-[var(--space-12)]">
                  <span className="inline-block px-[var(--space-12)] py-[var(--space-4)] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-extrabold text-scale-24 border-2 border-[var(--color-ink)] leading-none">
                    {episode.activity2.activity2_1.number}
                  </span>
                  <h4
                    data-verify-id={`${epId}-act2_1-title`}
                    className="font-display font-bold text-scale-24 text-[var(--color-ink)]"
                  >
                    {episode.activity2.activity2_1.title}
                  </h4>
                </div>

                {/* 3D Flip Deck for Methods Table (Not observed cards face-down) */}
                <MethodsFlipDeck
                  epId={epId}
                  activity={episode.activity2.activity2_1}
                  hidePending={hidePending}
                  renderCrossReferences={renderCrossReferences}
                />

                {/* Seven-Step Lesson Arc Scroll-filled Path */}
                <SevenStepLessonArc />

                {/* 2-1 Questions (Cards for questions) */}
                {episode.activity2.activity2_1.questions && (
                  <div className="space-y-[var(--space-20)]">
                    {episode.activity2.activity2_1.questions.map((q, qIdx) => {
                      const pathKey = `${epId}.activity2.activity2_1.questions[${qIdx}]`;
                      if (hidePending && isStatusPending(q.status, pathKey)) return null;
                      const verifyId = `${epId}-act2_1-q${q.n ?? qIdx + 1}`;
                      const domId = `${epShort}-act${episode.activity2!.activity2_1!.number}-q${q.n ?? qIdx + 1}`;
                      return (
                        <div
                          key={verifyId}
                          className="p-[var(--space-20)] sm:p-[var(--space-24)] shape-index-card space-y-[var(--space-12)] break-inside-avoid border-2 border-[var(--color-ink)]"
                        >
                          <div className="flex items-center justify-between border-b border-[var(--color-rule-red)] pb-[var(--space-8)]">
                            <span className="font-mono text-scale-12 font-bold tracking-wider text-[var(--color-chalk-muted)] uppercase">
                              {episode.activity2!.activity2_1!.number}
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-red-pen)]" aria-hidden="true" />
                          </div>
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
                )}
              </div>
            )}

            {/* Episode 04 Activity 2-2: Use of Instructional Materials */}
            {episode.activity2.activity2_2 && (
              <div
                id={`${epShort}-act${episode.activity2.activity2_2.number}`}
                className="space-y-[var(--space-28)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]"
              >
                <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-10)] flex flex-wrap items-center gap-[var(--space-12)]">
                  <span className="inline-block px-[var(--space-12)] py-[var(--space-4)] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-extrabold text-scale-24 border-2 border-[var(--color-ink)] leading-none">
                    {episode.activity2.activity2_2.number}
                  </span>
                  <h4
                    data-verify-id={`${epId}-act2_2-title`}
                    className="font-display font-bold text-scale-24 text-[var(--color-ink)]"
                  >
                    {episode.activity2.activity2_2.title}
                  </h4>
                </div>

                {/* Whiteboard-style materials checklist */}
                <WhiteboardMaterialsChecklist
                  epId={epId}
                  activity={episode.activity2.activity2_2}
                  hidePending={hidePending}
                  renderCrossReferences={renderCrossReferences}
                />

                {/* 2-2 Questions (Cards for questions) */}
                {episode.activity2.activity2_2.questions && (
                  <div className="space-y-[var(--space-20)]">
                    {episode.activity2.activity2_2.questions.map((q, qIdx) => {
                      const pathKey = `${epId}.activity2.activity2_2.questions[${qIdx}]`;
                      if (hidePending && isStatusPending(q.status, pathKey)) return null;
                      const verifyId = `${epId}-act2_2-q${q.n ?? qIdx + 1}`;
                      const domId = `${epShort}-act${episode.activity2!.activity2_2!.number}-q${q.n ?? qIdx + 1}`;
                      return (
                        <div
                          key={verifyId}
                          className="p-[var(--space-20)] sm:p-[var(--space-24)] shape-index-card space-y-[var(--space-12)] break-inside-avoid border-2 border-[var(--color-ink)]"
                        >
                          <div className="flex items-center justify-between border-b border-[var(--color-rule-red)] pb-[var(--space-8)]">
                            <span className="font-mono text-scale-12 font-bold tracking-wider text-[var(--color-chalk-muted)] uppercase">
                              {episode.activity2!.activity2_2!.number}
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-red-pen)]" aria-hidden="true" />
                          </div>
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
                )}
              </div>
            )}

            {/* Episode 04 Activity 2-3: Lesson Plan Development */}
            {episode.activity2.activity2_3 && (
              <div
                id={`${epShort}-act${episode.activity2.activity2_3.number}`}
                className="space-y-[var(--space-28)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]"
              >
                <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-10)] flex flex-wrap items-center gap-[var(--space-12)]">
                  <span className="inline-block px-[var(--space-12)] py-[var(--space-4)] bg-[var(--color-red-pen)] text-[var(--color-chalk)] font-display font-extrabold text-scale-24 border-2 border-[var(--color-ink)] leading-none">
                    {episode.activity2.activity2_3.number}
                  </span>
                  <h4
                    data-verify-id={`${epId}-act2_3-title`}
                    className="font-display font-bold text-scale-24 text-[var(--color-ink)]"
                  >
                    {episode.activity2.activity2_3.title}
                  </h4>
                </div>

                {/* Five-Stop Lesson Timeline */}
                <FiveStopLessonTimeline />

                {/* 2-3 Questions (Cards for questions) */}
                {episode.activity2.activity2_3.questions && (
                  <div className="space-y-[var(--space-20)]">
                    {episode.activity2.activity2_3.questions.map((q, qIdx) => {
                      const pathKey = `${epId}.activity2.activity2_3.questions[${qIdx}]`;
                      if (hidePending && isStatusPending(q.status, pathKey)) return null;
                      const verifyId = `${epId}-act2_3-q${q.n ?? qIdx + 1}`;
                      const domId = `${epShort}-act${episode.activity2!.activity2_3!.number}-q${q.n ?? qIdx + 1}`;
                      return (
                        <div
                          key={verifyId}
                          className="p-[var(--space-20)] sm:p-[var(--space-24)] shape-index-card space-y-[var(--space-12)] break-inside-avoid border-2 border-[var(--color-ink)]"
                        >
                          <div className="flex items-center justify-between border-b border-[var(--color-rule-red)] pb-[var(--space-8)]">
                            <span className="font-mono text-scale-12 font-bold tracking-wider text-[var(--color-chalk-muted)] uppercase">
                              {episode.activity2!.activity2_3!.number}
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-red-pen)]" aria-hidden="true" />
                          </div>
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
                )}
              </div>
            )}

            {/* Class Observation (Episode 03) */}
            {episode.activity2.classObservation && (
              <div className="space-y-[var(--space-16)]">
                <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-8)] space-y-[var(--space-4)]">
                  <h4
                    data-verify-id={`${epId}-classObservation-title`}
                    className="font-display font-bold text-scale-24 text-[var(--color-ink)]"
                  >
                    {episode.activity2.classObservation.title}
                  </h4>
                  {episode.activity2.classObservation.guideTitle && (
                    <p
                      data-verify-id={`${epId}-classObservation-guideTitle`}
                      className="font-mono text-scale-14 font-semibold text-[var(--color-chalk-muted)]"
                    >
                      {episode.activity2.classObservation.guideTitle}
                    </p>
                  )}
                </div>

                <div>
                  {episode.activity2.classObservation.questions.map((q, qIdx) => {
                    const pathKey = `${epId}.activity2.classObservation.questions[${qIdx}]`;
                    if (hidePending && isStatusPending(q.status, pathKey)) return null;
                    const verifyId = `${epId}-act2-co-q${q.n ?? qIdx + 1}`;
                    const domId = `${epShort}-act${episode.activity2!.number}-co-q${q.n ?? qIdx + 1}`;
                    return (
                      <AnswerBlock
                        key={verifyId}
                        id={domId}
                        verifyId={verifyId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={q.display === 'prose'}
                        renderText={renderCrossReferences}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interview with a Teacher (Episode 03) */}
            {episode.activity2.teacherInterview && (
              <div className="space-y-[var(--space-24)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]">
                <h4
                  data-verify-id={`${epId}-teacherInterview-title`}
                  className="font-display font-bold text-scale-24 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                >
                  {episode.activity2.teacherInterview.title}
                </h4>

                {/* Teacher Profile Index Card */}
                {episode.activity2.teacherInterview.profile && (
                  <div className="p-[var(--space-20)] shape-index-card bg-[var(--color-chalk-surface)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-16)]">
                    <div>
                      <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block">
                        Resource Teacher
                      </span>
                      <strong
                        data-verify-id={`${epId}-ti-profile-resourceTeacher`}
                        className="font-display font-bold text-scale-17 text-[var(--color-ink)]"
                      >
                        {episode.activity2.teacherInterview.profile.resourceTeacher}
                      </strong>
                    </div>
                    <div>
                      <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block">
                        School
                      </span>
                      <strong
                        data-verify-id={`${epId}-ti-profile-school`}
                        className="font-display font-bold text-scale-17 text-[var(--color-ink)]"
                      >
                        {episode.activity2.teacherInterview.profile.school}
                      </strong>
                    </div>
                    <div>
                      <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block">
                        Grade Level / Subject
                      </span>
                      <strong
                        data-verify-id={`${epId}-ti-profile-gradeLevelSubject`}
                        className="font-display font-bold text-scale-17 text-[var(--color-ink)]"
                      >
                        {episode.activity2.teacherInterview.profile.gradeLevelSubject}
                      </strong>
                    </div>
                    <div>
                      <span className="font-mono text-scale-12 text-[var(--color-chalk-muted)] block">
                        Date of Interview
                      </span>
                      <strong
                        data-verify-id={`${epId}-ti-profile-dateOfInterview`}
                        className="font-display font-bold text-scale-17 text-[var(--color-ink)]"
                      >
                        {episode.activity2.teacherInterview.profile.dateOfInterview}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Interview Parts (Part 1 & Part 2) rendered as attributed quote AnswerBlocks */}
                {episode.activity2.teacherInterview.parts.map((part, pIdx) => {
                  const useFullAttribution =
                    episode.activity2?.teacherInterview?.attribution === 'full'
                      ? episode.activity2.teacherInterview.profile
                      : undefined;

                  return (
                    <div key={`ti-part-${pIdx}`} className="space-y-[var(--space-12)]">
                      <h5
                        data-verify-id={`${epId}-ti-part-${pIdx + 1}-heading`}
                        className="font-display font-bold text-scale-20 text-[var(--color-plum)] border-b border-[var(--color-border-light)] pb-[var(--space-6)]"
                      >
                        {part.heading}
                      </h5>
                      <div>
                        {part.questions.map((q, qIdx) => {
                          const pathKey = `${epId}.activity2.teacherInterview.parts[${pIdx}].questions[${qIdx}]`;
                          if (hidePending && isStatusPending(q.status, pathKey)) return null;
                          const verifyId = `${epId}-act2-ti-p${pIdx + 1}-q${q.n ?? qIdx + 1}`;
                          const domId = `${epShort}-act${episode.activity2!.number}-ti-p${pIdx + 1}-q${q.n ?? qIdx + 1}`;
                          return (
                            <AnswerBlock
                              key={verifyId}
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
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Teacher-guided practices table (hiding PENDING rows in production/print) */}
                {episode.activity2.teacherInterview.practicesTable && (
                  <div className="space-y-[var(--space-16)] pt-[var(--space-16)]">
                    <div className="space-y-[var(--space-4)]">
                      <h5
                        data-verify-id={`${epId}-practicesTable-title`}
                        className="font-display font-bold text-scale-24 text-[var(--color-ink)]"
                      >
                        {episode.activity2.teacherInterview.practicesTable.title}
                      </h5>
                      {episode.activity2.teacherInterview.practicesTable.instruction && (
                        <p
                          data-verify-id={`${epId}-practicesTable-instruction`}
                          className="text-scale-17 text-[var(--color-chalk-muted)]"
                        >
                          {episode.activity2.teacherInterview.practicesTable.instruction}
                        </p>
                      )}
                    </div>

                    <div className="shape-seating-grid shadow-[4px_4px_0_var(--color-ink)] overflow-x-auto">
                      <table className="w-full border-collapse text-left text-scale-14">
                        <thead>
                          <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)]">
                            {episode.activity2.teacherInterview.practicesTable.columns.map(
                              (col, cIdx) => (
                                <th
                                  key={col.key}
                                  scope="col"
                                  data-verify-id={`${epId}-practicesTable-col-${col.key}`}
                                  className={`p-[var(--space-12)] font-display font-bold ${
                                    cIdx === 0
                                      ? 'border-r-2 border-[var(--color-ink)] w-[42%]'
                                      : 'w-[58%]'
                                  }`}
                                >
                                  {col.label}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {episode.activity2.teacherInterview.practicesTable.rows.map(
                            (row, rIdx) => {
                              const rowPathKey = `${epId}.activity2.teacherInterview.practicesTable.rows[${rIdx}]`;
                              const rowPending = isStatusPending(row.status, rowPathKey);
                              if (rowPending && hidePending) {
                                return null;
                              }
                              if (rowPending) {
                                return (
                                  <tr
                                    key={rowPathKey}
                                    aria-hidden="true"
                                    className="border-b border-dashed border-[var(--color-border-light)] bg-[var(--color-chalk)]/50 text-[var(--color-chalk-muted)]"
                                  >
                                    <td className="p-[var(--space-12)] border-r-2 border-[var(--color-ink)] font-medium">
                                      {row.practice}
                                    </td>
                                    <td className="p-[var(--space-12)] font-mono text-scale-12 italic">
                                      PENDING INTAKE — hidden in production and print
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr
                                  key={rowPathKey}
                                  className="border-b border-[var(--color-border-light)] last:border-b-0 hover:bg-[var(--color-chalk)]"
                                >
                                  <th
                                    scope="row"
                                    data-verify-id={`${rowPathKey}.practice`}
                                    className="p-[var(--space-16)] font-semibold text-scale-17 text-[var(--color-ink)] border-r-2 border-[var(--color-ink)] bg-[var(--color-chalk-surface)] align-top"
                                  >
                                    {row.practice}
                                  </th>
                                  <td
                                    data-verify-id={`${rowPathKey}.illustration`}
                                    className="p-[var(--space-16)] text-scale-17 text-[var(--color-ink)] align-top reading-measure"
                                  >
                                    {row.illustration}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity 2 — Answer the following questions: */}
            {episode.activity2.answer && (
              <div className="space-y-[var(--space-16)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]">
                <h4
                  data-verify-id={`${epId}-act2-answer-title`}
                  className="font-display font-bold text-scale-24 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                >
                  {episode.activity2.answer.title}
                </h4>
                <div>
                  {episode.activity2.answer.questions.map((q, qIdx) => {
                    const pathKey = `${epId}.activity2.answer.questions[${qIdx}]`;
                    if (hidePending && isStatusPending(q.status, pathKey)) return null;
                    const verifyId = `${epId}-act2-ans-q${q.n ?? qIdx + 1}`;
                    const domId = `${epShort}-act${episode.activity2!.number}-q${q.n ?? qIdx + 1}`;
                    return (
                      <AnswerBlock
                        key={verifyId}
                        id={domId}
                        verifyId={verifyId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={q.display === 'prose'}
                        renderText={renderCrossReferences}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* EPISODE 05: ACTIVITY 3 (TIME, SPACE, & RESOURCES)              */}
        {/* ============================================================== */}
        {episode.activity3 && (
          <section
            id={`${epShort}-act${episode.activity3.number}`}
            className="space-y-[var(--space-32)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]"
          >
            <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
              <span className="inline-block px-[var(--space-10)] py-[2px] bg-[var(--color-highlighter)] text-[var(--color-ink)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
                Activity {episode.activity3.number}
              </span>
              {episode.activity3.title && (
                <h3
                  data-verify-id={`${epId}-act3-title`}
                  className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]"
                >
                  {episode.activity3.title}
                </h3>
              )}
            </div>

            {/* Classroom Drawing: hidden when PENDING; renders 3D Box-Room placeholder in digital view */}
            {episode.activity3.classroomDrawing &&
            isStatusPending(
              episode.activity3.classroomDrawing.status,
              `${epId}.activity3.classroomDrawing`
            ) ? (
              <ClassroomBoxRoom3D />
            ) : episode.activity3.classroomDrawing?.image ? (
              <figure className="p-[var(--space-24)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)]">
                <img
                  src={episode.activity3.classroomDrawing.image}
                  alt="Classroom layout drawing"
                  className="w-full h-auto"
                />
              </figure>
            ) : null}

            {/* Activity 3 — Answer the following questions */}
            {episode.activity3.answer && (
              <div className="space-y-[var(--space-16)] pt-[var(--space-16)] border-t border-[var(--color-border-light)]">
                <h4
                  data-verify-id={`${epId}-act3-answer-title`}
                  className="font-display font-bold text-scale-24 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                >
                  {episode.activity3.answer.title}
                </h4>
                <div>
                  {episode.activity3.answer.questions.map((q, qIdx) => {
                    const pathKey = `${epId}.activity3.answer.questions[${qIdx}]`;
                    if (hidePending && isStatusPending(q.status, pathKey)) return null;
                    const verifyId = `${epId}-act3-ans-q${q.n ?? qIdx + 1}`;
                    const domId = `${epShort}-act${episode.activity3!.number}-q${q.n ?? qIdx + 1}`;
                    return (
                      <AnswerBlock
                        key={verifyId}
                        id={domId}
                        verifyId={verifyId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={q.display === 'prose'}
                        renderText={renderCrossReferences}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* EPISODE 01: TASK 1, TASK 2, TASK 3                             */}
        {/* ============================================================== */}
        {episode.task1 && (
          <section
            id={`${epShort}-task${episode.task1.number}`}
            className="space-y-[var(--space-32)]"
          >
            <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
              <span className="inline-block px-[var(--space-10)] py-[2px] bg-[var(--color-notebook)] text-[var(--color-chalk)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
                Task {episode.task1.number}
              </span>
              <h3
                data-verify-id={`${epId}-task1-title`}
                className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]"
              >
                {episode.task1.title}
              </h3>
            </div>

            <div className="space-y-[var(--space-32)]">
              {episode.task1.domains.map((dom, domIdx) => {
                const domPrefix = `${epId}-task1-d${domIdx + 1}`;
                return (
                  <div
                    key={domPrefix}
                    className="space-y-[var(--space-16)] p-[var(--space-16)] sm:p-[var(--space-24)] shape-index-card-plain"
                  >
                    <h4
                      data-verify-id={`${domPrefix}-heading`}
                      className="font-display font-bold text-scale-20 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                    >
                      {dom.heading}
                    </h4>

                    <div className="overflow-x-auto border-2 border-[var(--color-ink)]">
                      <table className="w-full border-collapse text-left text-scale-14">
                        <thead>
                          <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] align-top">
                            <th
                              scope="col"
                              className="p-[var(--space-12)] font-display font-bold border-r-2 border-[var(--color-ink)] min-w-[240px]"
                            >
                              Competency Indicators
                            </th>
                            {episode.task1!.levels.map((lvl, lvlIdx) => (
                              <th
                                key={lvl.label}
                                scope="col"
                                className="p-[var(--space-12)] border-r border-[var(--color-border-light)] min-w-[130px]"
                              >
                                <div
                                  data-verify-id={
                                    domIdx === 0
                                      ? `${epId}-task1-level-${lvlIdx + 1}-label`
                                      : undefined
                                  }
                                  className="font-display font-bold text-scale-14 text-[var(--color-ink)]"
                                >
                                  {lvl.label}
                                </div>
                                <div
                                  data-verify-id={
                                    domIdx === 0
                                      ? `${epId}-task1-level-${lvlIdx + 1}-description`
                                      : undefined
                                  }
                                  className="mt-[var(--space-4)] font-normal text-scale-12 text-[var(--color-chalk-muted)]"
                                >
                                  {lvl.description}
                                </div>
                              </th>
                            ))}
                            <th
                              scope="col"
                              className="p-[var(--space-12)] font-display font-bold min-w-[180px]"
                            >
                              Evidence
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dom.indicators.map((ind, indIdx) => {
                            const indPrefix = `${domPrefix}-ind${indIdx + 1}`;
                            return (
                              <tr
                                key={indPrefix}
                                className="border-b border-[var(--color-border-light)] last:border-b-0 align-top bg-[var(--color-chalk-surface)]"
                              >
                                <th
                                  scope="row"
                                  className="p-[var(--space-12)] font-normal text-[var(--color-ink)] border-r-2 border-[var(--color-ink)]"
                                >
                                  <span data-verify-id={`${indPrefix}-text`}>
                                    {renderAsteriskEmphasis(ind.indicator)}
                                  </span>
                                </th>
                                {episode.task1!.levels.map((lvl) => {
                                  const isMatch = ind.level === lvl.label;
                                  return (
                                    <td
                                      key={lvl.label}
                                      className="p-[var(--space-12)] text-center font-mono font-bold border-r border-[var(--color-border-light)] align-middle"
                                    >
                                      {isMatch ? (
                                        <span
                                          data-verify-id={`${indPrefix}-level`}
                                          data-verify-status={ind.level}
                                          className="inline-block text-scale-17 text-[var(--color-notebook)] font-bold"
                                        >
                                          ✓
                                        </span>
                                      ) : null}
                                    </td>
                                  );
                                })}
                                <td className="p-[var(--space-12)] space-y-[var(--space-6)]">
                                  {ind.evidence.map((ev, evIdx) => {
                                    const isInternal = ev.url.startsWith('#');
                                    const linkText = ev.label || 'Open evidence';
                                    return (
                                      <div key={evIdx}>
                                        <a
                                          href={ev.url}
                                          target={isInternal ? undefined : '_blank'}
                                          rel={isInternal ? undefined : 'noopener'}
                                          data-verify-id={
                                            ev.label
                                              ? `${indPrefix}-ev${evIdx + 1}-label`
                                              : undefined
                                          }
                                          className="text-scale-14 font-semibold text-[var(--color-notebook)] underline underline-offset-4 break-words"
                                        >
                                          {linkText}
                                        </a>
                                      </div>
                                    );
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-[var(--space-8)] text-scale-14 text-[var(--color-ink)] pt-[var(--space-4)]">
                      <p>
                        <strong className="font-bold">
                          Indicators that are not yet achieved:{' '}
                        </strong>
                        <span data-verify-id={`${domPrefix}-notYetAchieved`}>
                          {dom.notYetAchieved}
                        </span>
                      </p>
                      <p>
                        <strong className="font-bold">Remarks/Insights: </strong>
                        <span data-verify-id={`${domPrefix}-remarks`}>{dom.remarks}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {episode.task2 &&
          !(
            hidePending &&
            episode.task2.roadmap &&
            isStatusPending(episode.task2.roadmap.status, `${epId}.task2.roadmap`)
          ) && (
            <section
              id={`${epShort}-task${episode.task2.number}`}
              className="space-y-[var(--space-24)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]"
            >
              <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
                <span className="inline-block px-[var(--space-10)] py-[2px] bg-[var(--color-notebook)] text-[var(--color-chalk)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
                  Task {episode.task2.number}
                </span>
                <h3 className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]">
                  {episode.task2.title}
                </h3>
              </div>
            </section>
          )}

        {episode.task3 && (
          <section
            id={`${epShort}-task${episode.task3.number}-section`}
            className="space-y-[var(--space-32)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]"
          >
            <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-6)]">
              <span className="inline-block px-[var(--space-10)] py-[2px] bg-[var(--color-notebook)] text-[var(--color-chalk)] font-mono text-scale-12 font-bold border border-[var(--color-ink)]">
                Task {episode.task3.number}
              </span>
              <h3
                data-verify-id={`${epId}-task3-title`}
                className="font-display font-extrabold text-scale-32 text-[var(--color-ink)]"
              >
                {episode.task3.title}
              </h3>
            </div>

            {episode.task3.philosophiesTable && (
              <div className="overflow-x-auto border-2 border-[var(--color-ink)] bg-[var(--color-chalk-surface)]">
                <table className="w-full border-collapse text-left text-scale-14">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] text-[var(--color-ink)] align-top">
                      {episode.task3.philosophiesTable.columns.map((col, cIdx) => (
                        <th
                          key={col.key}
                          scope="col"
                          data-verify-id={`${epId}-task3-phil-col-${col.key}`}
                          className={`p-[var(--space-12)] font-display font-bold min-w-[220px] ${
                            cIdx < episode.task3!.philosophiesTable.columns.length - 1
                              ? 'border-r-2 border-[var(--color-ink)]'
                              : ''
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {episode.task3.philosophiesTable.rows.map((row, rIdx) => {
                      const rowId = `${epId}-task3-phil-r${rIdx + 1}`;
                      return (
                        <tr
                          key={rowId}
                          className="border-b border-[var(--color-border-light)] last:border-b-0 align-top"
                        >
                          <th
                            scope="row"
                            className="p-[var(--space-16)] border-r-2 border-[var(--color-ink)] bg-[var(--color-chalk)] font-normal space-y-[var(--space-6)]"
                          >
                            {row.category && (
                              <p
                                data-verify-id={`${rowId}-category`}
                                className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)]"
                              >
                                {row.category}
                              </p>
                            )}
                            <p
                              data-verify-id={`${rowId}-philosophy`}
                              className="font-display font-bold text-scale-17 text-[var(--color-ink)]"
                            >
                              {row.philosophy}
                            </p>
                            <p
                              data-verify-id={`${rowId}-definition`}
                              className="text-scale-14 text-[var(--color-ink)]"
                            >
                              {renderAsteriskEmphasis(row.definition)}
                            </p>
                          </th>
                          <td
                            data-verify-id={`${rowId}-deped`}
                            className="p-[var(--space-16)] border-r-2 border-[var(--color-ink)] text-scale-14 text-[var(--color-ink)] leading-relaxed"
                          >
                            {renderAsteriskEmphasis(row.deped)}
                          </td>
                          <td
                            data-verify-id={`${rowId}-k12`}
                            className="p-[var(--space-16)] text-scale-14 text-[var(--color-ink)] leading-relaxed"
                          >
                            {renderAsteriskEmphasis(row.k12)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {episode.task3.credo && (
              <Episode01CredoStage
                epId={epId}
                themeQuote={episode.themeQuote}
                credo={episode.task3.credo}
              />
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* EPISODE 04: REFLECTIONS                                        */}
        {/* ============================================================== */}
        {episode.reflections &&
          !(hidePending && isStatusPending(episode.reflections.status, `${epId}.reflections`)) && (
            episode.number === '04' ? (
              <FullBleedReflection
                epId={epId}
                reflections={episode.reflections}
                renderCrossReferences={renderCrossReferences}
              />
            ) : (
              <section
                id={`${epId}-reflections-section`}
                className="space-y-[var(--space-16)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]"
              >
                <h3
                  data-verify-id={`${epId}-reflections-title`}
                  className="font-display font-extrabold text-scale-32 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]"
                >
                  {episode.reflections.title}
                </h3>
                <AnswerBlock
                  id={`${epId}-reflections`}
                  prompt={episode.reflections.prompt}
                  answer={episode.reflections.answer}
                  pullQuoteExcerpt={episode.reflections.pullquote}
                  forceExpanded={episode.reflections.display === 'prose'}
                  renderText={renderCrossReferences}
                />
              </section>
            )
          )}

        {/* ============================================================== */}
        {/* EPISODE 05: FULL-BLEED REFLECTION QUESTIONS CLOSE              */}
        {/* ============================================================== */}
        {episode.reflectionQuestions && (
          <FullBleedReflectionQuestions
            epId={epId}
            reflectionQuestions={episode.reflectionQuestions}
            hidePending={hidePending}
            renderCrossReferences={renderCrossReferences}
          />
        )}

        {/* Standard AnswerBlock Section (for other episodes when marked COMPLETE) */}
        {visibleQuestions.length > 0 && (
          <section className="space-y-[var(--space-16)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]">
            <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
              Observation questions and coursework analysis
            </h3>
            <div>
              {visibleQuestions.map((q, qIdx) => {
                const qId = getQuestionId(episode.number, 'q', q, qIdx);
                return (
                  <AnswerBlock
                    key={qId}
                    id={qId}
                    questionNumber={q.n}
                    prompt={getQuestionPrompt(q)}
                    answer={q.answer}
                    pullQuoteExcerpt={getQuestionPullquote(q)}
                    forceExpanded={q.display === 'prose'}
                    renderText={renderCrossReferences}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Standard MatrixTable Section */}
        {visibleTables.length > 0 && (
          <section className="space-y-[var(--space-24)] border-t-2 border-[var(--color-ink)] pt-[var(--space-32)]">
            <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
              Observation matrices and checklists
            </h3>
            {visibleTables.map((table) => (
              <MatrixTable key={table.id} table={table} />
            ))}
          </section>
        )}

        {/* Standard Verbatim Pull-Quotes */}
        {visibleQuotes.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-24)]">
            {visibleQuotes.map((q, qIdx) => (
              <PullQuote
                key={qIdx}
                quote={q.quote}
                attribution={q.attribution}
                role={q.role}
                context={`Episode ${episode.number}`}
              />
            ))}
          </section>
        )}

        {/* Standard Reflection Block */}
        {showReflection && episode.reflection && (
          <section
            data-redpen-component="EpisodeReflectionCard"
            data-redpen-tokens="--color-chalk-surface, --color-ink, --shadow-hard"
            className="p-[var(--space-24)] sm:p-[var(--space-32)] shape-index-card space-y-[var(--space-12)] break-inside-avoid"
          >
            <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
              Episode {episode.number} reflection
            </h3>
            <p
              data-verify-id={`${epId}-reflection-prompt`}
              className="font-display font-bold text-scale-20 text-[var(--color-ink)]"
            >
              {episode.reflection.prompt}
            </p>
            <div
              data-verify-id={`${epId}-reflection-answer`}
              data-verify-paragraphs={reflectionParagraphs.length}
              className="text-scale-17 text-[var(--color-ink)] reading-measure space-y-[var(--space-12)]"
            >
              {reflectionParagraphs.map((para, pIdx) => (
                <React.Fragment key={pIdx}>
                  {pIdx > 0 && '\n\n'}
                  <p>{para}</p>
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* Chapter Footer Navigation */}
        <footer className="pt-[var(--space-24)] border-t-2 border-[var(--color-ink)] flex flex-wrap items-center justify-between gap-[var(--space-16)] no-print">
          <div className="flex flex-wrap items-center gap-[var(--space-16)]">
            {navInfo?.prev && (
              <a href={`#${navInfo.prev.id}`} className="btn-base btn-secondary">
                <ArrowLeft size={16} aria-hidden="true" />
                <span>{navInfo.prev.label}</span>
              </a>
            )}
            {navInfo?.next && (
              <a href={`#${navInfo.next.id}`} className="btn-base btn-secondary">
                <span>{navInfo.next.label}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>

          <BackToContents />
        </footer>
      </div>
    </article>
  );
};

const CREDO_ROMAN = ['I', 'II', 'III', 'IV'] as const;

/**
 * Splits a paragraph into sentence slices while preserving 100% of characters
 * and trailing whitespace (so `slices.join('') === text`).
 */
function splitCredoSentences(text: string): string[] {
  const sentences: string[] = [];
  const regex = /[.!?](?:\*\*|\*)?(?=["”']?\s+[A-Z*"])["”']?\s+/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const splitAt = m.index + m[0].length;
    sentences.push(text.slice(lastIdx, splitAt));
    lastIdx = splitAt;
  }
  if (lastIdx < text.length) {
    sentences.push(text.slice(lastIdx));
  }
  return sentences.length > 0 ? sentences : [text];
}

interface Episode01CredoStageProps {
  epId: string;
  themeQuote?: string;
  credo: NonNullable<NonNullable<Episode['task3']>['credo']>;
}

const Episode01CredoStage: React.FC<Episode01CredoStageProps> = ({
  epId,
  themeQuote,
  credo,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  const [isReducedOrLite, setIsReducedOrLite] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-tier') === 'lite';
    return reduced || lite;
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [skipAnimation, setSkipAnimation] = useState<boolean>(false);
  const [dustPaused, setDustPaused] = useState<boolean>(false);
  const [entryRevealed, setEntryRevealed] = useState<boolean>(true);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [chapterProgress, setChapterProgress] = useState<number[]>([1, 1, 1, 1]);
  const [mobileChapterEntered, setMobileChapterEntered] = useState<boolean[]>([
    true,
    true,
    true,
    true,
  ]);
  const [activeAudiencePanel, setActiveAudiencePanel] = useState<number>(0);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState<boolean[]>([
    true,
    false,
    false,
  ]);

  const isStatic = isReducedOrLite || skipAnimation;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMedia = () => {
      const reduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lite =
        document.documentElement.getAttribute('data-tier') === 'lite';
      setIsReducedOrLite(reduced || lite);
      setIsMobile(window.innerWidth < 768);
    };

    checkMedia();
    window.addEventListener('resize', checkMedia, { passive: true });
    return () => window.removeEventListener('resize', checkMedia);
  }, []);

  // Desktop scroll-linked progress for the 4 chapters & active rail indicator
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStatic) {
      setEntryRevealed(true);
      setChapterProgress([1, 1, 1, 1]);
      return;
    }

    let rafId = 0;
    const updateScroll = () => {
      const vh = window.innerHeight || 800;

      if (entryRef.current) {
        const eRect = entryRef.current.getBoundingClientRect();
        setEntryRevealed(eRect.top < vh * 0.88);
      }

      const nextProgress: number[] = [0, 0, 0, 0];
      let currentActive = 0;

      for (let i = 0; i < 4; i++) {
        const el = chapterRefs.current[i];
        if (!el) {
          nextProgress[i] = 1;
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.top <= vh * 0.55) {
          currentActive = i;
        }

        if (isMobile) {
          nextProgress[i] = mobileChapterEntered[i] ? 1 : 0;
        } else {
          // Scroll-linked progress across sticky chapter runway
          const totalTravel = Math.max(1, rect.height - vh + vh * 0.7);
          const scrolled = vh * 0.7 - rect.top;
          const raw = Math.max(0, Math.min(1, scrolled / totalTravel));
          nextProgress[i] = raw;
        }
      }

      setActiveChapter(currentActive);
      setChapterProgress((prev) => {
        if (
          prev.every((v, idx) => Math.abs(v - nextProgress[idx]) < 0.01)
        ) {
          return prev;
        }
        return nextProgress;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScroll);
    };

    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isStatic, isMobile, mobileChapterEntered]);

  // Below 768px: normal flow with reveal-on-enter via IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile || isStatic) return;
    if (typeof IntersectionObserver === 'undefined') {
      setMobileChapterEntered([true, true, true, true]);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        setMobileChapterEntered((prev) => {
          const next = [...prev];
          for (const entry of entries) {
            const idxAttr = entry.target.getAttribute('data-chapter-index');
            if (idxAttr !== null && entry.isIntersecting) {
              next[Number(idxAttr)] = true;
            }
          }
          return next;
        });
      },
      { threshold: 0.12 }
    );

    chapterRefs.current.forEach((el) => {
      if (el) io.observe(el);
    });

    return () => io.disconnect();
  }, [isMobile, isStatic]);

  const renderSentenceSpans = (
    paragraphText: string,
    chapterProg: number,
    sentenceStartIndex: number,
    totalSentencesInChapter: number
  ) => {
    const sentences = splitCredoSentences(paragraphText);
    return sentences.map((sentence, idx) => {
      const globalIdx = sentenceStartIndex + idx;
      const count = Math.max(1, totalSentencesInChapter);
      // Stagger each sentence window smoothly across chapter scroll progress [0.06 .. 0.88]
      const winStart = (globalIdx / count) * 0.62 + 0.04;
      const winSpan = Math.max(0.18, 0.72 / count);
      const localProg = isStatic
        ? 1
        : isMobile
          ? chapterProg > 0
            ? 1
            : 0.25
          : Math.max(0, Math.min(1, (chapterProg - winStart) / winSpan));

      const sentenceOpacity = isStatic
        ? 1
        : 0.22 + localProg * 0.78;

      return (
        <span
          key={idx}
          className="credo-sentence"
          style={{ opacity: sentenceOpacity }}
        >
          <EmphasizedText
            text={sentence}
            episode={epId}
            staticMode={isStatic}
            revealProgress={isStatic ? 1 : localProg}
          />
        </span>
      );
    });
  };

  return (
    <div
      id="ep1-task3"
      ref={stageRef}
      className="credo-stage overflow-x-clip rounded-[2px] border-2 border-[var(--color-ink)]"
    >
      {/* Background slow chalk-dust drift (cheap, pausable) */}
      <div
        aria-hidden="true"
        data-paused={dustPaused || isStatic ? 'true' : 'false'}
        className="credo-chalk-dust no-print"
      />
      <div
        aria-hidden="true"
        data-paused={dustPaused || isStatic ? 'true' : 'false'}
        className="credo-chalk-dust-secondary no-print"
      />

      {/* Top Control Bar: Visible "Skip credo animation" link & Pausable Chalk-Dust Control */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-[var(--space-12)] px-[var(--space-16)] sm:px-[var(--space-32)] py-[var(--space-12)] bg-[var(--color-notebook)] text-[var(--color-chalk)] border-b-2 border-[var(--color-highlighter)] no-print">
        <div className="flex items-center gap-[var(--space-12)]">
          <span className="font-mono-tech text-scale-12 uppercase tracking-widest px-[var(--space-8)] py-[2px] bg-[var(--color-chalkboard)] text-[var(--color-highlighter)] border border-[var(--color-highlighter)]">
            Episode 01 · Task 03 Set Piece
          </span>
          <a
            href="#ep1-credo-after"
            onClick={() => setSkipAnimation(true)}
            className="font-mono-tech text-scale-12 font-bold underline decoration-[var(--color-highlighter)] underline-offset-4 text-[var(--color-chalk)] hover:text-[var(--color-highlighter)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlighter)] px-[var(--space-8)] py-[var(--space-4)]"
          >
            Skip credo animation
          </a>
        </div>

        <div className="flex items-center gap-[var(--space-12)]">
          {!isReducedOrLite && (
            <button
              type="button"
              onClick={() => setSkipAnimation((prev) => !prev)}
              aria-pressed={skipAnimation}
              className="font-mono-tech text-scale-12 uppercase tracking-wider px-[var(--space-12)] py-[var(--space-4)] bg-[var(--color-chalkboard)] text-[var(--color-chalk)] border border-[var(--color-chalk)] hover:border-[var(--color-highlighter)] hover:text-[var(--color-highlighter)] cursor-pointer"
            >
              {skipAnimation ? 'Enable scroll reveal' : 'Show all text static'}
            </button>
          )}
          {!isReducedOrLite && (
            <button
              type="button"
              onClick={() => setDustPaused((prev) => !prev)}
              aria-pressed={dustPaused}
              className="font-mono-tech text-scale-12 uppercase tracking-wider px-[var(--space-12)] py-[var(--space-4)] bg-[var(--color-chalkboard)] text-[var(--color-chalk)] border border-[var(--color-chalk)] hover:border-[var(--color-highlighter)] hover:text-[var(--color-highlighter)] cursor-pointer"
            >
              {dustPaused ? 'Resume chalk dust' : 'Pause chalk dust'}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 1. ENTRY: FULL-SCREEN TRANSITION FROM EPISODE 1 BLUE TO CHALKBOARD */}
      {/* ================================================================== */}
      <div
        id="ep1-credo-entry"
        ref={entryRef}
        className="relative z-10 min-h-screen flex flex-col justify-between overflow-hidden border-b-2 border-[var(--color-notebook)]"
        style={{
          background:
            'linear-gradient(180deg, #2447FF 0%, #162B8C 18%, #0C1612 42%, #0C1612 100%)',
        }}
      >
        {/* Top Blue-to-Chalkboard Wipe Header & Sweeping Thin Rules */}
        <div className="w-full pt-[var(--space-32)] sm:pt-[var(--space-48)] px-[var(--space-24)] sm:px-[var(--space-48)] space-y-[var(--space-16)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--space-12)]">
            <span className="font-mono-tech text-scale-12 uppercase tracking-[0.2em] text-[var(--color-highlighter)]">
              Chalkboard Stage · Personal Philosophy of Education
            </span>
            <span className="font-mono-tech text-scale-12 uppercase tracking-[0.16em] text-[var(--color-chalk)] opacity-85">
              Four Chapters · I — IV
            </span>
          </div>

          {/* Thin rule sweep 1 (Highlighter Yellow) */}
          <div
            aria-hidden="true"
            className="h-[2px] w-full bg-[var(--color-highlighter)] origin-left credo-motion-slower"
            style={{
              transform: entryRevealed || isStatic ? 'scaleX(1)' : 'scaleX(0.08)',
              opacity: entryRevealed || isStatic ? 1 : 0.3,
            }}
          />
          {/* Thin rule sweep 2 (Chalk & Notebook Blue) */}
          <div
            aria-hidden="true"
            className="h-[1px] w-4/5 bg-[var(--color-chalk)] origin-left credo-motion-slow"
            style={{
              transform: entryRevealed || isStatic ? 'scaleX(1)' : 'scaleX(0.04)',
              opacity: entryRevealed || isStatic ? 0.65 : 0.15,
            }}
          />
        </div>

        {/* Centerpiece: Credo Title + Huge ThemeQuote Opening Statement */}
        <div
          className="my-auto px-[var(--space-24)] sm:px-[var(--space-48)] lg:px-[var(--space-80)] py-[var(--space-48)] max-w-6xl mx-auto text-center space-y-[var(--space-32)] credo-motion-slower"
          style={{
            transform:
              entryRevealed || isStatic ? 'translate3d(0, 0, 0)' : 'translate3d(0, 28px, 0)',
            opacity: entryRevealed || isStatic ? 1 : 0.15,
          }}
        >
          <div className="inline-flex flex-col items-center gap-[var(--space-8)]">
            <h4
              data-verify-id={`${epId}-credo-title`}
              className="font-mono-tech uppercase tracking-[0.24em] text-scale-14 font-bold text-[var(--color-highlighter)] px-[var(--space-16)] py-[var(--space-8)] border-2 border-[var(--color-highlighter)] bg-[#0C1612]/90 shadow-[4px_4px_0_#2447FF]"
            >
              {credo.title}
            </h4>
          </div>

          {themeQuote && (
            <div className="space-y-[var(--space-24)]">
              <p className="font-mono-tech text-scale-12 uppercase tracking-[0.22em] text-[var(--color-chalk)] opacity-80">
                Opening Premise · The Learner
              </p>
              <p
                aria-label={`Opening statement: ${themeQuote}`}
                className="font-display font-black italic text-scale-64 text-[var(--color-chalk)] max-w-5xl mx-auto"
              >
                <span className="text-[var(--color-highlighter)]">“</span>
                <span className="underline decoration-[var(--color-highlighter)] decoration-4 underline-offset-8">
                  {themeQuote}
                </span>
                <span className="text-[var(--color-highlighter)]">”</span>
              </p>
            </div>
          )}

          {/* Roman Numeral Chapter Index Preview */}
          <div className="pt-[var(--space-16)] flex flex-wrap items-center justify-center gap-[var(--space-12)] sm:gap-[var(--space-16)]">
            {credo.sections.map((sec, idx) => (
              <a
                key={idx}
                href={`#ep1-credo-chapter-${idx + 1}`}
                className="group inline-flex items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-8)] bg-[#13221C] border border-[var(--color-notebook)] hover:border-[var(--color-highlighter)] text-[var(--color-chalk)] transition-colors"
              >
                <span className="font-mono-tech font-bold text-scale-14 text-[var(--color-highlighter)]">
                  {CREDO_ROMAN[idx]}
                </span>
                <span className="font-body text-scale-14 text-[var(--color-chalk)] group-hover:text-[var(--color-highlighter)]">
                  {sec.lead}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Sweeping Chalk Rule */}
        <div className="w-full pb-[var(--space-24)] px-[var(--space-24)] sm:px-[var(--space-48)] space-y-[var(--space-12)]">
          <div
            aria-hidden="true"
            className="h-[2px] w-full bg-[var(--color-notebook)] origin-right credo-motion-slower"
            style={{
              transform: entryRevealed || isStatic ? 'scaleX(1)' : 'scaleX(0.1)',
            }}
          />
          <div className="flex items-center justify-between font-mono-tech text-scale-12 uppercase tracking-widest text-[var(--color-chalk)] opacity-75">
            <span>Scroll to reveal each credo statement</span>
            <span>Bicol University College of Education · FS1</span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2–5. BODY: SLIM ROMAN NUMERAL PROGRESS RAIL + 4 FULL-VIEWPORT      */}
      {/*      CHAPTERS + PULLQUOTE INTERLUDES + 3 AUDIENCE PANELS           */}
      {/* ================================================================== */}
      <div className="relative z-10 flex flex-col md:flex-row">
        {/* 3. Slim Progress Rail with Roman Numerals I, II, III, IV */}
        <nav
          aria-label="Teaching Credo chapters"
          className="sticky top-0 z-30 md:h-screen md:w-20 shrink-0 flex md:flex-col items-center justify-between px-[var(--space-16)] py-[var(--space-12)] md:py-[var(--space-32)] bg-[#09110E]/95 border-b md:border-b-0 md:border-r-2 border-[var(--color-notebook)] no-print"
        >
          <span className="font-mono-tech text-scale-12 uppercase tracking-widest text-[var(--color-highlighter)] hidden md:block [writing-mode:vertical-rl] rotate-180">
            Credo Chapters
          </span>

          <ol className="flex md:flex-col items-center justify-center gap-[var(--space-12)] sm:gap-[var(--space-16)] w-full md:w-auto">
            {credo.sections.map((sec, idx) => {
              const isCurrent = activeChapter === idx;
              return (
                <li key={idx}>
                  <a
                    href={`#ep1-credo-chapter-${idx + 1}`}
                    aria-label={`Chapter ${CREDO_ROMAN[idx]}: ${sec.lead}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`w-10 h-10 flex items-center justify-center font-mono-tech text-scale-14 font-bold border-2 transition-colors ${
                      isCurrent
                        ? 'bg-[var(--color-highlighter)] text-[var(--color-ink)] border-[var(--color-chalk)] shadow-[3px_3px_0_#2447FF]'
                        : 'bg-[#12211B] text-[var(--color-chalk)] border-[var(--color-notebook)] hover:border-[var(--color-highlighter)] hover:text-[var(--color-highlighter)]'
                    }`}
                  >
                    {CREDO_ROMAN[idx]}
                  </a>
                </li>
              );
            })}
          </ol>

          <span className="font-mono-tech text-scale-12 text-[var(--color-chalk)] opacity-75 hidden md:block">
            {CREDO_ROMAN[activeChapter]} / IV
          </span>
        </nav>

        {/* Main Chapters Column */}
        <div className="flex-1 min-w-0">
          {credo.sections.map((sec, sIdx) => {
            const secId = `${epId}-credo-s${sIdx + 1}`;
            const chapterNum = sIdx + 1;
            const roman = CREDO_ROMAN[sIdx] || String(chapterNum);
            const hasAudiences = Boolean(sec.audiences && sec.audiences.length > 0);
            const prog = chapterProgress[sIdx] ?? 1;

            // Count total sentences across paragraphs in this chapter for staggered scroll reveal
            const paragraphSentenceLists = sec.paragraphs.map((p) =>
              splitCredoSentences(p)
            );
            const totalChapterSentences = paragraphSentenceLists.reduce(
              (acc, list) => acc + list.length,
              0
            );

            // Track running sentence index across paragraphs
            let runningSentenceCursor = 0;

            // Use sticky scroll-linked runway on desktop (>=768px) when animations are active
            const runwayClass =
              !isStatic && !isMobile
                ? hasAudiences
                  ? 'min-h-[165vh]'
                  : sec.paragraphs.length > 1
                    ? 'min-h-[210vh]'
                    : 'min-h-[170vh]'
                : 'min-h-screen';

            const stickyStageClass =
              !isStatic && !isMobile
                ? 'sticky top-0 min-h-screen flex flex-col justify-center'
                : 'min-h-screen flex flex-col justify-center';

            return (
              <React.Fragment key={secId}>
                <section
                  id={`ep1-credo-chapter-${chapterNum}`}
                  data-chapter-index={sIdx}
                  ref={(el) => {
                    chapterRefs.current[sIdx] = el;
                  }}
                  className={`relative border-b-2 border-[var(--color-notebook)] ${runwayClass} credo-print-section`}
                >
                  <div
                    className={`${stickyStageClass} px-[var(--space-24)] sm:px-[var(--space-48)] lg:px-[var(--space-80)] py-[var(--space-48)] sm:py-[var(--space-80)]`}
                  >
                    <div className="max-w-5xl mx-auto w-full space-y-[var(--space-32)]">
                      {/* Chapter Roman Numeral & Thin Highlighter Rule */}
                      <div className="flex flex-col items-center text-center space-y-[var(--space-12)]">
                        <span className="font-mono-tech text-scale-12 uppercase tracking-[0.25em] px-[var(--space-12)] py-[var(--space-4)] bg-[#13241D] text-[var(--color-highlighter)] border border-[var(--color-highlighter)]">
                          Credo Chapter {roman} of IV
                        </span>

                        {/* Giant Centered h3 Lead Statement */}
                        <h3
                          data-verify-id={`${secId}-lead`}
                          className="font-display font-black text-scale-64 text-center text-[var(--color-chalk)] max-w-4xl mx-auto credo-motion-slow"
                          style={{
                            transform:
                              isStatic || prog > 0.02
                                ? 'translate3d(0, 0, 0)'
                                : 'translate3d(0, 22px, 0)',
                            opacity: isStatic ? 1 : Math.max(0.25, Math.min(1, prog * 3.2)),
                          }}
                        >
                          {sec.lead}
                        </h3>

                        <div
                          aria-hidden="true"
                          className="h-[3px] w-28 bg-[var(--color-highlighter)] shadow-[0_0_16px_#2447FF]"
                        />
                      </div>

                      {/* Chapter Content: Standard Multi-Paragraph Reveal OR 3 Audience Panels */}
                      {!hasAudiences ? (
                        <div className="max-w-3xl mx-auto space-y-[var(--space-24)]">
                          {sec.paragraphs.map((para, pIdx) => {
                            const startIdx = runningSentenceCursor;
                            runningSentenceCursor +=
                              paragraphSentenceLists[pIdx]?.length || 1;
                            return (
                              <p
                                key={pIdx}
                                data-verify-id={`${secId}-p${pIdx + 1}`}
                                className="font-body text-scale-20 text-[var(--color-chalk)]"
                              >
                                {renderSentenceSpans(
                                  para,
                                  prog,
                                  startIdx,
                                  totalChapterSentences
                                )}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        /* ========================================================== */
                        /* 5. SECTION IV ("I believe that I must relate")             */
                        /*    THREE LARGE AUDIENCE PANELS (Desktop Side-by-Side       */
                        /*    Expandable, Mobile Accessible Accordions, All Expanded  */
                        /*    in Print)                                               */
                        /* ========================================================== */
                        <div className="space-y-[var(--space-16)]">
                          <p className="font-mono-tech text-scale-12 uppercase tracking-[0.18em] text-center text-[var(--color-highlighter)] no-print">
                            {isMobile
                              ? 'Tap an audience panel below to expand'
                              : 'Hover, focus, or click any audience panel to expand'}
                          </p>

                          <div
                            role="region"
                            aria-label="Three relational audiences of the Teaching Credo"
                            className="flex flex-col md:flex-row items-stretch gap-[var(--space-16)] lg:gap-[var(--space-24)]"
                          >
                            {/* PANEL 1: Opening Paragraph for Students */}
                            {sec.paragraphs.length > 0 && (() => {
                              const panelIdx = 0;
                              const isDesktopActive = activeAudiencePanel === panelIdx;
                              const isMobileOpen = mobileAccordionOpen[panelIdx];
                              const panelBodyId = `${secId}-audience-panel-body-0`;
                              const studentSentences = splitCredoSentences(
                                sec.paragraphs[0]
                              );

                              return (
                                <div
                                  key="audience-students"
                                  onMouseEnter={() => setActiveAudiencePanel(panelIdx)}
                                  onFocus={() => setActiveAudiencePanel(panelIdx)}
                                  onClick={() => {
                                    if (!isMobile) setActiveAudiencePanel(panelIdx);
                                  }}
                                  className={`flex flex-col justify-between rounded-[2px] border-2 p-[var(--space-24)] transition-[flex-grow,border-color,background-color] duration-700 ${
                                    isDesktopActive
                                      ? 'md:flex-[1.65] bg-[#13261E] border-[var(--color-highlighter)] shadow-[6px_6px_0_#2447FF]'
                                      : 'md:flex-1 bg-[#0E1C16] border-[var(--color-notebook)] hover:border-[var(--color-highlighter)]'
                                  }`}
                                >
                                  <div>
                                    <button
                                      type="button"
                                      aria-expanded={
                                        isMobile ? isMobileOpen : isDesktopActive
                                      }
                                      aria-controls={panelBodyId}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveAudiencePanel(panelIdx);
                                        if (isMobile) {
                                          setMobileAccordionOpen((prev) =>
                                            prev.map((v, i) =>
                                              i === panelIdx ? !v : v
                                            )
                                          );
                                        }
                                      }}
                                      className="w-full text-left flex items-center justify-between gap-[var(--space-12)] pb-[var(--space-12)] border-b border-[var(--color-notebook)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlighter)] cursor-pointer"
                                    >
                                      <div className="space-y-[var(--space-4)]">
                                        <span className="block font-mono-tech text-scale-12 uppercase tracking-widest text-[var(--color-highlighter)]">
                                          Audience 01 · Classroom Core
                                        </span>
                                        <span className="block font-display font-bold text-scale-20 text-[var(--color-chalk)]">
                                          To My Learners and Students,
                                        </span>
                                      </div>
                                      <span
                                        aria-hidden="true"
                                        className="font-mono-tech text-scale-14 font-bold px-[var(--space-8)] py-[2px] border border-[var(--color-highlighter)] text-[var(--color-highlighter)] md:hidden"
                                      >
                                        {isMobileOpen ? '−' : '+'}
                                      </span>
                                    </button>

                                    <div
                                      id={panelBodyId}
                                      className={`credo-audience-accordion-grid pt-[var(--space-16)] ${
                                        isMobile && !isMobileOpen
                                          ? 'hidden md:block'
                                          : 'block'
                                      }`}
                                    >
                                      <p
                                        data-verify-id={`${secId}-p1`}
                                        className="font-body text-scale-17 text-[var(--color-chalk)]"
                                      >
                                        {renderSentenceSpans(
                                          sec.paragraphs[0],
                                          prog,
                                          0,
                                          studentSentences.length
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="pt-[var(--space-16)] mt-[var(--space-16)] border-t border-[#1F382E] flex items-center justify-between font-mono-tech text-scale-12 text-[var(--color-chalk)] opacity-75">
                                    <span>Empathy & Integrity</span>
                                    <span>01 / 03</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* PANELS 2 & 3: Colleagues/School Heads & Parents/Community */}
                            {(sec.audiences || []).map((aud, aIdx) => {
                              const panelIdx = aIdx + 1;
                              const audId = `${secId}-aud${aIdx + 1}`;
                              const isDesktopActive = activeAudiencePanel === panelIdx;
                              const isMobileOpen = mobileAccordionOpen[panelIdx];
                              const panelBodyId = `${secId}-audience-panel-body-${panelIdx}`;
                              const audSentences = splitCredoSentences(aud.text);

                              return (
                                <div
                                  key={audId}
                                  onMouseEnter={() => setActiveAudiencePanel(panelIdx)}
                                  onFocus={() => setActiveAudiencePanel(panelIdx)}
                                  onClick={() => {
                                    if (!isMobile) setActiveAudiencePanel(panelIdx);
                                  }}
                                  className={`flex flex-col justify-between rounded-[2px] border-2 p-[var(--space-24)] transition-[flex-grow,border-color,background-color] duration-700 ${
                                    isDesktopActive
                                      ? 'md:flex-[1.65] bg-[#13261E] border-[var(--color-highlighter)] shadow-[6px_6px_0_#2447FF]'
                                      : 'md:flex-1 bg-[#0E1C16] border-[var(--color-notebook)] hover:border-[var(--color-highlighter)]'
                                  }`}
                                >
                                  <div>
                                    <button
                                      type="button"
                                      aria-expanded={
                                        isMobile ? isMobileOpen : isDesktopActive
                                      }
                                      aria-controls={panelBodyId}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveAudiencePanel(panelIdx);
                                        if (isMobile) {
                                          setMobileAccordionOpen((prev) =>
                                            prev.map((v, i) =>
                                              i === panelIdx ? !v : v
                                            )
                                          );
                                        }
                                      }}
                                      className="w-full text-left flex items-center justify-between gap-[var(--space-12)] pb-[var(--space-12)] border-b border-[var(--color-notebook)] focus:outline-none focus:ring-2 focus:ring-[var(--color-highlighter)] cursor-pointer"
                                    >
                                      <div className="space-y-[var(--space-4)]">
                                        <span className="block font-mono-tech text-scale-12 uppercase tracking-widest text-[var(--color-highlighter)]">
                                          {aIdx === 0
                                            ? 'Audience 02 · Professional Community'
                                            : 'Audience 03 · Shared Stewardship'}
                                        </span>
                                        <strong
                                          data-verify-id={`${audId}-label`}
                                          className="block font-display font-bold text-scale-20 text-[var(--color-chalk)]"
                                        >
                                          {aud.label}
                                        </strong>
                                      </div>
                                      <span
                                        aria-hidden="true"
                                        className="font-mono-tech text-scale-14 font-bold px-[var(--space-8)] py-[2px] border border-[var(--color-highlighter)] text-[var(--color-highlighter)] md:hidden"
                                      >
                                        {isMobileOpen ? '−' : '+'}
                                      </span>
                                    </button>

                                    <div
                                      id={panelBodyId}
                                      className={`credo-audience-accordion-grid pt-[var(--space-16)] ${
                                        isMobile && !isMobileOpen
                                          ? 'hidden md:block'
                                          : 'block'
                                      }`}
                                    >
                                      <p
                                        data-verify-id={`${audId}-text`}
                                        className="font-body text-scale-17 text-[var(--color-chalk)]"
                                      >
                                        {renderSentenceSpans(
                                          aud.text,
                                          prog,
                                          0,
                                          audSentences.length
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="pt-[var(--space-16)] mt-[var(--space-16)] border-t border-[#1F382E] flex items-center justify-between font-mono-tech text-scale-12 text-[var(--color-chalk)] opacity-75">
                                    <span>
                                      {aIdx === 0
                                        ? 'Humility & Collaboration'
                                        : 'Respect & Transparency'}
                                    </span>
                                    <span>{`0${panelIdx + 1} / 03`}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* ========================================================== */}
                {/* 4. PULLQUOTE INTERLUDE BETWEEN CHAPTERS                    */}
                {/* ========================================================== */}
                {sec.pullquote && (
                  <aside
                    aria-label={`Chapter ${roman} Pullquote Interlude`}
                    className="relative z-10 min-h-[52vh] flex items-center justify-center px-[var(--space-24)] sm:px-[var(--space-48)] lg:px-[var(--space-80)] py-[var(--space-48)] bg-[#08100D] border-b-2 border-[var(--color-highlighter)]"
                  >
                    <div className="max-w-4xl mx-auto text-center space-y-[var(--space-24)]">
                      <span className="font-mono-tech text-scale-12 uppercase tracking-[0.24em] text-[var(--color-highlighter)]">
                        Credo Interlude · Chapter {roman}
                      </span>
                      <blockquote
                        data-verify-id={`${secId}-pullquote`}
                        className="font-display font-bold italic text-scale-40 text-[var(--color-chalk)]"
                      >
                        {sec.pullquote}
                      </blockquote>
                      <div
                        aria-hidden="true"
                        className="h-[2px] w-24 mx-auto bg-[var(--color-notebook)]"
                      />
                    </div>
                  </aside>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Target anchor for "Skip credo animation" link */}
      <div id="ep1-credo-after" className="sr-only" tabIndex={-1}>
        End of My Teaching Credo
      </div>
    </div>
  );
};


