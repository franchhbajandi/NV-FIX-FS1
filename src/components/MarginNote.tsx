import React, { useState } from 'react';

interface MarginNoteProps {
  id: string;
  anchorText: string;
  note: string;
  markType?: 'underline' | 'circle' | 'note';
}

export const MarginNote: React.FC<MarginNoteProps> = ({
  anchorText,
  note,
  markType = 'underline',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-block group">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="text-left font-inherit inline cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-red)] rounded-sm"
      >
        <span
          className={`border-b ${
            markType === 'underline'
              ? 'border-[var(--accent-red)] border-dashed'
              : 'border-[var(--accent-red)] border-dotted'
          }`}
        >
          {anchorText}
        </span>
        <sup className="text-[10px] font-mono text-[var(--accent-red)] ml-0.5 select-none font-semibold">
          *
        </sup>
      </button>

      {/* Desktop hover/focus tooltip / marginalia note */}
      <span
        className="hidden lg:block absolute left-full top-0 ml-6 w-56 text-[12px] font-mono leading-snug text-[var(--text-soft)] bg-[var(--bg-card)] border-l-2 border-[var(--accent-red)] p-2.5 shadow-sm opacity-90 transition-opacity pointer-events-auto"
      >
        <span className="block text-[10px] uppercase tracking-widest text-[var(--accent-red)] font-sans mb-1 font-semibold">
          Marginalia
        </span>
        {note}
      </span>

      {/* Mobile / Click popover */}
      {isOpen && (
        <span className="lg:hidden block mt-1 p-2 text-xs font-mono bg-[var(--bg-card)] border-l-2 border-[var(--accent-red)] text-[var(--text-soft)]">
          <span className="font-semibold text-[var(--accent-red)]">Note: </span>
          {note}
        </span>
      )}
    </span>
  );
};
