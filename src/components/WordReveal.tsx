import React, { useEffect, useRef, useState } from 'react';

interface WordRevealProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delayMs?: number;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  className = '',
  wordClassName = '',
  delayMs = 40,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(reduced);
    if (reduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block overflow-hidden align-top mr-[0.25em] last:mr-0"
        >
          <span
            className={`inline-block transition-all duration-700 ease-out will-change-transform ${wordClassName}`}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 115%, 0)',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: `${index * delayMs}ms`,
                  }
            }
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};
