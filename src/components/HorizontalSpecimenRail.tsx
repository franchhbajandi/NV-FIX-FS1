import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Bookmark, Compass } from 'lucide-react';
import { StampBadge } from './StampBadge';

interface SpecimenRailItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  colorClass: string;
  badge?: string;
  subtext: string;
}

const SPECIMENS: SpecimenRailItem[] = [
  {
    id: 'specimen-01',
    tag: 'SPECIMEN // 01 · PPST DOMAIN 1 & 4',
    title: 'Instructional Choreography',
    description: 'Systematic audit of teacher-led modeling, inverted pyramid lead structures, and tactile modifier syntax in secondary English classes.',
    colorClass: 'block-cobalt',
    badge: 'BENCHMARK ARCHIVE',
    subtext: 'ROOM 204 · GRADE 9 ENGLISH',
  },
  {
    id: 'specimen-02',
    tag: 'SPECIMEN // 02 · 7 CLO STRANDS',
    title: 'Physical & Social Environment',
    description: 'Classroom layout mapping, perimeter circulation pathways, and restorative disciplinary systems maximizing engaged learner time-on-task.',
    colorClass: 'block-acid',
    badge: '100% COMPLETE',
    subtext: '120 HOURS LOGGED',
  },
  {
    id: 'specimen-03',
    tag: 'SPECIMEN // 03 · ADOLESCENT PSYCHOLOGY',
    title: 'Learner Behavior & Affective Filters',
    description: 'Deciphering socio-emotional drivers of adolescent participation, positive reinforcement routines, and communicative vulnerability.',
    colorClass: 'block-vermilion',
    badge: 'PPST DOMAIN 3',
    subtext: 'EMPIRICAL LOG',
  },
  {
    id: 'specimen-04',
    tag: 'SPECIMEN // 04 · DEPED 4As DLL',
    title: 'Teaching-Learning Process (DLP)',
    description: 'Deconstructing lesson objectives, inductive inquiry phases, multimodal realia scaffolding, and formative comprehension checks.',
    colorClass: 'block-forest',
    badge: 'PRIMARY FOCUS',
    subtext: 'MR. HERSON N. ALAMO',
  },
  {
    id: 'specimen-05',
    tag: 'SPECIMEN // 05 · RESTORATIVE SYSTEMS',
    title: 'Classroom Management & Spatial Plan',
    description: 'Routines audit, bell-ringers, pair dyads, and teacher movement pacing vectors mapped in architectural schematics.',
    colorClass: 'block-plum',
    badge: 'FLOOR PLAN INCLUDED',
    subtext: 'SPATIAL ARCHITECTURE',
  },
];

export const HorizontalSpecimenRail: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scrollLeft();
    } else if (e.key === 'ArrowRight') {
      scrollRight();
    }
  };

  return (
    <div className="space-y-4 my-8">
      {/* Rail Control Ribbon */}
      <div className="flex items-center justify-between border-b-2 border-current/20 pb-2">
        <div className="flex items-center gap-2">
          <Compass size={15} className="text-[#E8FF3A]" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">
            EMPIRICAL SPECIMEN RAIL (01–05)
          </span>
          <span className="hidden sm:inline font-mono text-[10px] opacity-60">
            · Swipe or use arrow keys
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll specimens left"
            className="p-1.5 border border-current rounded-[2px] hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll specimens right"
            className="p-1.5 border border-current rounded-[2px] hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Snap-scroll rail container */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Horizontal Specimen Cards. Use arrow keys to navigate."
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth focus:outline-none focus:ring-1 focus:ring-[#E8FF3A]"
        style={{ scrollbarWidth: 'thin' }}
      >
        {SPECIMENS.map((specimen, idx) => (
          <div
            key={specimen.id}
            className={`w-[290px] sm:w-[350px] shrink-0 snap-start p-6 border-2 border-[#F5F6F8] shadow-[5px_5px_0px_#F5F6F8] rounded-[2px] flex flex-col justify-between space-y-4 relative overflow-hidden transition-transform hover:-translate-y-1 ${specimen.colorClass}`}
          >
            {/* Halftone dot pattern overlay on Specimen 01 */}
            {idx === 0 && (
              <div className="absolute inset-0 bg-halftone opacity-20 pointer-events-none" />
            )}

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between border-b border-current/30 pb-1.5 font-mono text-[10px] tracking-wider uppercase font-bold">
                <span>{specimen.tag}</span>
                {specimen.badge && (
                  <span className="bg-[#0B0B10] text-[#E8FF3A] px-1.5 py-0.5 rounded-[1px]">
                    {specimen.badge}
                  </span>
                )}
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {specimen.title}
              </h3>

              <p className="font-sans text-xs sm:text-sm leading-relaxed opacity-95">
                {specimen.description}
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-current/30 flex items-center justify-between font-mono text-[10px] font-bold">
              <span>{specimen.subtext}</span>
              <StampBadge label="OBSERVED" color="ink" rotation="rotate-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
