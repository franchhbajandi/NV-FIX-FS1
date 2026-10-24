import React, { useState, useId } from 'react';
import { Button } from './Button';
import { PullQuote } from './PullQuote';
import { EmphasizedText } from './EmphasizedText';
import { splitParagraphs, stripInlineAsteriskEmphasis } from '../data/contentIntake';
import { DeliveredTeacherInterviewProfile } from '../data/types';

/**
 * Renders double-asterisk spans (**like this**) as <strong>like this</strong>
 * and single-asterisk spans (*like this*) as <em>like this</em>
 * while preserving all underlying text verbatim (with asterisks removed).
 */
export function renderAsteriskEmphasis(text: string): React.ReactNode {
  if (!text || !text.includes('*')) return text;
  const regex = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={`strong-${match.index}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={`em-${match.index}`}>{match[2]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}

export interface AnswerBlockProps {
  id?: string;
  verifyId?: string;
  questionNumber?: number | string;
  prompt: string;
  answer: string;
  pullQuoteExcerpt?: string;
  forceExpanded?: boolean;
  quoteAttribution?: DeliveredTeacherInterviewProfile;
  renderText?: (text: string) => React.ReactNode;
}

export const AnswerBlock: React.FC<AnswerBlockProps> = ({
  id,
  verifyId,
  questionNumber,
  prompt,
  answer,
  pullQuoteExcerpt,
  forceExpanded = false,
  quoteAttribution,
  renderText,
}) => {
  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const generatedId = useId();
  const vId = verifyId || id;
  const contentId = id ? `${id}-answer` : `answer-${generatedId}`;
  const expanded = forceExpanded || isExpanded;
  const formatText = renderText || renderAsteriskEmphasis;
  const renderAnswerParagraph = (para: string) =>
    quoteAttribution ? (
      formatText(para)
    ) : (
      <EmphasizedText
        text={para}
        episode={vId || id}
        staticMode={forceExpanded}
        renderSegment={formatText}
      />
    );

  // Verify that the pull-quote is an exact substring of the answer
  const verifiedExcerpt =
    pullQuoteExcerpt &&
    (answer.includes(pullQuoteExcerpt) ||
      stripInlineAsteriskEmphasis(answer).includes(
        stripInlineAsteriskEmphasis(pullQuoteExcerpt)
      ))
      ? pullQuoteExcerpt
      : undefined;

  const paragraphs = splitParagraphs(answer);
  const teacherName =
    quoteAttribution?.resourceTeacher || quoteAttribution?.nameOfResourceTeacher;
  const attributionRole = quoteAttribution
    ? quoteAttribution.school
      ? `${quoteAttribution.gradeLevelSubject} · ${quoteAttribution.school}`
      : quoteAttribution.gradeLevelSubject
    : undefined;

  return (
    <div
      id={id}
      data-redpen-component="AnswerBlock"
      data-redpen-tokens="--color-chalk-surface, --color-ink, --text-20, --text-17, --dur-base"
      className="py-[var(--space-24)] border-b border-[var(--color-border-light)] last:border-b-0 break-inside-avoid"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-24)] items-start">
        {/* Pull-quote sits above answer on mobile, beside it in right column on desktop */}
        {verifiedExcerpt && (
          <div className="lg:col-span-5 lg:order-2">
            <PullQuote
              quote={verifiedExcerpt}
              verifyId={vId ? `${vId}-pullquote` : undefined}
              attribution={teacherName}
              role={attributionRole}
              context={quoteAttribution?.dateOfInterview}
            />
          </div>
        )}

        {/* Question and Answer column */}
        <div
          className={`${
            verifiedExcerpt ? 'lg:col-span-7 lg:order-1' : 'lg:col-span-12'
          } space-y-[var(--space-12)] reading-measure`}
        >
          <h4 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
            {questionNumber !== undefined && (
              <span className="tabular-nums mr-[var(--space-6)]">{questionNumber}.</span>
            )}
            <span data-verify-id={vId ? `${vId}-prompt` : undefined}>
              {formatText(prompt)}
            </span>
          </h4>

          <div
            className={`shape-index-card overflow-hidden ${
              quoteAttribution ? 'border-l-4 border-l-[var(--color-plum)]' : ''
            }`}
          >
            {/* Dedicated top header band with its own padding and single red header rule (never behind text) */}
            <div
              aria-hidden="true"
              className="h-[var(--space-16)] border-b-2 border-[var(--color-rule-red)] bg-[var(--color-chalk-surface)]"
            />

            {/* Card body with dedicated left margin gutter wider than the vertical red margin line */}
            <div className="grid grid-cols-[var(--space-24)_1fr] sm:grid-cols-[var(--space-32)_1fr]">
              <div
                aria-hidden="true"
                className="border-r border-[var(--color-rule-red)] bg-[var(--color-chalk-surface)] select-none pointer-events-none"
              />

              <div className="p-[var(--space-24)] space-y-[var(--space-16)] min-w-0">
                {/* 3-line preview when collapsed (hidden in print or when expanded) */}
                {!expanded && (
                  <div
                    aria-hidden="true"
                    data-verify-source={answer}
                    className={`answer-preview-fade text-scale-17 text-[var(--color-ink)] space-y-[var(--space-12)] ${
                      quoteAttribution
                        ? 'pl-[var(--space-16)] border-l-2 border-[var(--color-plum)] italic'
                        : ''
                    }`}
                  >
                    {paragraphs.map((para, pIdx) => (
                      <p key={pIdx}>{renderAnswerParagraph(para)}</p>
                    ))}
                  </div>
                )}

                {/* Full answer text always present in the DOM; animates via grid-template-rows */}
                <div
                  id={contentId}
                  data-expanded={expanded ? 'true' : 'false'}
                  className="answer-expander-grid"
                >
                  <div className="answer-expander-inner">
                    {quoteAttribution ? (
                      <blockquote className="pl-[var(--space-16)] border-l-2 border-[var(--color-plum)] space-y-[var(--space-12)]">
                        <div
                          data-verify-id={vId ? `${vId}-answer` : undefined}
                          data-verify-paragraphs={paragraphs.length}
                          className="text-scale-17 text-[var(--color-ink)] space-y-[var(--space-12)]"
                        >
                          {paragraphs.map((para, pIdx) => (
                            <React.Fragment key={pIdx}>
                              {pIdx > 0 && '\n\n'}
                              <p>{formatText(para)}</p>
                            </React.Fragment>
                          ))}
                        </div>
                      </blockquote>
                    ) : (
                      <div
                        data-verify-id={vId ? `${vId}-answer` : undefined}
                        data-verify-paragraphs={paragraphs.length}
                        className="text-scale-17 text-[var(--color-ink)] space-y-[var(--space-12)]"
                      >
                        {paragraphs.map((para, pIdx) => (
                          <React.Fragment key={pIdx}>
                            {pIdx > 0 && '\n\n'}
                            <p>{renderAnswerParagraph(para)}</p>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {quoteAttribution && (
                  <footer className="pt-[var(--space-8)] border-t border-[var(--color-border-light)] text-scale-12 font-mono text-[var(--color-chalk-muted)] flex flex-wrap items-center gap-x-[var(--space-8)] gap-y-[var(--space-4)]">
                    {teacherName && (
                      <>
                        <span className="font-semibold text-[var(--color-ink)]">
                          — {teacherName}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span>{quoteAttribution.gradeLevelSubject}</span>
                    {quoteAttribution.school && (
                      <>
                        <span>·</span>
                        <span>{quoteAttribution.school}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{quoteAttribution.dateOfInterview}</span>
                  </footer>
                )}

                {!forceExpanded && (
                  <div className="pt-[var(--space-4)] no-print">
                    <Button
                      variant="primary"
                      aria-expanded={expanded}
                      aria-controls={contentId}
                      onClick={() => setIsExpanded(!isExpanded)}
                      redpenName="Button (AnswerBlock expander)"
                    >
                      {expanded ? 'Show less' : 'Keep reading'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

