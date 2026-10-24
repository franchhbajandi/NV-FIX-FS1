import React, { useEffect, useState } from 'react';

interface SectionColorMorphProps {
  onThemeChange?: (isLight: boolean) => void;
}

/**
 * Stacked fixed backdrop layers cross-fading via opacity.
 * Avoids any animated `background-color` repaint properties to guarantee 60fps.
 * Flips document text/theme state at the crossfade midpoint.
 */
export const SectionColorMorph: React.FC<SectionColorMorphProps> = ({ onThemeChange }) => {
  const [lightOpacity, setLightOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Find all sections designated as light reading spreads
      const lightSections = document.querySelectorAll('[data-bg="light"]');
      if (lightSections.length === 0) return;

      const viewportCenter = window.innerHeight / 2;
      let inLightSection = false;

      lightSections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          inLightSection = true;
        }
      });

      const targetOpacity = inLightSection ? 1 : 0;
      setLightOpacity(targetOpacity);

      if (onThemeChange) {
        onThemeChange(inLightSection);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [onThemeChange]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden no-print"
    >
      {/* Base Layer: Near-black #0B0B10 */}
      <div className="absolute inset-0 bg-[#0B0B10]" />

      {/* Cross-fade Layer: Crisp Cool-White #F5F6F8 (Opacity only) */}
      <div
        className="absolute inset-0 bg-[#F5F6F8] transition-opacity duration-700 ease-in-out will-change-[opacity]"
        style={{ opacity: lightOpacity }}
      />
    </div>
  );
};
