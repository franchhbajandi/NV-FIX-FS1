import React, { useState } from 'react';
import { educationalPhilosophy } from '../data/philosophy';
import { PenUnderline } from './PenUnderline';

export const PhilosophySection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      id="philosophy"
      data-redpen-component="PhilosophySection"
      data-redpen-tokens="--color-chalkboard, --color-chalk, --color-red-pen, --text-40"
      className="p-[var(--space-24)] sm:p-[var(--space-48)] surface-chalkboard border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] space-y-[var(--space-32)] scroll-mt-28"
    >
      <div className="max-w-4xl mx-auto space-y-[var(--space-24)]">
        <div className="space-y-[var(--space-8)] border-b border-[var(--color-border-dark)] pb-[var(--space-16)]">
          <p className="text-scale-14 text-[var(--color-highlighter)] font-semibold">
            Act II centerpiece · Personal educational philosophy
          </p>
          <h3 className="font-display font-extrabold text-scale-40 text-[var(--color-chalk)]">
            {educationalPhilosophy.title}
          </h3>
          <p className="text-scale-20 text-[var(--color-chalk-faint)]">
            {educationalPhilosophy.subtitle}
          </p>
        </div>

        {/* Credo Sticky Note */}
        <div className="shape-sticky-note p-[var(--space-24)] space-y-[var(--space-8)]">
          <blockquote className="font-display font-bold text-scale-28 text-[var(--color-ink)]">
            “{educationalPhilosophy.credo}”
          </blockquote>
          <p className="text-scale-14 font-semibold text-[var(--color-ink)]">
            {educationalPhilosophy.author} · {educationalPhilosophy.date}
          </p>
        </div>

        {/* Five Pedagogical Theses with Self-Drawing Red-Pen Underlines */}
        <div className="space-y-[var(--space-16)]">
          {educationalPhilosophy.statements.map((stmt, idx) => {
            const isSelected = activeStep === idx;
            return (
              <button
                key={stmt.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                aria-pressed={isSelected}
                className={`w-full text-left p-[var(--space-24)] transition-colors border-2 ${
                  isSelected
                    ? 'surface-chalkboard-elevated border-[var(--color-highlighter)]'
                    : 'surface-chalkboard border-[var(--color-border-dark)] hover:border-[var(--color-chalk)]'
                }`}
              >
                <div className="space-y-[var(--space-8)] reading-measure">
                  <p className="text-scale-20 text-[var(--color-chalk)]">
                    <span>{stmt.lead}</span>
                    <PenUnderline>{stmt.emphasis}</PenUnderline>
                    <span>{stmt.rest}</span>
                  </p>
                  {stmt.annotation && (
                    <p className="text-scale-14 text-[var(--color-highlighter)] font-medium">
                      Note: {stmt.annotation}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-[var(--space-16)] border-t border-[var(--color-border-dark)] reading-measure">
          <p className="text-scale-17 text-[var(--color-chalk-faint)]">
            {educationalPhilosophy.closingReflection}
          </p>
        </div>
      </div>
    </section>
  );
};
