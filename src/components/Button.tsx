import React, { useState } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'primary-highlighter' | 'secondary' | 'secondary-dark' | 'ghost';
  isLoading?: boolean;
  disabledReason?: string;
  href?: string;
  download?: string | boolean;
  target?: string;
  rel?: string;
  redpenName?: string;
}

interface ChalkPuff {
  id: number;
  dx: number;
  dy: number;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  disabled = false,
  disabledReason,
  href,
  download,
  target,
  rel,
  children,
  className = '',
  onClick,
  redpenName = 'Button',
  ...rest
}) => {
  const [puffs, setPuffs] = useState<ChalkPuff[]>([]);

  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'primary-highlighter'
      ? 'btn-primary-highlighter'
      : variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'secondary-dark'
      ? 'btn-secondary-dark'
      : 'btn-ghost';

  const triggerChalkPuff = () => {
    if (variant !== 'primary' && variant !== 'primary-highlighter') return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const newPuffs: ChalkPuff[] = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.4;
      const dist = 16 + Math.random() * 14;
      return {
        id: Date.now() + i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
      };
    });
    setPuffs(newPuffs);
    window.setTimeout(() => setPuffs([]), 320);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }
    triggerChalkPuff();
    onClick?.(e);
  };

  const isDisabled = disabled || isLoading;

  if (href && !isDisabled) {
    return (
      <a
        href={href}
        download={download}
        target={target}
        rel={rel}
        onClick={() => triggerChalkPuff()}
        data-redpen-component={redpenName}
        data-redpen-tokens="--color-notebook, --shadow-hard, --dur-fast"
        className={`btn-base ${variantClass} ${isLoading ? 'btn-loading' : ''} ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-[var(--space-4)]">
      <button
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        onClick={handleClick}
        data-redpen-component={redpenName}
        data-redpen-tokens="--color-notebook, --color-highlighter, --shadow-hard, --dur-fast"
        className={`btn-base ${variantClass} ${isLoading ? 'btn-loading' : ''} ${className}`}
        {...rest}
      >
        <span>{isLoading ? 'Loading...' : children}</span>

        {/* Subtle chalk-puff particle burst on primary button press */}
        {puffs.length > 0 && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
            {puffs.map((p) => (
              <span
                key={p.id}
                style={{
                  transform: `translate(${p.dx}px, ${p.dy}px) scale(0.2)`,
                  opacity: 0,
                  transition: 'transform var(--dur-base) var(--ease-classroom), opacity var(--dur-base) var(--ease-classroom)',
                }}
                className="w-[var(--space-8)] h-[var(--space-8)] rounded-full bg-[var(--color-chalk)]"
              />
            ))}
          </span>
        )}
      </button>

      {/* Disabled state explicit reason text (Section 5 requirement) */}
      {disabled && disabledReason && (
        <span className="text-scale-12 text-[var(--color-chalk-muted)]">
          {disabledReason}
        </span>
      )}
    </span>
  );
};
