import React, { useEffect, useRef, useState } from 'react';

export interface PenUnderlineProps {
  children: React.ReactNode;
  className?: string;
}

export const PenUnderline: React.FC<PenUnderlineProps> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className={`relative inline ${className}`}>
      <span className="font-semibold">{children}</span>
      <svg
        className="w-full h-[var(--space-8)] pointer-events-none overflow-visible block -mt-[var(--space-4)]"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 1 5 Q 35 1, 65 5 T 99 4"
          fill="none"
          stroke="var(--color-red-pen)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="105"
          strokeDashoffset={drawn ? '0' : '105'}
          style={{
            transition: 'stroke-dashoffset var(--dur-slow) var(--ease-classroom)',
          }}
        />
      </svg>
    </span>
  );
};
