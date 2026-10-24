import React, { useState, useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import { institutionalData } from './data/institutional';
import { episodesData } from './data/episodes';
import { appendicesData, resolveAppendixPhotoSrc } from './data/appendices';
import { isStatusPending, getEpisodeId, getEpisodeStatus, shouldHidePending } from './data/contentIntake';
import { TopBar } from './components/TopBar';
import { MobileBottomBar } from './components/MobileBottomBar';
import {
  MobileNotice,
  isMobileOrCoarseViewport,
  getSavedMobileNoticeChoice,
  saveMobileNoticeChoice,
} from './components/MobileNotice';
import { TableOfContents } from './components/TableOfContents';
import { LandingExperience } from './components/LandingExperience';
import { LandingHero } from './components/LandingHero';
import { PhilosophySection } from './components/PhilosophySection';
import { EpisodeChapter } from './components/EpisodeChapter';
import { MatrixTable } from './components/MatrixTable';
import { PhotoFrame } from './components/PhotoFrame';
import { BackToContents } from './components/BackToContents';
import { DropCap } from './components/DropCap';
import { Button } from './components/Button';
import { TitlePage, buLogoSrc, buceLogoSrc } from './components/TitlePage';
import { AcknowledgementPlate, FrontMatterPlates } from './components/FrontMatterPlates';
import { EpisodesTransition } from './components/EpisodesTransition';
import { Printer, Download, FileText, X } from 'lucide-react';

const PrintEdition = React.lazy(() =>
  import('./components/PrintEdition').then((module) => ({ default: module.PrintEdition }))
);

export default function App() {
  const [viewMode, setViewMode] = useState<'digital' | 'print'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'print' || window.location.pathname === '/print') {
        return 'print';
      }
    }
    return 'digital';
  });

  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [landingDone, setLandingDone] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState<string>('01');
  const [navMode, setNavMode] = useState<'front-matter' | 'episodes'>('front-matter');
  const [activeFrontMatter, setActiveFrontMatter] = useState<string>('acknowledgements');
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);

  const [isLite, setIsLite] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (getSavedMobileNoticeChoice() === 'lite') {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-tier', 'lite');
      }
      return true;
    }
    return false;
  });

  const [isMobileNoticeOpen, setIsMobileNoticeOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'print' || window.location.pathname === '/print') {
      return false;
    }
    if (getSavedMobileNoticeChoice() === 'lite') {
      return false;
    }
    return isMobileOrCoarseViewport();
  });

  // Showcase Tools state (Phase A preview hooks ready for Phase B full expansion)
  const [isRedPenActive, setIsRedPenActive] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState<'search' | 'underthehood' | null>(null);
  const [measuredFps, setMeasuredFps] = useState<number>(60);
  const [deviceTier, setDeviceTier] = useState<'high' | 'medium' | 'low'>(() =>
    isLite ? 'low' : 'high'
  );

  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (isLite) {
      document.documentElement.setAttribute('data-tier', 'lite');
    }
  }, [isLite]);

  useEffect(() => {
    if (viewMode === 'print') {
      setIsMobileNoticeOpen(false);
      return;
    }
    if (getSavedMobileNoticeChoice() === 'lite') {
      setIsLite(true);
      setIsMobileNoticeOpen(false);
      return;
    }

    const mqWidth = window.matchMedia('(max-width: 820px)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');

    const handleMediaChange = () => {
      if (getSavedMobileNoticeChoice() === 'lite') return;
      if (mqWidth.matches || mqCoarse.matches) {
        setIsMobileNoticeOpen(true);
      }
    };

    handleMediaChange();
    mqWidth.addEventListener('change', handleMediaChange);
    mqCoarse.addEventListener('change', handleMediaChange);
    return () => {
      mqWidth.removeEventListener('change', handleMediaChange);
      mqCoarse.removeEventListener('change', handleMediaChange);
    };
  }, [viewMode]);

  const handleContinueOnMobile = useCallback(() => {
    saveMobileNoticeChoice('lite');
    document.documentElement.setAttribute('data-tier', 'lite');
    setIsLite(true);
    setDeviceTier('low');
    setIsMobileNoticeOpen(false);
  }, []);

  // Signal data-verify-ready="true" once initial mount/animations settle for Playwright live check
  useEffect(() => {
    document.documentElement.setAttribute('data-verify-ready', 'false');
    const timer = window.setTimeout(() => {
      document.documentElement.setAttribute('data-verify-ready', 'true');
    }, 350);
    return () => window.clearTimeout(timer);
  }, [viewMode, landingDone]);

  const handleFpsUpdate = useCallback((fps: number, tier: 'high' | 'medium' | 'low') => {
    setMeasuredFps(fps);
    setDeviceTier(tier);
  }, []);

  // Check static PDF availability in public/ (strictly checks application/pdf)
  useEffect(() => {
    fetch('/Bajandi_FS1_Portfolio.pdf', { method: 'HEAD' })
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/pdf')) {
          setIsPdfAvailable(true);
        } else {
          setIsPdfAvailable(false);
        }
      })
      .catch(() => setIsPdfAvailable(false));
  }, []);

  // Ctrl/Cmd+K shortcut for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveToolModal((prev) => (prev === 'search' ? null : 'search'));
      } else if (e.key === 'Escape' && activeToolModal) {
        setActiveToolModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeToolModal]);

  // Path-based routing for /print
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/print') {
        setViewMode('print');
      } else {
        setViewMode('digital');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenPrint = () => {
    if (window.location.pathname !== '/print') {
      window.history.pushState({}, '', '/print');
    }
    setViewMode('print');
    window.scrollTo(0, 0);
  };

  const handleReturnToDigital = () => {
    if (window.location.pathname === '/print') {
      window.history.pushState({}, '', '/');
    }
    setViewMode('digital');
    window.scrollTo(0, 0);
  };

  // Lenis smooth scroll inertia (disabled on /print, lite tier, and under prefers-reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (viewMode === 'print') {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Track active episode via IntersectionObserver (zero scroll-thrash)
    const episodeElements = document.querySelectorAll<HTMLElement>('[data-episode]');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const epNum = entry.target.getAttribute('data-episode');
            if (epNum) setActiveEpisode(epNum);
          }
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: 0.05 }
    );
    episodeElements.forEach((el) => io.observe(el));

    // Track active front-matter plate via IntersectionObserver
    const frontMatterIds = [
      'acknowledgements',
      'front-matter-toc',
      'introduction',
      'prayer',
      'philosophy',
      'cv',
      'institutional-vmgo',
      'deped-mandates',
    ];
    const frontMatterElements = frontMatterIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const fmIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            setActiveFrontMatter(entry.target.id);
          }
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: 0.05 }
    );
    frontMatterElements.forEach((el) => fmIo.observe(el));

    // Switch TopBar navigation mode at #episodes-transition
    const updateNavModeOnScroll = () => {
      const transitionEl = document.getElementById('episodes-transition');
      if (!transitionEl) return;
      const rect = transitionEl.getBoundingClientRect();
      const thresholdY = window.innerHeight * 0.45;
      setNavMode(rect.top <= thresholdY ? 'episodes' : 'front-matter');
    };
    updateNavModeOnScroll();
    window.addEventListener('scroll', updateNavModeOnScroll, { passive: true });

    if (prefersReducedMotion || isLite || isMobileNoticeOpen) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return () => {
        io.disconnect();
        fmIo.disconnect();
        window.removeEventListener('scroll', updateNavModeOnScroll);
      };
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      fmIo.disconnect();
      window.removeEventListener('scroll', updateNavModeOnScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [viewMode, isLite, isMobileNoticeOpen]);

  const scrollToTarget = (targetId: string) => {
    const cleanId = targetId.replace(/^#/, '');
    if (cleanId === 'table-of-contents-trigger') {
      setIsContentsOpen(true);
      return;
    }
    const el = document.getElementById(cleanId);
    if (!el) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -80, duration: 1.0 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }

    if (window.history.pushState) {
      window.history.pushState(null, '', `#${cleanId}`);
    }
  };

  useEffect(() => {
    if (viewMode === 'print') return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        scrollToTarget(href.substring(1));
      }
    };

    const handleHashChange = () => {
      if (window.location.hash && window.location.hash.length > 1) {
        scrollToTarget(window.location.hash.substring(1));
      }
    };

    if (window.location.hash && window.location.hash.length > 1) {
      window.setTimeout(() => {
        scrollToTarget(window.location.hash.substring(1));
      }, 100);
    }

    document.addEventListener('click', handleAnchorClick);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [viewMode]);

  const handleSelectEpisode = (epNum: string) => {
    setNavMode('episodes');
    setActiveEpisode(epNum);
    scrollToTarget(`ep-${epNum}`);
  };

  const handleSelectFrontMatter = (targetId: string) => {
    setNavMode('front-matter');
    setActiveFrontMatter(targetId);
    scrollToTarget(targetId);
  };

  const handleDownloadPdf = () => {
    if (!isPdfAvailable) return;
    const link = document.createElement('a');
    link.href = '/Bajandi_FS1_Portfolio.pdf';
    link.download = 'Bajandi_FS1_Portfolio.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Class Program MatrixTable definition for Act IV
  const classProgramTable = {
    id: 'table-class-program',
    title: 'Cooperating teacher class program',
    description: 'Schedule of observed English sessions and consultation periods [pending full class program scan].',
    columns: [
      { key: 'time', label: 'Time slot', width: '25%' },
      { key: 'gradeSection', label: 'Section / group', width: '25%' },
      { key: 'subject', label: 'Subject area', width: '25%' },
      { key: 'focus', label: 'Observed instructional focus', width: '25%' },
    ],
    rows: appendicesData.classProgram.map((item) => ({
      time: item.time,
      gradeSection: item.gradeSection,
      subject: item.subject,
      focus: item.focus,
      status: item.status,
    })),
  };

  if (viewMode === 'print') {
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center surface-chalk text-scale-14">
            Loading A4 print edition...
          </div>
        }
      >
        <PrintEdition onBackToDigital={handleReturnToDigital} />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen surface-chalkboard relative">
      <LandingExperience
        onComplete={() => setLandingDone(true)}
        isCompleted={landingDone}
      />

      {/* Persistent Desktop Top Bar (Contents, Front-Matter / Chips 01-06, Search, Tools menu, Download PDF) */}
      <TopBar
        onOpenContents={() => setIsContentsOpen(true)}
        activeEpisode={activeEpisode}
        onSelectEpisode={handleSelectEpisode}
        navMode={navMode}
        activeFrontMatter={activeFrontMatter}
        onSelectFrontMatter={handleSelectFrontMatter}
        onOpenSearch={() => setActiveToolModal('search')}
        isRedPenActive={isRedPenActive}
        onToggleRedPen={() => setIsRedPenActive(!isRedPenActive)}
        onOpenUnderTheHood={() => setActiveToolModal('underthehood')}
        onOpenPrint={handleOpenPrint}
        isPdfAvailable={isPdfAvailable}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Mobile Fixed Bottom Bar */}
      <MobileBottomBar
        onOpenContents={() => setIsContentsOpen(true)}
        activeEpisode={activeEpisode}
        onSelectEpisode={handleSelectEpisode}
        onDownloadPdf={handleDownloadPdf}
        isPdfAvailable={isPdfAvailable}
      />

      {/* Full-Screen Chalkboard Table of Contents Overlay */}
      <TableOfContents
        isOpen={isContentsOpen}
        onClose={() => setIsContentsOpen(false)}
        onNavigate={scrollToTarget}
        onOpenPrint={handleOpenPrint}
      />

      {/* Red-Pen Mode Active Banner (Full IntersectionObserver overlay arrives in Phase B) */}
      {isRedPenActive && (
        <div
          role="region"
          aria-label="Red-Pen Mode status"
          className="fixed bottom-[var(--space-24)] right-[var(--space-24)] z-50 p-[var(--space-16)] surface-card border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] max-w-sm space-y-[var(--space-8)] no-print"
        >
          <div className="flex items-center justify-between gap-[var(--space-12)]">
            <span className="font-mono-tech font-semibold text-scale-14 text-[var(--color-ink)]">
              Red-Pen Mode active
            </span>
            <button
              type="button"
              onClick={() => setIsRedPenActive(false)}
              aria-label="Close Red-Pen Mode"
              className="p-[var(--space-4)] text-[var(--color-ink)] hover:bg-[var(--color-chalk)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="font-mono-tech text-scale-12 text-[var(--color-chalk-muted)]">
            Component metadata attributes (`data-redpen-component`, `data-redpen-tokens`) are wired across all Phase A elements. Full SVG red-pen grading strokes and computed AA badges unlock in Phase B.
          </p>
        </div>
      )}

      {/* Search / Under the Hood Modal (Functional navigation & live FPS in Phase A) */}
      {activeToolModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeToolModal === 'search' ? 'Quick jump search' : 'Under the hood telemetry'}
          className="fixed inset-0 z-50 surface-chalkboard/90 flex items-center justify-center p-[var(--space-24)] no-print"
          onClick={() => setActiveToolModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl surface-card p-[var(--space-24)] sm:p-[var(--space-32)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-24)]"
          >
            <div className="flex items-center justify-between border-b-2 border-[var(--color-ink)] pb-[var(--space-12)]">
              <h2 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
                {activeToolModal === 'search' ? 'Jump to episode or section' : 'Under the hood telemetry'}
              </h2>
              <Button variant="secondary" onClick={() => setActiveToolModal(null)}>
                Close
              </Button>
            </div>

            {activeToolModal === 'search' ? (
              <div className="space-y-[var(--space-12)]">
                <p className="text-scale-14 text-[var(--color-chalk-muted)]">
                  Select an episode or section to jump directly (full combobox filtering completes in Phase B):
                </p>
                <div className="grid grid-cols-1 gap-[var(--space-8)] max-h-80 overflow-y-auto">
                  {episodesData.map((ep) => {
                    const epId = getEpisodeId(ep);
                    const pending = isStatusPending(getEpisodeStatus(ep), epId);
                    if (shouldHidePending() && pending) return null;
                    return (
                      <a
                        key={epId}
                        href={`#${epId}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveToolModal(null);
                          scrollToTarget(epId);
                        }}
                        className="p-[var(--space-12)] shape-index-card-plain hover:bg-[var(--color-chalk)] flex items-center justify-between text-scale-14 font-semibold"
                      >
                        <span>Episode {ep.number}: {ep.title}</span>
                        {pending && (
                          <span className="text-scale-12 text-[var(--color-chalk-muted)]">pending</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-[var(--space-16)] font-mono-tech text-scale-14 text-[var(--color-ink)]">
                <div className="grid grid-cols-2 gap-[var(--space-16)]">
                  <div className="p-[var(--space-16)] bg-[var(--color-chalk)] border border-[var(--color-ink)]">
                    <span className="text-scale-12 text-[var(--color-chalk-muted)] block">Measured frame rate</span>
                    <span className="text-scale-28 font-bold">{measuredFps} FPS</span>
                  </div>
                  <div className="p-[var(--space-16)] bg-[var(--color-chalk)] border border-[var(--color-ink)]">
                    <span className="text-scale-12 text-[var(--color-chalk-muted)] block">Detected device tier</span>
                    <span className="text-scale-28 font-bold">{deviceTier}</span>
                  </div>
                </div>
                <p className="text-scale-12 text-[var(--color-chalk-muted)]">
                  Single WebGL canvas (DPR capped at 1.5, off-screen IntersectionObserver pause) + Lenis smooth scroll loop. Full bundle metrics and pipeline inspector arrive in Phase B.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <MobileNotice
        isOpen={isMobileNoticeOpen}
        onContinue={handleContinueOnMobile}
      />

      {/* ============================================================== */}
      {/* CHALK-DUST SHADER HERO (Signature Moment #1)                   */}
      {/* ============================================================== */}
      <LandingHero
        onStartEpisode01={() => scrollToTarget('act-1')}
        onJumpToEpisode02={() => scrollToTarget('ep-02')}
        onFpsUpdate={handleFpsUpdate}
        isReady={!isMobileNoticeOpen}
        isLite={isLite}
      />

      {/* Main Content Container */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-[var(--space-16)] sm:px-[var(--space-24)] py-[var(--space-48)] space-y-[var(--space-80)]"
      >
        {/* ============================================================== */}
        {/* ACT I: OPENING (Light Chalk Reading Surface)                   */}
        {/* ============================================================== */}
        <section
          id="act-1"
          data-redpen-component="ActIOpening"
          data-redpen-tokens="--color-chalk, --color-ink, --space-48"
          className="surface-chalk p-[var(--space-24)] sm:p-[var(--space-48)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-48)]"
        >
          <header className="border-b-2 border-[var(--color-ink)] pb-[var(--space-16)] space-y-[var(--space-4)]">
            <p className="text-scale-14 font-semibold text-[var(--color-notebook)]">
              Act I · Opening
            </p>
            <h2 className="font-display font-extrabold text-scale-64 text-[var(--color-ink)]">
              Title page and acknowledgement
            </h2>
          </header>

          {/* Formal Dark-Stage Title Page */}
          <TitlePage />

          {/* Acknowledgement (Ceremonial Plate i) */}
          <div className="space-y-[var(--space-16)]">
            <AcknowledgementPlate folio="i" />
            <div className="max-w-4xl mx-auto">
              <BackToContents className="pt-[var(--space-8)]" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* ACT II: FOUNDATIONS                                            */}
        {/* ============================================================== */}
        <section
          id="act-2"
          data-redpen-component="ActIIFoundations"
          data-redpen-tokens="--color-chalk, --color-ink, --color-construction, --space-48"
          className="surface-chalk p-[var(--space-24)] sm:p-[var(--space-48)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-48)]"
        >
          <header className="border-b-2 border-[var(--color-ink)] pb-[var(--space-16)] space-y-[var(--space-4)]">
            <p className="text-scale-14 font-semibold text-[var(--color-construction)]">
              Act II · Foundations
            </p>
            <h2 className="font-display font-extrabold text-scale-64 text-[var(--color-ink)]">
              Course foundations and educational philosophy
            </h2>
          </header>

          {/* Remaining Ceremonial Front-Matter Plates (folios ii–viii) */}
          <FrontMatterPlates onNavigate={scrollToTarget} />

          <div className="max-w-4xl mx-auto">
            <BackToContents className="pt-[var(--space-8)]" />
          </div>
        </section>

        {/* ============================================================== */}
        {/* TRANSITION: CEREMONIAL PLATES -> EPISODE 01                    */}
        {/* ============================================================== */}
        <EpisodesTransition onSkipToEpisodes={() => scrollToTarget('ep-01')} />

        {/* ============================================================== */}
        {/* ACT III: THE FIELD (EPISODES 01 THROUGH 06)                     */}
        {/* ============================================================== */}
        <section id="act-3" className="space-y-[var(--space-48)]">
          <header className="border-b-2 border-[var(--color-border-dark)] pb-[var(--space-16)] space-y-[var(--space-8)]">
            <p className="text-scale-14 font-semibold text-[var(--color-highlighter)]">
              Act III · The field
            </p>
            <h2 className="font-display font-extrabold text-scale-64 text-[var(--color-chalk)]">
              Classroom observations: Learning episodes 01–06
            </h2>
            <p className="text-scale-20 text-[var(--color-chalk-faint)] reading-measure">
              Six observational episodes documenting secondary English instruction under the mentorship of Mr. Herson N. Alamo, Teacher VI.
            </p>
          </header>

          {/* School Site and Classroom Rules */}
          <div
            id="school-site"
            className="surface-chalk p-[var(--space-24)] sm:p-[var(--space-32)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-16)]"
          >
            <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
              School site, classroom setting, and observation norms
            </h3>
            <p className="text-scale-17 text-[var(--color-ink)] reading-measure">
              {appendicesData.schoolSite.description}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-12)] text-scale-14 text-[var(--color-ink)]">
              {appendicesData.schoolSite.rulesAndRegulations.map((rule, idx) => (
                <li key={idx} className="p-[var(--space-16)] shape-index-card-plain">
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Episodes 01 through 06 */}
          <div className="space-y-[var(--space-48)]">
            {episodesData.map((episode) => (
              <EpisodeChapter key={getEpisodeId(episode)} episode={episode} />
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* ACT IV: EVIDENCE (APPENDICES)                                  */}
        {/* ============================================================== */}
        <section
          id="act-4"
          data-redpen-component="ActIVEvidence"
          data-redpen-tokens="--color-chalk, --color-ink, --space-48"
          className="surface-chalk p-[var(--space-24)] sm:p-[var(--space-48)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-48)]"
        >
          <header className="border-b-2 border-[var(--color-ink)] pb-[var(--space-16)] space-y-[var(--space-4)]">
            <p className="text-scale-14 font-semibold text-[var(--color-notebook)]">
              Act IV · Evidence and appendices
            </p>
            <h2 className="font-display font-extrabold text-scale-64 text-[var(--color-ink)]">
              Documentary evidence and records
            </h2>
          </header>

          {/* Resource Teacher Profile */}
          <div id="resource-teacher-profile" className="p-[var(--space-24)] sm:p-[var(--space-32)] shape-index-card space-y-[var(--space-16)]">
            <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
              Resource teacher profile: {appendicesData.resourceTeacher.name}
            </h3>
            <p className="text-scale-20 font-semibold text-[var(--color-chalk-muted)]">
              {appendicesData.resourceTeacher.designation} · {appendicesData.resourceTeacher.subjectArea} · {appendicesData.resourceTeacher.school}
            </p>
            <p className="text-scale-17 text-[var(--color-ink)] reading-measure">
              {appendicesData.resourceTeacher.biographicalNote}
            </p>
          </div>

          {/* Class Program rendered via MatrixTable */}
          <div id="class-program" className="space-y-[var(--space-20)]">
            <MatrixTable table={classProgramTable} />
            <div className="p-[var(--space-20)] bg-[var(--color-chalk-surface)] border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-12)]">
              <div className="flex flex-wrap items-center justify-between gap-[var(--space-8)] pb-[var(--space-8)] border-b border-[var(--color-border-light)]">
                <div>
                  <span className="font-mono text-scale-12 font-bold uppercase text-[var(--color-chalk-muted)] block">
                    Official Teaching Schedule & Weekly Class Program
                  </span>
                  <span className="font-display font-bold text-scale-17 text-[var(--color-ink)]">
                    Dr. Herson N. Alamo · English 8 Teaching Loads
                  </span>
                </div>
                <span className="font-mono text-scale-12 px-2.5 py-1 bg-[var(--color-highlighter)] text-[var(--color-ink)] font-bold border border-[var(--color-ink)]">
                  Cooperating Teacher Schedule
                </span>
              </div>
              <div className="overflow-x-auto bg-white p-[var(--space-12)] border border-[var(--color-border-light)]">
                <img
                  src="/assets/aistudio/class_schedule_42cb8c25.svg"
                  alt="Teacher's Schedule: Herson N. Alamo, PhD, English 8"
                  className="w-full h-auto max-h-[620px] object-contain mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Photographic & Documentary Evidence Gallery */}
          {(appendicesData.documentation?.groups || []).some((g) => g.photos.length > 0) && (
            <div id="evidence-gallery" className="space-y-[var(--space-24)]">
              <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
                {appendicesData.documentation.title}
              </h3>
              {(appendicesData.documentation?.groups || [])
                .filter((group) => group.photos.length > 0)
                .map((group) => (
                  <div key={group.id} className="space-y-[var(--space-16)]">
                    <h4 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                      {group.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-24)]">
                      {group.photos.map((photo) => (
                        <PhotoFrame
                          key={photo.id}
                          src={resolveAppendixPhotoSrc(photo.file)}
                          caption=""
                          alt={photo.alt}
                          shape="plain"
                          treatment="none"
                          assetSlotLabel={photo.file}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Original Episode Worksheets Registry */}
          <div id="worksheets-archive" className="space-y-[var(--space-16)]">
            <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
              Original learning episode worksheets (PDF)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-16)]">
              {episodesData.map((ep) => {
                const epId = getEpisodeId(ep);
                const pending = isStatusPending(getEpisodeStatus(ep), epId);
                if (shouldHidePending() && pending) return null;
                const hasPdf = Boolean(ep.worksheetPdf && ep.worksheetPdf.trim().length > 0);
                return (
                  <div
                    key={epId}
                    className="p-[var(--space-24)] shape-ticket-stub flex flex-col justify-between gap-[var(--space-16)]"
                  >
                    <div className="space-y-[var(--space-4)]">
                      <p className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                        Episode {ep.number}: {ep.title}
                      </p>
                      <p className="text-scale-14 text-[var(--color-chalk-muted)]">
                        {!pending ? 'Coursework draft populated' : 'Worksheet slot'}
                      </p>
                    </div>
                    {hasPdf ? (
                      <Button
                        variant="primary"
                        href={ep.worksheetPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={16} aria-hidden="true" />
                        <span>View original worksheet</span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled
                        aria-disabled="true"
                      >
                        <FileText size={16} aria-hidden="true" />
                        <span>Worksheet PDF coming soon</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Time Record & Clearance */}
          <div className="space-y-[var(--space-24)]">
            <div id="dtr" className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-16)]">
              <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
                {appendicesData.dtr.title || 'Daily Time Record'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-24)]">
                {(appendicesData.dtr.pages || []).map((page) => {
                  const pageSrc = resolveAppendixPhotoSrc(page.file);
                  if (!pageSrc) return null;
                  return (
                    <div key={page.id} className="space-y-[var(--space-12)]">
                      <h4 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                        {page.label}
                      </h4>
                      <div className="p-[var(--space-12)] shape-index-card-plain">
                        <a
                          href={pageSrc}
                          target="_blank"
                          rel="noopener"
                          className="block"
                        >
                          <img
                            src={pageSrc}
                            alt={page.alt}
                            loading="lazy"
                            className="w-full h-auto block"
                          />
                        </a>
                      </div>
                      <div>
                        <a
                          href={pageSrc}
                          target="_blank"
                          rel="noopener"
                          className="inline-block text-scale-14 font-semibold text-[var(--color-ink)] underline underline-offset-4"
                        >
                          Open full size
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="clearance" className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-12)]">
              <h3 className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
                {appendicesData.clearance.title || 'Clearance'}
              </h3>
              {resolveAppendixPhotoSrc(appendicesData.clearance.file) && (
                <div className="space-y-[var(--space-12)]">
                  <div className="p-[var(--space-12)] shape-index-card-plain">
                    <a
                      href={resolveAppendixPhotoSrc(appendicesData.clearance.file)}
                      target="_blank"
                      rel="noopener"
                      className="block"
                    >
                      <img
                        src={resolveAppendixPhotoSrc(appendicesData.clearance.file)}
                        alt={appendicesData.clearance.alt || 'Clearance'}
                        loading="lazy"
                        className="w-full h-auto block"
                      />
                    </a>
                  </div>
                  <div>
                    <a
                      href={resolveAppendixPhotoSrc(appendicesData.clearance.file)}
                      target="_blank"
                      rel="noopener"
                      className="inline-block text-scale-14 font-semibold text-[var(--color-ink)] underline underline-offset-4"
                    >
                      Open full size
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Closing Print Edition & PDF Export Callout */}
          <div className="p-[var(--space-32)] surface-chalkboard border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-16)]">
            <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
              Download the print edition (PDF)
            </h3>
            <p className="text-scale-17 text-[var(--color-chalk-faint)] reading-measure">
              The print edition renders this exact content source into a static A4 document with all answer blocks expanded and links preserved.
            </p>
            <div className="flex flex-wrap items-center gap-[var(--space-16)] pt-[var(--space-8)]">
              <Button
                variant="primary-highlighter"
                onClick={handleDownloadPdf}
                disabled={!isPdfAvailable}
                disabledReason="PDF available after export (run npm run pdf or use Open print edition)"
              >
                <Download size={16} aria-hidden="true" />
                <span>Download PDF</span>
              </Button>
              <Button variant="secondary-dark" onClick={handleOpenPrint}>
                <Printer size={16} aria-hidden="true" />
                <span>Open print edition (/print)</span>
              </Button>
            </div>
          </div>

          <BackToContents />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[var(--color-border-dark)] py-[var(--space-32)] px-[var(--space-24)] text-center text-scale-14 text-[var(--color-chalk-faint)] mb-[var(--space-48)] md:mb-0 no-print">
        <div className="flex items-center justify-center gap-[var(--space-16)] mb-[var(--space-16)]">
          <div className="rounded-full bg-[var(--color-chalk)] p-1.5 inline-flex items-center justify-center">
            <img
              src={buLogoSrc}
              alt="Bicol University logo"
              width={48}
              height={48}
              className="w-12 h-12 min-w-[48px] min-h-[48px] object-contain"
            />
          </div>
          <div className="rounded-full bg-[var(--color-chalk)] p-1.5 inline-flex items-center justify-center">
            <img
              src={buceLogoSrc}
              alt="Bicol University College of Education logo"
              width={48}
              height={48}
              className="w-12 h-12 min-w-[48px] min-h-[48px] object-contain"
            />
          </div>
        </div>
        <p className="font-semibold text-[var(--color-chalk)]">
          The Observer’s Edition · Field Study 1 Portfolio · Bicol University College of Education
        </p>
        <p>
          Francois Joshua L. Bajandi, BSEd English IV · Mentored by Herson N. Alamo, Teacher VI
        </p>
      </footer>
    </div>
  );
}
