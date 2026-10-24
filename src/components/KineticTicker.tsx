import React, { useEffect, useRef } from 'react';

interface KineticTickerProps {
  scrollProgress?: number;
  className?: string;
}

export const KineticTicker: React.FC<KineticTickerProps> = ({ scrollProgress = 0, className = '' }) => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isVisible = true;
    let pos1 = 0;
    let pos2 = -200;
    let velocityMultiplier = 1;
    let lastScrollY = window.scrollY;
    let rafId: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );

    if (tickerRef.current) {
      observer.observe(tickerRef.current);
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      lastScrollY = currentScrollY;

      // Accelerate ticker with scroll velocity
      velocityMultiplier = Math.min(8, 1 + delta * 0.15);
    };

    const updateLoop = () => {
      if (isVisible) {
        // Base drift rate boosted by velocity multiplier
        pos1 -= 0.6 * velocityMultiplier;
        pos2 += 0.5 * velocityMultiplier;

        // Reset positions to loop seamlessly
        if (pos1 <= -1200) pos1 = 0;
        if (pos2 >= 0) pos2 = -1200;

        // Velocity decays back to 1 (idle drift)
        velocityMultiplier += (1 - velocityMultiplier) * 0.08;

        if (track1Ref.current) {
          track1Ref.current.style.transform = `translate3d(${pos1.toFixed(2)}px, 0, 0)`;
        }
        if (track2Ref.current) {
          track2Ref.current.style.transform = `translate3d(${pos2.toFixed(2)}px, 0, 0)`;
        }
      }

      rafId = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={tickerRef}
      className={`relative w-full overflow-hidden select-none pointer-events-none py-6 my-8 ${className}`}
      aria-hidden="true"
    >
      {/* Top Track: Leftward Drift */}
      <div
        ref={track1Ref}
        className="whitespace-nowrap will-change-transform flex gap-8 items-center"
      >
        <span className="font-display font-black text-[13vw] sm:text-[15vw] lg:text-[17vw] leading-[0.85] tracking-tighter text-[#F5F6F8]/10 uppercase">
          THE OBSERVER’S EDITION
        </span>
        <span className="font-display font-black text-[13vw] sm:text-[15vw] lg:text-[17vw] leading-[0.85] tracking-tighter text-[#2447FF]/25 uppercase">
          FIELD STUDY 1
        </span>
        <span className="font-display font-black text-[13vw] sm:text-[15vw] lg:text-[17vw] leading-[0.85] tracking-tighter text-[#E8FF3A]/20 uppercase">
          BICOL UNIVERSITY
        </span>
        <span className="font-display font-black text-[13vw] sm:text-[15vw] lg:text-[17vw] leading-[0.85] tracking-tighter text-[#F5F6F8]/10 uppercase">
          THE OBSERVER’S EDITION
        </span>
        <span className="font-display font-black text-[13vw] sm:text-[15vw] lg:text-[17vw] leading-[0.85] tracking-tighter text-[#2447FF]/25 uppercase">
          FIELD STUDY 1
        </span>
      </div>

      {/* Bottom Track: Rightward Counter-Drift */}
      <div
        ref={track2Ref}
        className="whitespace-nowrap will-change-transform flex gap-8 items-center -mt-4 sm:-mt-8"
      >
        <span className="font-accent italic text-[12vw] sm:text-[14vw] lg:text-[16vw] leading-[0.85] tracking-tight text-[#8E90A4]/15">
          pedagogical attentiveness
        </span>
        <span className="font-accent italic text-[12vw] sm:text-[14vw] lg:text-[16vw] leading-[0.85] tracking-tight text-[#FF3D1F]/20">
          actual school environment
        </span>
        <span className="font-accent italic text-[12vw] sm:text-[14vw] lg:text-[16vw] leading-[0.85] tracking-tight text-[#8E90A4]/15">
          classroom inquiry
        </span>
        <span className="font-accent italic text-[12vw] sm:text-[14vw] lg:text-[16vw] leading-[0.85] tracking-tight text-[#FF3D1F]/20">
          pedagogical attentiveness
        </span>
      </div>
    </div>
  );
};
