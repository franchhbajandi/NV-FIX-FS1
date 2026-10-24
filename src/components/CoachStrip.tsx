import React, { useState, useEffect } from 'react';
import { X, Info, Compass } from 'lucide-react';

export const CoachStrip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch capability
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('fs1_coach_dismissed');
    if (!dismissed) {
      setIsVisible(true);

      // Auto fade after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('fs1_coach_dismissed', 'true');
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('fs1_coach_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto bg-[#14110F] text-[#F2EBDD] border-2 border-[#F2EBDD] shadow-[4px_4px_0px_#B3261E] px-4 py-2.5 rounded-[2px] flex items-center justify-between gap-4 font-mono text-xs select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 no-print"
    >
      <div className="flex items-center gap-2.5">
        <Compass size={15} className="text-[#FFE14D] shrink-0 animate-spin-slow" />
        <span className="text-[11px] sm:text-xs">
          {isTouch
            ? 'Scroll to observe · Tap episode chips (01–06) · Tap notes'
            : 'Scroll to observe · Click episode chips (01–06) · Hover notes for proofmarks'}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss navigation hint"
        className="p-1 hover:text-[#FFE14D] text-[#F2EBDD]/80 rounded-[1px] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
