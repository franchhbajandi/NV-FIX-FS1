import React, { useEffect, useRef, useState } from 'react';

/**
 * Lightweight mouse-reactive gradient spotlight.
 * Adheres strictly to the 60fps compositor rule: moves a single oversized DOM element
 * using `transform: translate3d(x, y, 0)` rather than re-painting CSS gradient variables.
 * Automatically disabled on touch screens and under `prefers-reduced-motion`.
 */
export const MouseGradient: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Only enable on precise pointer devices (mouse) and when user does not request reduced motion
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    setIsEnabled(true);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const updatePosition = () => {
      // Smooth linear interpolation (lerp)
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (spotlightRef.current) {
        // Move element via hardware-accelerated transform: translate3d
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isEnabled) {
    // Static fallback: subtle ambient glow centered at top
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(36,71,255,0.08)_0%,transparent_70%)] blur-3xl opacity-60" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print"
    >
      {/* Single oversized spotlight element shifted via translate3d */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 -ml-[450px] -mt-[450px] w-[900px] h-[900px] rounded-full pointer-events-none will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(36, 71, 255, 0.14) 0%, rgba(232, 255, 58, 0.04) 35%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate3d(-1000px, -1000px, 0)',
        }}
      />
    </div>
  );
};
