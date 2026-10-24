import React, { useEffect, useRef, useState } from 'react';

/**
 * VelocitySkewText:
 * Mutates headline skew directly on the DOM node ref inside a single rAF loop.
 * NEVER sets React state on scroll (guarantees 60fps).
 * Wrapped in an overflow-hidden container to prevent layout shifting.
 * Automatically disabled on touch devices and under prefers-reduced-motion.
 */
interface VelocitySkewTextProps {
  children: React.ReactNode;
  maxSkewDeg?: number;
  className?: string;
}

export const VelocitySkewText: React.FC<VelocitySkewTextProps> = ({
  children,
  maxSkewDeg = 6,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLite = document.documentElement.getAttribute('data-tier') === 'lite';
    if (isTouch || prefersReducedMotion || isLite) {
      if (textRef.current) textRef.current.style.transform = '';
      return;
    }

    let lastScrollY = window.scrollY;
    let targetSkew = 0;
    let currentSkew = 0;
    let rafId: number;

    const handleScroll = () => {
      if (document.documentElement.getAttribute('data-tier') === 'lite') return;
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Calculate velocity skew clamped between -maxSkewDeg and maxSkewDeg
      targetSkew = Math.max(-maxSkewDeg, Math.min(maxSkewDeg, delta * 0.12));
    };

    const updateLoop = () => {
      if (document.documentElement.getAttribute('data-tier') === 'lite') {
        if (textRef.current) textRef.current.style.transform = '';
        return;
      }
      // Smooth interpolation back to rest (0deg)
      currentSkew += (targetSkew - currentSkew) * 0.15;
      targetSkew *= 0.88; // decay velocity

      if (textRef.current) {
        textRef.current.style.transform = `skewX(${currentSkew.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [maxSkewDeg]);

  return (
    <div ref={containerRef} className="overflow-hidden inline-block">
      <div ref={textRef} className={`inline-block will-change-transform ${className}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * TiltCard:
 * Mutates 3D perspective tilt (rotateX, rotateY) directly via refs inside a single rAF loop.
 * NEVER sets React state on mousemove.
 * Disabled on touch screens and prefers-reduced-motion.
 */
interface TiltCardProps {
  children: React.ReactNode;
  maxTiltDeg?: number;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  maxTiltDeg = 6,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLite = document.documentElement.getAttribute('data-tier') === 'lite';
    if (isTouch || prefersReducedMotion || isLite || !cardRef.current) {
      if (cardRef.current) cardRef.current.style.transform = '';
      return;
    }

    const el = cardRef.current;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let isHovered = false;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (document.documentElement.getAttribute('data-tier') === 'lite') return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      targetRotateX = -normY * maxTiltDeg;
      targetRotateY = normX * maxTiltDeg;
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
      targetRotateX = 0;
      targetRotateY = 0;
    };

    const updateLoop = () => {
      if (document.documentElement.getAttribute('data-tier') === 'lite') {
        if (el) el.style.transform = '';
        return;
      }
      currentRotateX += (targetRotateX - currentRotateX) * 0.14;
      currentRotateY += (targetRotateY - currentRotateY) * 0.14;

      if (el) {
        el.style.transform = `perspective(800px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(updateLoop);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(updateLoop);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [maxTiltDeg]);

  return (
    <div
      ref={cardRef}
      className={`will-change-transform transition-[box-shadow] duration-200 ${className}`}
    >
      {children}
    </div>
  );
};
