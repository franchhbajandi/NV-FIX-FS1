import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

export const MOBILE_NOTICE_STORAGE_KEY = 'fs1_mobile_notice_choice';

export interface MobileNoticeProps {
  isOpen: boolean;
  onContinue: () => void;
}

export function isMobileOrCoarseViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return (
    window.matchMedia('(max-width: 820px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function getSavedMobileNoticeChoice(): 'lite' | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.sessionStorage.getItem(MOBILE_NOTICE_STORAGE_KEY);
    return val === 'lite' ? 'lite' : null;
  } catch {
    return null;
  }
}

export function saveMobileNoticeChoice(choice: 'lite'): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MOBILE_NOTICE_STORAGE_KEY, choice);
  } catch {
    // Ignore sessionStorage errors in restricted contexts
  }
}

export const MobileNotice: React.FC<MobileNoticeProps> = ({ isOpen, onContinue }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueBtnRef = useRef<HTMLButtonElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [showSelectFallback, setShowSelectFallback] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      continueBtnRef.current?.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onContinue();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onContinue]);

  useEffect(() => {
    if (showSelectFallback && fallbackInputRef.current) {
      fallbackInputRef.current.focus();
      fallbackInputRef.current.select();
      try {
        fallbackInputRef.current.setSelectionRange(0, shareUrl.length);
      } catch {
        // Ignore selection range errors on unsupported inputs
      }
    }
  }, [showSelectFallback, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const url = window.location.href;

    // 1. Primary: Async Clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        return;
      } catch {
        // Proceed to fallbacks
      }
    }

    // 2. Fallback A: Legacy execCommand('copy') with temporary/visible input selection
    try {
      const tempInput = document.createElement('input');
      tempInput.value = url;
      tempInput.setAttribute('readonly', '');
      tempInput.style.position = 'fixed';
      tempInput.style.top = '0';
      tempInput.style.left = '0';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      tempInput.setSelectionRange(0, url.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(tempInput);
      if (ok) {
        setCopied(true);
        return;
      }
    } catch {
      // Proceed to share-sheet or select-text fallback
    }

    // 3. Fallback B: Native Web Share Sheet or Select-Text input
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: document.title,
          url,
        });
        setCopied(true);
        return;
      } catch {
        // User cancelled or share failed; show select-text fallback
      }
    }

    setShowSelectFallback(true);
    setCopied(true);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-notice-heading"
      aria-describedby="mobile-notice-body"
      data-redpen-component="MobileNotice"
      className="fixed inset-0 z-50 surface-chalkboard/95 flex items-center justify-center p-[var(--space-24)] no-print"
    >
      <div className="w-full max-w-lg shape-index-card p-[var(--space-24)] sm:p-[var(--space-32)] space-y-[var(--space-24)]">
        <div className="space-y-[var(--space-12)]">
          <h2
            id="mobile-notice-heading"
            className="font-display font-extrabold text-scale-28 text-[var(--color-ink)]"
          >
            Best viewed on a computer
          </h2>
          <p
            id="mobile-notice-body"
            className="text-scale-17 text-[var(--color-ink)] reading-measure"
          >
            This portfolio uses scroll animations, 3D scenes and hover effects that work best on a desktop or laptop. You can still continue on your phone with a lighter version.
          </p>
        </div>

        {showSelectFallback && (
          <div className="space-y-[var(--space-4)]">
            <label
              htmlFor="mobile-notice-share-url"
              className="block text-scale-12 font-semibold text-[var(--color-chalk-muted)]"
            >
              Select and copy link:
            </label>
            <input
              ref={fallbackInputRef}
              id="mobile-notice-share-url"
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
              className="w-full p-[var(--space-8)] bg-[var(--color-chalk)] border-2 border-[var(--color-ink)] text-scale-14 text-[var(--color-ink)] font-mono"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[var(--space-12)]">
          <button
            ref={continueBtnRef}
            type="button"
            onClick={onContinue}
            className="btn-base btn-primary-highlighter"
          >
            Continue on mobile
          </button>

          <Button
            variant="secondary"
            onClick={handleCopyLink}
          >
            {copied ? 'Link copied' : 'Copy link to open on a computer'}
          </Button>
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {copied ? 'Link copied' : ''}
        </div>
      </div>
    </div>
  );
};
