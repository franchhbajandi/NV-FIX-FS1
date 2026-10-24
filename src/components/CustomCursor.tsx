import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only activate for precise pointer devices (mice) and without reduced-motion preference
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinePointer || prefersReducedMotion) return;
    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Check hovered element for contextual action labels
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, [data-cursor], [data-episode]');
        if (interactive) {
          setIsHovered(true);
          const customLabel = interactive.getAttribute('data-cursor');
          if (customLabel) {
            setCursorText(customLabel);
          } else if (interactive.tagName.toLowerCase() === 'button') {
            setCursorText('Action');
          } else if (interactive.tagName.toLowerCase() === 'a') {
            setCursorText('Jump');
          } else if (interactive.hasAttribute('data-episode')) {
            setCursorText('Read');
          } else {
            setCursorText('');
          }
        } else {
          setIsHovered(false);
          setCursorText('');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let rafId: number;
    const updatePosition = () => {
      // Smooth lerp (linear interpolation)
      currentX += (mouseX - currentX) * 0.25;
      currentY += (mouseY - currentY) * 0.25;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      rafId = requestAnimationFrame(updatePosition);
    };
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color] duration-150 ease-out hidden md:block"
      style={{ willChange: 'transform' }}
    >
      <div
        className={`flex items-center justify-center rounded-full transition-all duration-150 ${
          isHovered
            ? 'w-10 h-10 bg-[#B3261E] text-white shadow-md'
            : 'w-4 h-4 bg-[#14110F]/60 border border-[#F2EBDD]/80 backdrop-blur-[1px]'
        }`}
      >
        {isHovered && cursorText && (
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider scale-90">
            {cursorText}
          </span>
        )}
      </div>
    </div>
  );
};
