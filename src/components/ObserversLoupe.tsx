import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ObserversLoupeProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const ObserversLoupe: React.FC<ObserversLoupeProps> = ({ isEnabled, onToggle }) => {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    if (isEnabled && !isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.body.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isEnabled, isVisible, isTouchDevice]);

  return (
    <>
      {/* Floating Loupe Controller Dock */}
      <div className="fixed bottom-6 right-6 z-40 no-print flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isEnabled ? "Disable Observer's Loupe" : "Enable Observer's Loupe"}
          className={`px-3 py-2 text-xs font-mono rounded-full border shadow-lg flex items-center gap-2 transition-all ${
            isEnabled
              ? 'bg-[var(--accent-red)] text-white border-transparent ring-2 ring-[var(--accent-red)]/30'
              : 'bg-[var(--bg-canvas)] text-[var(--text-soft)] border-[var(--border-rule)] hover:border-[var(--text-main)]'
          }`}
        >
          {isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="font-semibold tracking-wide">
            {isEnabled ? "Observer's Loupe: ON" : "Observer's Loupe"}
          </span>
          {isEnabled && !isTouchDevice && (
            <span className="text-[10px] opacity-75 hidden sm:inline">(Hover to reveal notes)</span>
          )}
        </button>
      </div>

      {/* Desktop Faux Lens Element (Rendered only if enabled and not on touch) */}
      {isEnabled && isVisible && !isTouchDevice && (
        <div
          className="fixed pointer-events-none z-50 transition-opacity duration-150"
          style={{
            transform: `translate3d(${pos.x - 70}px, ${pos.y - 70}px, 0)`,
            width: '140px',
            height: '140px',
          }}
          aria-hidden="true"
        >
          {/* Glass Lens Outer Brass Ring */}
          <div className="w-full h-full rounded-full border-2 border-[var(--accent-red)] shadow-2xl relative overflow-hidden bg-[var(--accent-red)]/[0.04]">
            {/* Subtle Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[var(--accent-red)]/30" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[var(--accent-red)]/30" />
            {/* Center target circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-[var(--accent-red)]/40" />
            {/* Loupe Stamp Label */}
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-widest uppercase text-[var(--accent-red)] font-bold select-none">
              LOUPE 2.5×
            </span>
          </div>
        </div>
      )}
    </>
  );
};
