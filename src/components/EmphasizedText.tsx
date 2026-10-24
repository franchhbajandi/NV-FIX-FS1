import React, { useEffect, useRef, useState } from 'react';
import emphasisRaw from '../content/emphasis.json';
import {
  rawEpisodes,
  isIgnoredKey,
  splitParagraphs,
  stripInlineAsteriskEmphasis,
} from '../data/contentIntake';
import { Episode, EpisodeQuestion } from '../data/types';

export type EmphasisStyle = 'highlight' | 'redpen' | 'circle' | 'bold';

export interface EmphasisPhraseEntry {
  text: string;
  style: EmphasisStyle;
}

const VALID_STYLES = new Set<EmphasisStyle>(['highlight', 'redpen', 'circle', 'bold']);

/**
 * Reads src/content/emphasis.json while ignoring all keys starting with `_` at any depth.
 */
export function loadEmphasisMap(): Record<string, EmphasisPhraseEntry[]> {
  const map: Record<string, EmphasisPhraseEntry[]> = {};
  if (!emphasisRaw || typeof emphasisRaw !== 'object') return map;

  for (const [epKey, val] of Object.entries(emphasisRaw as Record<string, unknown>)) {
    if (isIgnoredKey(epKey)) continue;
    if (!Array.isArray(val)) continue;

    const entries: EmphasisPhraseEntry[] = [];
    for (const rawItem of val) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const itemObj: Record<string, unknown> = {};
      for (const [ik, iv] of Object.entries(rawItem as Record<string, unknown>)) {
        if (isIgnoredKey(ik)) continue;
        itemObj[ik] = iv;
      }
      const text = typeof itemObj.text === 'string' ? itemObj.text : '';
      const style = itemObj.style as EmphasisStyle;
      if (text && !text.includes('\n') && VALID_STYLES.has(style)) {
        entries.push({ text, style });
      }
    }
    map[epKey] = entries;
  }

  return map;
}

export const emphasisByEpisode: Record<string, EmphasisPhraseEntry[]> = loadEmphasisMap();

/**
 * Normalizes an episode identifier (e.g. "02", "ep-02", "ep2", "episode-02", "ep-04-act1-q1")
 * to its key in emphasis.json ("episode-02", "episode-04", etc.).
 */
export function resolveEpisodeEmphasisKey(episodeOrVerifyId?: string): string | undefined {
  if (!episodeOrVerifyId) return undefined;
  const trimmed = episodeOrVerifyId.trim();
  if (emphasisByEpisode[trimmed]) return trimmed;

  const m = trimmed.match(/(?:episode-|ep-?)0?([1-6])\b/i) || trimmed.match(/^0?([1-6])$/);
  if (m) {
    return `episode-0${m[1]}`;
  }
  return undefined;
}

export function getEmphasisPhrases(episodeOrVerifyId?: string): EmphasisPhraseEntry[] {
  const resolved = resolveEpisodeEmphasisKey(episodeOrVerifyId);
  if (resolved) {
    return emphasisByEpisode[resolved] || [];
  }
  if (!episodeOrVerifyId) {
    return Object.values(emphasisByEpisode).flat();
  }
  return [];
}

/**
 * Collects all non-resource-teacher-quote answer strings (and Episode 01 credo paragraphs
 * and audience texts) for an episode so build-time verification can warn if any listed
 * phrase in emphasis.json is not found.
 */
function getNonQuoteEpisodeAnswers(ep: Episode): string[] {
  const answers: string[] = [];
  const pushQuestions = (list?: EpisodeQuestion[]) => {
    for (const q of list || []) {
      if (q.answer) answers.push(q.answer);
    }
  };

  pushQuestions(ep.questions);
  pushQuestions(ep.classroomQuestions);
  pushQuestions(ep.reflectSchool);
  pushQuestions(ep.psychosocialReflect);
  pushQuestions(ep.activity1?.questions);
  pushQuestions(ep.activity1?.interviewGuide?.questions);
  pushQuestions(ep.activity1?.answer?.questions);
  pushQuestions(ep.activity2?.classObservation?.questions);
  // Note: ep.activity2?.teacherInterview and ep.activity2?.rtInterview are resource-teacher quotes and intentionally excluded
  pushQuestions(ep.activity2?.answer?.questions);
  pushQuestions(ep.activity2?.activity2_1?.questions);
  pushQuestions(ep.activity2?.activity2_2?.questions);
  pushQuestions(ep.activity2?.activity2_3?.questions);
  pushQuestions(ep.activity3?.answer?.questions);
  pushQuestions(ep.reflectionQuestions?.questions);

  if (ep.task3?.credo?.sections) {
    for (const sec of ep.task3.credo.sections) {
      if (sec.paragraphs) {
        answers.push(...sec.paragraphs);
      }
      if (sec.audiences) {
        for (const aud of sec.audiences) {
          if (aud.text) answers.push(aud.text);
        }
      }
    }
  }

  if (ep.reflections?.answer) {
    answers.push(ep.reflections.answer);
  }
  if (ep.reflection?.text) {
    answers.push(ep.reflection.text);
  }

  return answers;
}

/**
 * Audits all phrases in src/content/emphasis.json against the non-quote answers
 * (and Episode 01 credo paragraphs and audience texts) in each episode, matching
 * against plain text after bold/italic markers are parsed. Returns warning messages
 * for any phrase that is not found within a single paragraph.
 */
export function collectMissingEmphasisWarnings(): string[] {
  const warnings: string[] = [];

  for (const [epKey, phrases] of Object.entries(emphasisByEpisode)) {
    const numMatch = epKey.match(/0?([1-6])$/);
    const epNum = numMatch ? `0${numMatch[1]}` : epKey;
    const ep = rawEpisodes.find((e) => e.number === epNum);

    if (!ep) {
      warnings.push(`src/content/emphasis.json -> Episode "${epKey}" not found in rawEpisodes`);
      continue;
    }

    const paragraphs = getNonQuoteEpisodeAnswers(ep)
      .flatMap((ans) => splitParagraphs(ans))
      .map((para) => stripInlineAsteriskEmphasis(para));

    for (const entry of phrases) {
      const targetPlain = stripInlineAsteriskEmphasis(entry.text);
      const found = paragraphs.some((para) => para.includes(targetPlain));
      if (!found) {
        warnings.push(
          `src/content/emphasis.json [${epKey}] (${entry.style}): phrase not found in non-quote answers -> "${entry.text}"`
        );
      }
    }
  }

  return warnings;
}

interface EmphasisSpanProps {
  styleType: EmphasisStyle;
  staticMode?: boolean;
  drawnOverride?: boolean;
  children: React.ReactNode;
}

const EmphasisSpan: React.FC<EmphasisSpanProps> = ({
  styleType,
  staticMode = false,
  drawnOverride,
  children,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState<boolean>(() => {
    if (staticMode) return true;
    if (typeof window === 'undefined') return true;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return true;
    }
    if (
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-tier') === 'lite'
    ) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (drawnOverride !== undefined) return;
    if (drawn || staticMode) return;
    const el = spanRef.current;
    if (!el || typeof window === 'undefined') return;

    if (
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      document.documentElement.getAttribute('data-tier') === 'lite'
    ) {
      setDrawn(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setDrawn(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.boundingClientRect.height > 0) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [drawn, staticMode, drawnOverride]);

  const isDrawn = staticMode || (drawnOverride !== undefined ? drawnOverride : drawn);

  return (
    <span
      ref={spanRef}
      data-emphasis={styleType}
      data-drawn={isDrawn ? 'true' : 'false'}
      className={`emphasis-span emphasis-${styleType}`}
    >
      {children}
    </span>
  );
};

export interface EmphasizedTextProps {
  text: string;
  episode?: string;
  staticMode?: boolean;
  revealProgress?: number;
  renderSegment?: (segment: string) => React.ReactNode;
}

interface MatchedSpan {
  start: number;
  end: number;
  text: string;
  style: EmphasisStyle;
}

interface ParsedInlineToken {
  kind: 'plain' | 'bold' | 'italic';
  text: string;
  start: number;
  end: number;
}

/**
 * Parses double-asterisk (**bold**) and single-asterisk (*italic*) markers first,
 * returning the plain text (markers removed) and inline formatting tokens mapped
 * to character offsets in that plain text.
 */
function parseBoldItalicTokens(rawText: string): {
  plainText: string;
  tokens: ParsedInlineToken[];
} {
  const tokens: ParsedInlineToken[] = [];
  const regex = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let lastIndex = 0;
  let plainCursor = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const seg = rawText.substring(lastIndex, match.index);
      tokens.push({
        kind: 'plain',
        text: seg,
        start: plainCursor,
        end: plainCursor + seg.length,
      });
      plainCursor += seg.length;
    }
    if (match[1] !== undefined) {
      const seg = match[1];
      tokens.push({
        kind: 'bold',
        text: seg,
        start: plainCursor,
        end: plainCursor + seg.length,
      });
      plainCursor += seg.length;
    } else if (match[2] !== undefined) {
      const seg = match[2];
      tokens.push({
        kind: 'italic',
        text: seg,
        start: plainCursor,
        end: plainCursor + seg.length,
      });
      plainCursor += seg.length;
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    const seg = rawText.substring(lastIndex);
    tokens.push({
      kind: 'plain',
      text: seg,
      start: plainCursor,
      end: plainCursor + seg.length,
    });
    plainCursor += seg.length;
  }

  return {
    plainText: tokens.map((t) => t.text).join(''),
    tokens,
  };
}

/**
 * EmphasizedText renderer:
 * Parses bold/italic markers first, then wraps exact matching substrings from
 * src/content/emphasis.json in styled <span> elements while preserving existing
 * bold and italic formatting. Never alters textContent, never overlaps spans,
 * and never crosses a paragraph break.
 */
export const EmphasizedText: React.FC<EmphasizedTextProps> = ({
  text,
  episode,
  staticMode = false,
  revealProgress,
  renderSegment,
}) => {
  if (!text) return null;

  const formatPlain = (seg: string): React.ReactNode =>
    renderSegment ? renderSegment(seg) : seg;

  // Never cross a paragraph break: if input contains paragraph breaks, process per paragraph
  if (text.includes('\n')) {
    const lines = text.split('\n');
    return (
      <>
        {lines.map((line, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && '\n'}
            <EmphasizedText
              text={line}
              episode={episode}
              staticMode={staticMode}
              revealProgress={revealProgress}
              renderSegment={renderSegment}
            />
          </React.Fragment>
        ))}
      </>
    );
  }

  const { plainText, tokens } = parseBoldItalicTokens(text);

  const renderTokenSlice = (
    sliceStart: number,
    sliceEnd: number,
    keyPrefix: string
  ): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    tokens.forEach((tok, tIdx) => {
      if (tok.end <= sliceStart || tok.start >= sliceEnd) return;
      const subStart = Math.max(0, sliceStart - tok.start);
      const subEnd = Math.min(tok.text.length, sliceEnd - tok.start);
      const subText = tok.text.slice(subStart, subEnd);
      if (!subText) return;

      const key = `${keyPrefix}-t${tIdx}-${subStart}`;
      if (tok.kind === 'bold') {
        parts.push(<strong key={key}>{formatPlain(subText)}</strong>);
      } else if (tok.kind === 'italic') {
        parts.push(<em key={key}>{formatPlain(subText)}</em>);
      } else {
        parts.push(<React.Fragment key={key}>{formatPlain(subText)}</React.Fragment>);
      }
    });
    return parts;
  };

  const phrases = getEmphasisPhrases(episode);
  if (phrases.length === 0) {
    return <>{renderTokenSlice(0, plainText.length, 'full')}</>;
  }

  // Find all candidate matches in this single paragraph's plain text (after bold/italic markers are parsed)
  const candidates: MatchedSpan[] = [];
  for (const entry of phrases) {
    const phrasePlain = stripInlineAsteriskEmphasis(entry.text);
    if (!phrasePlain || phrasePlain.includes('\n')) continue;
    let searchFrom = 0;
    while (searchFrom <= plainText.length - phrasePlain.length) {
      const idx = plainText.indexOf(phrasePlain, searchFrom);
      if (idx === -1) break;
      candidates.push({
        start: idx,
        end: idx + phrasePlain.length,
        text: phrasePlain,
        style: entry.style,
      });
      searchFrom = idx + phrasePlain.length;
    }
  }

  if (candidates.length === 0) {
    return <>{renderTokenSlice(0, plainText.length, 'full')}</>;
  }

  // Sort by start position ascending; if tied, prefer longer match; filter out overlaps
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);
  const nonOverlapping: MatchedSpan[] = [];
  let lastEnd = 0;
  for (const c of candidates) {
    if (c.start >= lastEnd) {
      nonOverlapping.push(c);
      lastEnd = c.end;
    }
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  nonOverlapping.forEach((m, i) => {
    if (m.start > cursor) {
      nodes.push(
        <React.Fragment key={`plain-${i}`}>
          {renderTokenSlice(cursor, m.start, `plain-${i}`)}
        </React.Fragment>
      );
    }
    const phraseThreshold =
      plainText.length > 0 ? (m.start / plainText.length) * 0.78 + 0.12 : 0.12;
    const drawnOverride =
      revealProgress !== undefined ? revealProgress >= phraseThreshold : undefined;

    nodes.push(
      <EmphasisSpan
        key={`emph-${i}-${m.start}`}
        styleType={m.style}
        staticMode={staticMode}
        drawnOverride={drawnOverride}
      >
        {renderTokenSlice(m.start, m.end, `emph-inner-${i}`)}
      </EmphasisSpan>
    );
    cursor = m.end;
  });

  if (cursor < plainText.length) {
    nodes.push(
      <React.Fragment key="plain-tail">
        {renderTokenSlice(cursor, plainText.length, 'plain-tail')}
      </React.Fragment>
    );
  }

  return <>{nodes}</>;
};

