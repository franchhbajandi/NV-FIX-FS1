import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Enforce production PENDING-hiding behavior before importing components
process.env.VERIFY_HIDE_PENDING = 'true';

import App from '../src/App';
import { PrintEdition } from '../src/components/PrintEdition';
import {
  rawEpisodes,
  rawPhotos,
  rawEpisode02Photos,
  collectPendingChecklist,
  isStatusPending,
  getEpisodeId,
  getEpisodeStatus,
  normalizeVerbatimText,
  countWords,
  splitParagraphs,
  getQuestionPrompt,
  getQuestionPullquote,
  getQuestionId,
  getClassroomMatrixData,
  getSchoolFacilitiesData,
  getPsychosocialChecklistData,
  getPsychosocialItemText,
  isIgnoredKey,
  formatObservationStatusSymbol,
} from '../src/data/contentIntake';
import {
  collectMissingEmphasisWarnings,
  emphasisByEpisode,
} from '../src/components/EmphasizedText';
import { EpisodeQuestion } from '../src/data/types';

function sha256Short(text: string): string {
  return crypto
    .createHash('sha256')
    .update(normalizeVerbatimText(text), 'utf8')
    .digest('hex')
    .slice(0, 16);
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

interface ExtractedNode {
  text: string;
  paragraphCount: number;
  observedAttr?: string;
  statusAttr?: string;
  presentAttr?: string;
  hasVerifySourceAttr: boolean;
}

/**
 * Extracts a map of data-verify-id -> rendered textContent, <p> paragraph count,
 * data-verify-observed, data-verify-status, and data-verify-present from static HTML markup.
 * Never reads data-verify-source as verified text.
 */
function extractVerifiedNodes(markup: string): Map<string, ExtractedNode> {
  const map = new Map<string, ExtractedNode>();
  const tagRegex = /<([a-z0-9]+)\b([^>]*?\bdata-verify-id="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(markup)) !== null) {
    const attrs = match[2];
    const verifyId = match[3];
    const innerHtml = match[4];
    const text = normalizeVerbatimText(decodeHtmlEntities(innerHtml));
    const pMatches = innerHtml.match(/<p\b[^>]*>/gi);
    const paragraphCount = pMatches ? pMatches.length : text ? 1 : 0;
    const obsMatch = attrs.match(/\bdata-verify-observed="([^"]+)"/i);
    const statusMatch = attrs.match(/\bdata-verify-status="([^"]+)"/i);
    const presentMatch = attrs.match(/\bdata-verify-present="([^"]+)"/i);
    const hasVerifySourceAttr = /\bdata-verify-source=/i.test(attrs);

    map.set(verifyId, {
      text,
      paragraphCount,
      observedAttr: obsMatch ? obsMatch[1] : undefined,
      statusAttr: statusMatch ? statusMatch[1] : undefined,
      presentAttr: presentMatch ? presentMatch[1] : undefined,
      hasVerifySourceAttr,
    });
  }
  return map;
}

/**
 * Verifies Requirement 3: data-verify-source is allowed ONLY on aria-hidden="true" decorative layers.
 */
function findIllegalVerifySourceTags(markup: string): string[] {
  const violations: string[] = [];
  const tagRegex = /<([a-z0-9]+)\b([^>]*?\bdata-verify-source="[^"]*"[^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(markup)) !== null) {
    const fullOpenTag = match[0];
    const attrs = match[2];
    if (!/\baria-hidden="true"/i.test(attrs)) {
      violations.push(fullOpenTag.slice(0, 120));
    }
    if (/\bdata-verify-id=/i.test(attrs)) {
      violations.push(`Element has both data-verify-id and data-verify-source: ${fullOpenTag.slice(0, 120)}`);
    }
  }
  return violations;
}

/**
 * Recursively checks that no key starting with `_` or equal to `statusKey` survived content intake.
 */
function findLeakedIgnoredKeys(obj: unknown, currentPath = ''): string[] {
  const leaked: string[] = [];
  if (!obj || typeof obj !== 'object') return leaked;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      leaked.push(...findLeakedIgnoredKeys(item, `${currentPath}[${idx}]`));
    });
    return leaked;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const keyPath = currentPath ? `${currentPath}.${k}` : k;
    if (isIgnoredKey(k)) {
      leaked.push(keyPath);
    }
    leaked.push(...findLeakedIgnoredKeys(v, keyPath));
  }
  return leaked;
}

export interface VerificationRecord {
  id: string;
  kind:
    | 'Metadata'
    | 'ThemeQuote'
    | 'Question'
    | 'Answer'
    | 'PullQuote'
    | 'Facility'
    | 'Checklist'
    | 'TableCell'
    | 'IllustrationCaption'
    | 'Caption';
  sourceFile: string;
  sourceText: string;
  expectedParagraphs?: number;
  expectedObserved?: string;
  expectedStatus?: string;
  expectedPresent?: string;
  parentAnswerForPullquote?: string;
}

export function buildExpectedRecords(): VerificationRecord[] {
  const records: VerificationRecord[] = [];
  const illustratedKeys = new Set<string>();

  for (const ep of rawEpisodes) {
    const file = `src/content/episode-${ep.number}.json`;
    const epId = getEpisodeId(ep);
    const epStatus = getEpisodeStatus(ep);

    // Episodes marked status: PENDING in status-registry.json are hidden in production
    if (isStatusPending(epStatus, epId)) {
      continue;
    }

    // 1. Episode Metadata (only fields present in source JSON)
    if (ep.titleLines && ep.titleLines.length > 0) {
      ep.titleLines.forEach((line, lIdx) => {
        records.push({
          id: `${epId}-titleLine-${lIdx + 1}`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: line,
        });
      });
    } else {
      records.push({
        id: `${epId}-title`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.title,
      });
    }

    if (ep.school !== undefined) {
      records.push({
        id: `${epId}-school`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.school,
      });
    }

    if (ep.date !== undefined) {
      records.push({
        id: `${epId}-date`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.date,
      });
    }

    if (ep.timeObserved !== undefined) {
      records.push({
        id: `${epId}-timeObserved`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.timeObserved,
      });
    }

    if (ep.gradeSection !== undefined) {
      records.push({
        id: `${epId}-gradeSection`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.gradeSection,
      });
    }

    if (ep.gradeSections !== undefined) {
      records.push({
        id: `${epId}-gradeSections`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.gradeSections,
      });
    }

    if (ep.sectionsObserved !== undefined) {
      records.push({
        id: `${epId}-sectionsObserved`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.sectionsObserved,
      });
    }

    if (ep.resourceTeacher !== undefined) {
      records.push({
        id: `${epId}-resourceTeacher`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.resourceTeacher,
      });
    }

    if (ep.thesis !== undefined) {
      records.push({
        id: `${epId}-thesis`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.thesis,
      });
    }

    if (ep.keyFinding !== undefined) {
      records.push({
        id: `${epId}-keyFinding`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.keyFinding,
      });
    }

    if (ep.themeQuote !== undefined) {
      records.push({
        id: `${epId}-themeQuote`,
        kind: 'ThemeQuote',
        sourceFile: file,
        sourceText: ep.themeQuote,
      });
    }

    // Helper for Question & Reflection arrays
    const pushQuestionList = (
      list: EpisodeQuestion[] | undefined,
      prefix: string,
      pathPrefix: string
    ) => {
      for (let qIdx = 0; qIdx < (list || []).length; qIdx++) {
        const q = list![qIdx];
        const qPathKey = `${epId}.${pathPrefix}[${qIdx}]`;
        const qId = getQuestionId(ep.number, prefix, q, qIdx);
        if (isStatusPending(q.status, qPathKey) || isStatusPending(q.status, qId)) continue;

        const promptText = getQuestionPrompt(q);
        const pullquoteText = getQuestionPullquote(q);
        const expectedParas = splitParagraphs(q.answer).length;

        records.push({
          id: `${qId}-prompt`,
          kind: 'Question',
          sourceFile: file,
          sourceText: promptText,
        });

        records.push({
          id: `${qId}-answer`,
          kind: 'Answer',
          sourceFile: file,
          sourceText: q.answer,
          expectedParagraphs: expectedParas,
        });

        if (pullquoteText !== undefined && pullquoteText !== '') {
          records.push({
            id: `${qId}-pullquote`,
            kind: 'PullQuote',
            sourceFile: file,
            sourceText: pullquoteText,
            parentAnswerForPullquote: q.answer,
          });
        }
      }
    };

    pushQuestionList(ep.questions, 'q', 'questions');
    pushQuestionList(ep.classroomQuestions, 'cq', 'classroomQuestions');
    pushQuestionList(ep.reflectSchool, 'rs', 'reflectSchool');
    pushQuestionList(ep.psychosocialReflect, 'pr', 'psychosocialReflect');

    // Delivered Episode 02: classroomMatrix
    const cmData = getClassroomMatrixData(ep);
    if (cmData.title) {
      records.push({
        id: `${epId}-classroomMatrix-title`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: cmData.title,
      });
    }
    cmData.rows.forEach((row, rIdx) => {
      const rowId = `${epId}-cm-r${rIdx + 1}`;
      for (const [k, v] of Object.entries(row)) {
        if (
          k === 'id' ||
          k === 'photos' ||
          k === 'status' ||
          isIgnoredKey(k) ||
          typeof v !== 'string'
        ) {
          continue;
        }
        records.push({
          id: `${rowId}-${k}`,
          kind: 'TableCell',
          sourceFile: file,
          sourceText: v,
        });
      }
    });

    // Delivered Episode 02: schoolFacilities
    const sfData = getSchoolFacilitiesData(ep);
    if (sfData.title) {
      records.push({
        id: `${epId}-schoolFacilities-title`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: sfData.title,
      });
    }
    sfData.rows.forEach((fac, fIdx) => {
      const facId = `${epId}-fac-${fIdx + 1}`;
      records.push({
        id: `${facId}-facility`,
        kind: 'Facility',
        sourceFile: file,
        sourceText: fac.facility,
      });
      // Revision (1): Status cell renders real visible text ("Available" / "Not available") derived from status
      // while verifying raw status ("A" / "NA") via data-verify-status.
      records.push({
        id: `${facId}-status`,
        kind: 'Facility',
        sourceFile: file,
        sourceText: fac.status === 'A' ? 'Available' : 'Not available',
        expectedStatus: fac.status,
      });
      // Revision (1): Description cell stays empty ("") and verified when fac.description is empty.
      records.push({
        id: `${facId}-description`,
        kind: 'Facility',
        sourceFile: file,
        sourceText: fac.description,
      });
    });

    // Delivered Episode 02: psychosocialChecklist
    const psyData = getPsychosocialChecklistData(ep);
    if (psyData.title) {
      records.push({
        id: `${epId}-psychosocialChecklist-title`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: psyData.title,
      });
    }
    psyData.items.forEach((item, iIdx) => {
      const itemId = `${epId}-psy-${iIdx + 1}`;
      const itemText = getPsychosocialItemText(item);
      records.push({
        id: `${itemId}-text`,
        kind: 'Checklist',
        sourceFile: file,
        sourceText: itemText,
      });
      records.push({
        id: `${itemId}-observed`,
        kind: 'Checklist',
        sourceFile: file,
        sourceText: String(item.observed),
        expectedObserved: String(item.observed),
      });
    });

    // Delivered Episode 02: personalIllustration
    if (ep.personalIllustration) {
      const cleanIllKey = ep.personalIllustration.image.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '');
      illustratedKeys.add(cleanIllKey);
      if (ep.personalIllustration.format) {
        records.push({
          id: `${epId}-illustration-format`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.personalIllustration.format,
        });
      }
      records.push({
        id: `${epId}-illustration-caption`,
        kind: 'IllustrationCaption',
        sourceFile: file,
        sourceText: ep.personalIllustration.caption,
      });
    }

    // Delivered Episode 03, 04, & 05: activity1
    if (ep.activity1) {
      if (ep.activity1.title) {
        records.push({
          id: `${epId}-act1-title`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.activity1.title,
        });
      }

      if (ep.activity1.routinesTable) {
        (ep.activity1.routinesTable.columns || []).forEach((col) => {
          records.push({
            id: `${epId}-routinesTable-col-${col.key}`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: col.label,
          });
        });
        (ep.activity1.routinesTable.rows || []).forEach((row, rIdx) => {
          const rowPathKey = `${epId}.activity1.routinesTable.rows[${rIdx}]`;
          if (isStatusPending(undefined, rowPathKey)) return;
          records.push({
            id: `${rowPathKey}.routine`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: row.routine,
          });
          records.push({
            id: `${rowPathKey}.status`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: formatObservationStatusSymbol(row.status),
            expectedStatus: row.status,
          });
        });
      }

      if (ep.activity1.questions) {
        (ep.activity1.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity1.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act1-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      if (ep.activity1.learnersObserved) {
        if (ep.activity1.learnersObserved.title) {
          records.push({
            id: `${epId}-learnersObserved-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity1.learnersObserved.title,
          });
        }
        if (ep.activity1.learnersObserved.gradeSection) {
          records.push({
            id: `${epId}-learnersObserved-gradeSection`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity1.learnersObserved.gradeSection,
          });
        }
        (ep.activity1.learnersObserved.rows || []).forEach((learner, lIdx) => {
          const rowPathKey = `${epId}.activity1.learnersObserved.rows[${lIdx}]`;
          const lId = `${epId}-learner-${lIdx}`;
          if (isStatusPending(learner.status, rowPathKey)) {
            return;
          }
          records.push({
            id: `${lId}-code`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: learner.code,
          });
          records.push({
            id: `${lId}-group`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: learner.group,
          });
          if (learner.age !== undefined) {
            records.push({
              id: `${lId}-age`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: learner.age,
            });
          }
          if (learner.gender !== undefined) {
            records.push({
              id: `${lId}-gender`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: learner.gender,
            });
          }
          records.push({
            id: `${lId}-description`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: learner.description,
          });
        });
      }

      if (ep.activity1.interviewGuide) {
        if (ep.activity1.interviewGuide.title) {
          records.push({
            id: `${epId}-interviewGuide-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity1.interviewGuide.title,
          });
        }
        (ep.activity1.interviewGuide.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity1.interviewGuide.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act1-ig-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      if (ep.activity1.answer) {
        if (ep.activity1.answer.title) {
          records.push({
            id: `${epId}-act1-answer-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity1.answer.title,
          });
        }
        (ep.activity1.answer.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity1.answer.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act1-ans-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }
    }

    // Delivered Episode 03 & 04: activity2
    if (ep.activity2) {
      if (ep.activity2.note) {
        records.push({
          id: `${epId}-act2-note`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.activity2.note,
        });
      }
      if (ep.activity2.title) {
        records.push({
          id: `${epId}-act2-title`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.activity2.title,
        });
      }

      // Episode 04 Observation Sheet
      if (ep.activity2.observationSheet) {
        for (const key of [
          'nameOfTeacher',
          'school',
          'date',
          'sessions',
          'gradeLevel',
          'subjectArea',
        ]) {
          const rawField = ep.activity2.observationSheet[key];
          if (rawField === undefined || rawField === null) continue;
          const pathKey = `${epId}.activity2.observationSheet.${key}`;
          const inlineStatus =
            typeof rawField === 'object' && 'status' in rawField
              ? rawField.status
              : undefined;
          const val =
            typeof rawField === 'object' && 'value' in rawField
              ? String(rawField.value ?? '')
              : String(rawField);
          if (isStatusPending(inlineStatus, pathKey)) continue;
          records.push({
            id: `${epId}-obs-${key}`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: val,
          });
        }
      }

      // Episode 04 Activity 2-1
      if (ep.activity2.activity2_1) {
        const a21 = ep.activity2.activity2_1;
        if (a21.title) {
          records.push({
            id: `${epId}-act2_1-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: a21.title,
          });
        }
        if (a21.methodsTable) {
          (a21.methodsTable.columns || []).forEach((col) => {
            records.push({
              id: `${epId}-methodsTable-col-${col.key}`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: col.label,
            });
          });
          (a21.methodsTable.rows || []).forEach((row, rIdx) => {
            const rowPathKey = `${epId}.activity2.activity2_1.methodsTable.rows[${rIdx}]`;
            if (isStatusPending(row.status, rowPathKey)) return;
            records.push({
              id: `${rowPathKey}.method`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.method,
            });
            records.push({
              id: `${rowPathKey}.description`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.description,
            });
          });
        }
        (a21.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.activity2_1.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act2_1-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      // Episode 04 Activity 2-2
      if (ep.activity2.activity2_2) {
        const a22 = ep.activity2.activity2_2;
        if (a22.title) {
          records.push({
            id: `${epId}-act2_2-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: a22.title,
          });
        }
        if (a22.materialsTable) {
          (a22.materialsTable.columns || []).forEach((col) => {
            records.push({
              id: `${epId}-materialsTable-col-${col.key}`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: col.label,
            });
          });
          (a22.materialsTable.rows || []).forEach((row, rIdx) => {
            const rowPathKey = `${epId}.activity2.activity2_2.materialsTable.rows[${rIdx}]`;
            if (isStatusPending(row.status, rowPathKey)) return;
            const isPresent = Boolean(row.present);
            records.push({
              id: `${rowPathKey}.material`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.material,
            });
            records.push({
              id: `${rowPathKey}.present`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: isPresent ? '✓' : '✕',
              expectedPresent: String(isPresent),
            });
            if (row.notes !== undefined) {
              records.push({
                id: `${rowPathKey}.notes`,
                kind: 'TableCell',
                sourceFile: file,
                sourceText: row.notes,
              });
            }
          });
        }
        (a22.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.activity2_2.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act2_2-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      // Episode 04 Activity 2-3
      if (ep.activity2.activity2_3) {
        const a23 = ep.activity2.activity2_3;
        if (a23.title) {
          records.push({
            id: `${epId}-act2_3-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: a23.title,
          });
        }
        (a23.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.activity2_3.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act2_3-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      if (ep.activity2.classObservation) {
        if (ep.activity2.classObservation.title) {
          records.push({
            id: `${epId}-classObservation-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity2.classObservation.title,
          });
        }
        if (ep.activity2.classObservation.guideTitle) {
          records.push({
            id: `${epId}-classObservation-guideTitle`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity2.classObservation.guideTitle,
          });
        }
        (ep.activity2.classObservation.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.classObservation.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act2-co-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      const ti = ep.activity2.teacherInterview;
      if (ti) {
        if (ti.title) {
          records.push({
            id: `${epId}-teacherInterview-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ti.title,
          });
        }
        if (ti.profile) {
          if (ti.profile.resourceTeacher) {
            records.push({
              id: `${epId}-ti-profile-resourceTeacher`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: ti.profile.resourceTeacher,
            });
          }
          if (ti.profile.school) {
            records.push({
              id: `${epId}-ti-profile-school`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: ti.profile.school,
            });
          }
          records.push({
            id: `${epId}-ti-profile-gradeLevelSubject`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ti.profile.gradeLevelSubject,
          });
          records.push({
            id: `${epId}-ti-profile-dateOfInterview`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ti.profile.dateOfInterview,
          });
        }

        (ti.parts || []).forEach((part, pIdx) => {
          if (part.heading) {
            records.push({
              id: `${epId}-ti-part-${pIdx + 1}-heading`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: part.heading,
            });
          }
          (part.questions || []).forEach((q, qIdx) => {
            const pathKey = `${epId}.activity2.teacherInterview.parts[${pIdx}].questions[${qIdx}]`;
            if (isStatusPending(q.status, pathKey)) return;
            const qId = `${epId}-act2-ti-p${pIdx + 1}-q${q.n ?? qIdx + 1}`;
            const promptText = getQuestionPrompt(q);
            const pullquoteText = getQuestionPullquote(q);
            records.push({
              id: `${qId}-prompt`,
              kind: 'Question',
              sourceFile: file,
              sourceText: promptText,
            });
            records.push({
              id: `${qId}-answer`,
              kind: 'Answer',
              sourceFile: file,
              sourceText: q.answer,
              expectedParagraphs: splitParagraphs(q.answer).length,
            });
            if (pullquoteText !== undefined && pullquoteText !== '') {
              records.push({
                id: `${qId}-pullquote`,
                kind: 'PullQuote',
                sourceFile: file,
                sourceText: pullquoteText,
                parentAnswerForPullquote: q.answer,
              });
            }
          });
        });

        if (ti.practicesTable) {
          if (ti.practicesTable.title) {
            records.push({
              id: `${epId}-practicesTable-title`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: ti.practicesTable.title,
            });
          }
          if (ti.practicesTable.instruction) {
            records.push({
              id: `${epId}-practicesTable-instruction`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: ti.practicesTable.instruction,
            });
          }
          (ti.practicesTable.columns || []).forEach((col) => {
            records.push({
              id: `${epId}-practicesTable-col-${col.key}`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: col.label,
            });
          });
          (ti.practicesTable.rows || []).forEach((row, rIdx) => {
            const rowPathKey = `${epId}.activity2.teacherInterview.practicesTable.rows[${rIdx}]`;
            if (isStatusPending(row.status, rowPathKey)) {
              return;
            }
            records.push({
              id: `${rowPathKey}.practice`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.practice,
            });
            records.push({
              id: `${rowPathKey}.illustration`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.illustration,
            });
          });
        }
      }

      // Episode 05 Activity 2: strategiesTable
      if (ep.activity2.strategiesTable) {
        (ep.activity2.strategiesTable.columns || []).forEach((col) => {
          records.push({
            id: `${epId}-strategiesTable-col-${col.key}`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: col.label,
          });
        });
        (ep.activity2.strategiesTable.rows || []).forEach((row, rIdx) => {
          const rowPathKey = `${epId}.activity2.strategiesTable.rows[${rIdx}]`;
          if (isStatusPending(undefined, rowPathKey)) return;
          records.push({
            id: `${rowPathKey}.strategy`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: row.strategy,
          });
          records.push({
            id: `${rowPathKey}.status`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: formatObservationStatusSymbol(row.status),
            expectedStatus: row.status,
          });
          if (row.remarks !== undefined && row.remarks !== '') {
            records.push({
              id: `${rowPathKey}.remarks`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.remarks,
            });
          }
        });
      }

      // Episode 05 Activity 2: rtInterview
      if (ep.activity2.rtInterview) {
        const rti = ep.activity2.rtInterview;
        if (rti.title) {
          records.push({
            id: `${epId}-rtInterview-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: rti.title,
          });
        }
        if (rti.profile) {
          for (const key of [
            'nameOfResourceTeacher',
            'gradeLevelSubject',
            'dateOfInterview',
            'yearsInService',
          ]) {
            const rawVal = (rti.profile as Record<string, unknown>)[key];
            if (rawVal === undefined || rawVal === null) continue;
            const pathKey = `${epId}.activity2.rtInterview.profile.${key}`;
            const inlineStatus =
              typeof rawVal === 'object' && rawVal !== null && 'status' in rawVal
                ? (rawVal as { status?: string }).status
                : undefined;
            const valStr =
              typeof rawVal === 'object' && rawVal !== null && 'value' in rawVal
                ? String((rawVal as { value?: string }).value ?? '')
                : String(rawVal);
            if (isStatusPending(inlineStatus, pathKey)) continue;
            records.push({
              id: `${epId}-rti-profile-${key}`,
              kind: 'Metadata',
              sourceFile: file,
              sourceText: valStr,
            });
          }
        }
        (rti.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.rtInterview.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act2-rti-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }

      if (ep.activity2.answer) {
        if (ep.activity2.answer.title) {
          records.push({
            id: `${epId}-act2-answer-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity2.answer.title,
          });
        }
        (ep.activity2.answer.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.answer.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act2-ans-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }
    }

    // Delivered Episode 05: activity3
    if (ep.activity3) {
      if (ep.activity3.title) {
        records.push({
          id: `${epId}-act3-title`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.activity3.title,
        });
      }
      if (ep.activity3.answer) {
        if (ep.activity3.answer.title) {
          records.push({
            id: `${epId}-act3-answer-title`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: ep.activity3.answer.title,
          });
        }
        (ep.activity3.answer.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity3.answer.questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) return;
          const qId = `${epId}-act3-ans-q${q.n ?? qIdx + 1}`;
          const promptText = getQuestionPrompt(q);
          const pullquoteText = getQuestionPullquote(q);
          records.push({
            id: `${qId}-prompt`,
            kind: 'Question',
            sourceFile: file,
            sourceText: promptText,
          });
          records.push({
            id: `${qId}-answer`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: q.answer,
            expectedParagraphs: splitParagraphs(q.answer).length,
          });
          if (pullquoteText !== undefined && pullquoteText !== '') {
            records.push({
              id: `${qId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: pullquoteText,
              parentAnswerForPullquote: q.answer,
            });
          }
        });
      }
    }

    // Delivered Episode 01: task1 & task3
    if (ep.task1) {
      records.push({
        id: `${epId}-task1-title`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.task1.title,
      });
      (ep.task1.levels || []).forEach((lvl, lvlIdx) => {
        records.push({
          id: `${epId}-task1-level-${lvlIdx + 1}-label`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: lvl.label,
        });
        records.push({
          id: `${epId}-task1-level-${lvlIdx + 1}-description`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: lvl.description,
        });
      });
      (ep.task1.domains || []).forEach((dom, domIdx) => {
        const domPrefix = `${epId}-task1-d${domIdx + 1}`;
        records.push({
          id: `${domPrefix}-heading`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: dom.heading,
        });
        (dom.indicators || []).forEach((ind, indIdx) => {
          const indPrefix = `${domPrefix}-ind${indIdx + 1}`;
          records.push({
            id: `${indPrefix}-text`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: ind.indicator,
          });
          records.push({
            id: `${indPrefix}-level`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: '✓',
            expectedStatus: ind.level,
          });
          (ind.evidence || []).forEach((ev, evIdx) => {
            if (ev.label) {
              records.push({
                id: `${indPrefix}-ev${evIdx + 1}-label`,
                kind: 'TableCell',
                sourceFile: file,
                sourceText: ev.label,
              });
            }
          });
        });
        records.push({
          id: `${domPrefix}-notYetAchieved`,
          kind: 'TableCell',
          sourceFile: file,
          sourceText: dom.notYetAchieved,
        });
        records.push({
          id: `${domPrefix}-remarks`,
          kind: 'TableCell',
          sourceFile: file,
          sourceText: dom.remarks,
        });
      });
    }

    if (ep.task3) {
      records.push({
        id: `${epId}-task3-title`,
        kind: 'Metadata',
        sourceFile: file,
        sourceText: ep.task3.title,
      });
      if (ep.task3.philosophiesTable) {
        (ep.task3.philosophiesTable.columns || []).forEach((col) => {
          records.push({
            id: `${epId}-task3-phil-col-${col.key}`,
            kind: 'Metadata',
            sourceFile: file,
            sourceText: col.label,
          });
        });
        (ep.task3.philosophiesTable.rows || []).forEach((row, rIdx) => {
          const rowId = `${epId}-task3-phil-r${rIdx + 1}`;
          if (row.category) {
            records.push({
              id: `${rowId}-category`,
              kind: 'TableCell',
              sourceFile: file,
              sourceText: row.category,
            });
          }
          records.push({
            id: `${rowId}-philosophy`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: row.philosophy,
          });
          records.push({
            id: `${rowId}-definition`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: row.definition,
          });
          records.push({
            id: `${rowId}-deped`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: row.deped,
          });
          records.push({
            id: `${rowId}-k12`,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: row.k12,
          });
        });
      }
      if (ep.task3.credo) {
        records.push({
          id: `${epId}-credo-title`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.task3.credo.title,
        });
        (ep.task3.credo.sections || []).forEach((sec, sIdx) => {
          const secId = `${epId}-credo-s${sIdx + 1}`;
          records.push({
            id: `${secId}-lead`,
            kind: 'Answer',
            sourceFile: file,
            sourceText: sec.lead,
          });
          (sec.paragraphs || []).forEach((para, pIdx) => {
            records.push({
              id: `${secId}-p${pIdx + 1}`,
              kind: 'Answer',
              sourceFile: file,
              sourceText: para,
            });
          });
          (sec.audiences || []).forEach((aud, aIdx) => {
            const audId = `${secId}-aud${aIdx + 1}`;
            records.push({
              id: `${audId}-label`,
              kind: 'Answer',
              sourceFile: file,
              sourceText: aud.label,
            });
            records.push({
              id: `${audId}-text`,
              kind: 'Answer',
              sourceFile: file,
              sourceText: aud.text,
            });
          });
          if (sec.pullquote) {
            const parentCombined = [
              sec.lead,
              ...(sec.paragraphs || []),
              ...(sec.audiences || []).map((a) => `${a.label} ${a.text}`),
            ].join(' ');
            records.push({
              id: `${secId}-pullquote`,
              kind: 'PullQuote',
              sourceFile: file,
              sourceText: sec.pullquote,
              parentAnswerForPullquote: parentCombined,
            });
          }
        });
      }
    }

    // Delivered Episode 04: reflections
    if (ep.reflections && !isStatusPending(ep.reflections.status, `${epId}.reflections`)) {
      if (ep.reflections.title) {
        records.push({
          id: `${epId}-reflections-title`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.reflections.title,
        });
      }
      records.push({
        id: `${epId}-reflections-prompt`,
        kind: 'Question',
        sourceFile: file,
        sourceText: ep.reflections.prompt,
      });
      records.push({
        id: `${epId}-reflections-answer`,
        kind: 'Answer',
        sourceFile: file,
        sourceText: ep.reflections.answer,
        expectedParagraphs: splitParagraphs(ep.reflections.answer).length,
      });
      if (ep.reflections.pullquote !== undefined && ep.reflections.pullquote !== '') {
        records.push({
          id: `${epId}-reflections-pullquote`,
          kind: 'PullQuote',
          sourceFile: file,
          sourceText: ep.reflections.pullquote,
          parentAnswerForPullquote: ep.reflections.answer,
        });
      }
    }

    // Delivered Episode 05: reflectionQuestions
    if (ep.reflectionQuestions) {
      if (ep.reflectionQuestions.title) {
        records.push({
          id: `${epId}-reflectionQuestions-title`,
          kind: 'Metadata',
          sourceFile: file,
          sourceText: ep.reflectionQuestions.title,
        });
      }
      (ep.reflectionQuestions.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.reflectionQuestions.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) return;
        const qId = `${epId}-ref-q${q.n ?? qIdx + 1}`;
        const promptText = getQuestionPrompt(q);
        const pullquoteText = getQuestionPullquote(q);
        records.push({
          id: `${qId}-prompt`,
          kind: 'Question',
          sourceFile: file,
          sourceText: promptText,
        });
        records.push({
          id: `${qId}-answer`,
          kind: 'Answer',
          sourceFile: file,
          sourceText: q.answer,
          expectedParagraphs: splitParagraphs(q.answer).length,
        });
        if (pullquoteText !== undefined && pullquoteText !== '') {
          records.push({
            id: `${qId}-pullquote`,
            kind: 'PullQuote',
            sourceFile: file,
            sourceText: pullquoteText,
            parentAnswerForPullquote: q.answer,
          });
        }
      });
    }

    // Standard Tables
    for (const tbl of ep.tables || []) {
      if (tbl.isPending || isStatusPending(tbl.status, tbl.id)) continue;
      tbl.rows.forEach((row, rIdx) => {
        const rowId = `${tbl.id}-r${rIdx}`;
        if (isStatusPending(String(row.status || ''), rowId)) return;
        for (const col of tbl.columns) {
          const cellId = `${tbl.id}-r${rIdx}-${col.key}`;
          const val = row[col.key];
          if (
            val === undefined ||
            val === null ||
            val === '' ||
            val === 'N/A' ||
            isStatusPending(String(val), cellId)
          ) {
            continue;
          }
          records.push({
            id: cellId,
            kind: 'TableCell',
            sourceFile: file,
            sourceText: String(val),
          });
        }
      });
    }

    // Standard Reflection
    if (ep.reflection && !isStatusPending(ep.reflection.status, `${epId}-reflection`)) {
      records.push({
        id: `${epId}-reflection-prompt`,
        kind: 'Question',
        sourceFile: file,
        sourceText: ep.reflection.prompt,
      });
      records.push({
        id: `${epId}-reflection-answer`,
        kind: 'Answer',
        sourceFile: file,
        sourceText: ep.reflection.text,
        expectedParagraphs: splitParagraphs(ep.reflection.text).length,
      });
    }
  }

  // Photo Captions in photos.json (only for non-pending episodes)
  for (const [rawKey, meta] of Object.entries(rawPhotos)) {
    if (isIgnoredKey(rawKey)) continue;
    const epMatch = rawKey.match(/^ep-?0?([1-6])-/i);
    if (epMatch) {
      const epNum = epMatch[1].padStart(2, '0');
      const epId = `ep-${epNum}`;
      if (isStatusPending(undefined, epId)) continue;
    }
    const verifyId = `photo-${rawKey}-caption`;
    if (isStatusPending(meta.status, `photos.${rawKey}`) || isStatusPending(meta.status, verifyId) || !meta.caption?.trim()) {
      continue;
    }
    records.push({
      id: verifyId,
      kind: 'Caption',
      sourceFile: 'src/assets/photos/photos.json',
      sourceText: meta.caption,
    });
  }

  // Photo Captions in photos-episode-02.json (only mood photos and facility/classroom/illustration photos rendered in DOM)
  rawEpisode02Photos.forEach((item, pIdx) => {
    const rawFile = item.id || item.file || item.fileMatch || '';
    const cleanKey = rawFile
      .replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-');
    if (illustratedKeys.has(cleanKey) || item.role === 'mood') {
      // Illustration verified via ep-02-illustration-caption; mood strip removed
      return;
    }
    const verifyId = `photo-${cleanKey}-caption`;
    const pathKey = `photos-ep-02[${pIdx}]`;
    if (isStatusPending(item.status, pathKey) || isStatusPending(item.status, verifyId)) return;
    records.push({
      id: verifyId,
      kind: 'Caption',
      sourceFile: 'src/content/photos-episode-02.json',
      sourceText: item.caption || '',
    });
  });

  return records;
}

function updateReadmePendingChecklist() {
  const readmePath = path.resolve('README.md');
  if (!fs.existsSync(readmePath)) return;

  const pendingItems = collectPendingChecklist();
  const lines: string[] = [
    '<!-- PENDING_CHECKLIST_START -->',
    `> Auto-generated by \`npm run verify-content\`. Total pending items tracked in \`src/content/status-registry.json\` and hidden in production: **${pendingItems.length}**.`,
    '',
    '| Status | Source File | Field ID | Category | Reason | Description |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
  ];

  for (const item of pendingItems) {
    lines.push(
      `| \`[ ] PENDING\` | \`${item.sourceFile}\` | \`${item.fieldId}\` | ${item.category} | \`${item.reason}\` | ${item.description} |`
    );
  }
  lines.push('<!-- PENDING_CHECKLIST_END -->');

  const block = lines.join('\n');
  const currentReadme = fs.readFileSync(readmePath, 'utf8');
  const startMarker = '<!-- PENDING_CHECKLIST_START -->';
  const endMarker = '<!-- PENDING_CHECKLIST_END -->';

  if (currentReadme.includes(startMarker) && currentReadme.includes(endMarker)) {
    const startIdx = currentReadme.indexOf(startMarker);
    const endIdx = currentReadme.indexOf(endMarker) + endMarker.length;
    const updated =
      currentReadme.slice(0, startIdx) + block + currentReadme.slice(endIdx);
    if (updated !== currentReadme) {
      fs.writeFileSync(readmePath, updated, 'utf8');
    }
  }
}

function main() {
  const strictEnv = process.env.VERIFY_STRICT;
  const isStrict = strictEnv === undefined ? true : strictEnv !== '0' && strictEnv !== 'false';

  console.log(
    `\n🔍 [verify-content] Running Content Intake Protocol v2 Check (VERIFY_STRICT=${
      isStrict ? '1' : '0'
    })...`
  );

  // 1. Report needsFaceCheck warnings (never fails build, even under VERIFY_STRICT=1)
  const faceCheckWarnings: string[] = [];
  for (const [k, meta] of Object.entries(rawPhotos)) {
    if (isIgnoredKey(k)) continue;
    if (meta.needsFaceCheck) {
      faceCheckWarnings.push(`src/assets/photos/photos.json -> ${k}`);
    }
  }
  for (const item of rawEpisode02Photos) {
    if (item.needsFaceCheck) {
      const label = item.file || item.fileMatch || item.id;
      faceCheckWarnings.push(
        `src/content/photos-episode-02.json -> ${label} (role: ${item.role || 'photo'})`
      );
    }
  }

  if (faceCheckWarnings.length > 0) {
    console.warn(
      `\n⚠️  [Privacy Reminder] ${faceCheckWarnings.length} photo(s) have needsFaceCheck: true (warning only, never fails build):`
    );
    for (const w of faceCheckWarnings) {
      console.warn(`   • ${w}`);
    }
  }

  // 1b. Warn at build if any listed phrase in src/content/emphasis.json is not found
  const missingEmphasisWarnings = collectMissingEmphasisWarnings();
  if (missingEmphasisWarnings.length > 0) {
    console.warn(
      `\n⚠️  [Emphasis Check] ${missingEmphasisWarnings.length} phrase(s) in src/content/emphasis.json were not found:`
    );
    for (const w of missingEmphasisWarnings) {
      console.warn(`   • ${w}`);
    }
  }

  // 2. Render (a) Digital DOM and (b) Print Edition DOM
  const digitalMarkup = renderToStaticMarkup(React.createElement(App));
  const printMarkup = renderToStaticMarkup(
    React.createElement(PrintEdition, { onBackToDigital: () => {} })
  );

  const digitalMap = extractVerifiedNodes(digitalMarkup);
  const printMap = extractVerifiedNodes(printMarkup);
  const expectedRecords = buildExpectedRecords();

  interface MismatchReport {
    id: string;
    kind: string;
    sourceFile: string;
    target: 'Source Invariant' | 'Digital DOM' | 'Print Edition';
    expectedWords: number;
    actualWords: number;
    expectedHash: string;
    actualHash: string;
    reason: string;
  }

  const mismatches: MismatchReport[] = [];

  // 2b. Verify Revision (2): No _-prefixed keys or statusKey survived content intake at any depth
  const leakedKeys = [
    ...findLeakedIgnoredKeys(rawEpisodes, 'rawEpisodes'),
    ...findLeakedIgnoredKeys(rawPhotos, 'rawPhotos'),
    ...findLeakedIgnoredKeys(rawEpisode02Photos, 'rawEpisode02Photos'),
    ...findLeakedIgnoredKeys(emphasisByEpisode, 'emphasisByEpisode'),
  ];
  for (const lk of leakedKeys) {
    mismatches.push({
      id: lk,
      kind: 'Metadata',
      sourceFile: 'src/data/contentIntake.ts',
      target: 'Source Invariant',
      expectedWords: 0,
      actualWords: 1,
      expectedHash: 'IGNORED',
      actualHash: 'LEAKED',
      reason: `Ignored key (_* or statusKey) survived content intake at ${lk}`,
    });
  }

  // 3. Check decorative data-verify-source usage
  for (const violation of findIllegalVerifySourceTags(digitalMarkup)) {
    mismatches.push({
      id: 'data-verify-source',
      kind: 'Metadata',
      sourceFile: 'Digital DOM',
      target: 'Digital DOM',
      expectedWords: 0,
      actualWords: 0,
      expectedHash: 'ARIA_HIDDEN_ONLY',
      actualHash: 'VIOLATION',
      reason: `data-verify-source used outside aria-hidden="true" layer: ${violation}`,
    });
  }

  for (const violation of findIllegalVerifySourceTags(printMarkup)) {
    mismatches.push({
      id: 'data-verify-source',
      kind: 'Metadata',
      sourceFile: 'Print Edition',
      target: 'Print Edition',
      expectedWords: 0,
      actualWords: 0,
      expectedHash: 'ARIA_HIDDEN_ONLY',
      actualHash: 'VIOLATION',
      reason: `data-verify-source used outside aria-hidden="true" layer: ${violation}`,
    });
  }

  // 4. Compare every expected record against (a) Digital DOM and (b) Print Edition
  for (const rec of expectedRecords) {
    const normSource = normalizeVerbatimText(rec.sourceText);
    const srcWords = countWords(normSource);
    const srcHash = sha256Short(normSource);

    // Pullquote exact substring invariant
    if (
      rec.kind === 'PullQuote' &&
      rec.parentAnswerForPullquote !== undefined &&
      !rec.parentAnswerForPullquote.includes(rec.sourceText)
    ) {
      mismatches.push({
        id: rec.id,
        kind: rec.kind,
        sourceFile: rec.sourceFile,
        target: 'Source Invariant',
        expectedWords: srcWords,
        actualWords: srcWords,
        expectedHash: srcHash,
        actualHash: 'NOT_SUBSTRING',
        reason: `Pullquote "${rec.sourceText}" is not an exact substring of its parent answer`,
      });
    }

    const verifyTarget = (
      targetName: 'Digital DOM' | 'Print Edition',
      nodeMap: Map<string, ExtractedNode>
    ) => {
      const node = nodeMap.get(rec.id);
      if (!node) {
        mismatches.push({
          id: rec.id,
          kind: rec.kind,
          sourceFile: rec.sourceFile,
          target: targetName,
          expectedWords: srcWords,
          actualWords: 0,
          expectedHash: srcHash,
          actualHash: 'MISSING',
          reason: `Missing data-verify-id="${rec.id}" node in rendered ${targetName}`,
        });
        return;
      }

      const domWords = countWords(node.text);
      const domHash = sha256Short(node.text);

      if (domWords !== srcWords || domHash !== srcHash) {
        mismatches.push({
          id: rec.id,
          kind: rec.kind,
          sourceFile: rec.sourceFile,
          target: targetName,
          expectedWords: srcWords,
          actualWords: domWords,
          expectedHash: srcHash,
          actualHash: domHash,
          reason: `Text/word-count mismatch (expected "${normSource.slice(0, 48)}", got "${node.text.slice(0, 48)}")`,
        });
      }

      if (
        rec.expectedParagraphs !== undefined &&
        node.paragraphCount !== rec.expectedParagraphs
      ) {
        mismatches.push({
          id: rec.id,
          kind: rec.kind,
          sourceFile: rec.sourceFile,
          target: targetName,
          expectedWords: srcWords,
          actualWords: domWords,
          expectedHash: `${rec.expectedParagraphs} paras`,
          actualHash: `${node.paragraphCount} paras`,
          reason: `Paragraph count mismatch on ${rec.id}: expected ${rec.expectedParagraphs}, rendered ${node.paragraphCount}`,
        });
      }

      if (
        rec.expectedObserved !== undefined &&
        node.observedAttr !== rec.expectedObserved
      ) {
        mismatches.push({
          id: rec.id,
          kind: rec.kind,
          sourceFile: rec.sourceFile,
          target: targetName,
          expectedWords: srcWords,
          actualWords: domWords,
          expectedHash: rec.expectedObserved,
          actualHash: String(node.observedAttr),
          reason: `Checklist observed flag mismatch on ${rec.id}: expected ${rec.expectedObserved}, got ${node.observedAttr}`,
        });
      }

      if (
        rec.expectedStatus !== undefined &&
        node.statusAttr !== rec.expectedStatus
      ) {
        mismatches.push({
          id: rec.id,
          kind: rec.kind,
          sourceFile: rec.sourceFile,
          target: targetName,
          expectedWords: srcWords,
          actualWords: domWords,
          expectedHash: rec.expectedStatus,
          actualHash: String(node.statusAttr),
          reason: `Facility data-verify-status mismatch on ${rec.id}: expected ${rec.expectedStatus}, got ${node.statusAttr}`,
        });
      }

      if (
        rec.expectedPresent !== undefined &&
        node.presentAttr !== rec.expectedPresent
      ) {
        mismatches.push({
          id: rec.id,
          kind: rec.kind,
          sourceFile: rec.sourceFile,
          target: targetName,
          expectedWords: srcWords,
          actualWords: domWords,
          expectedHash: rec.expectedPresent,
          actualHash: String(node.presentAttr),
          reason: `Materials data-verify-present mismatch on ${rec.id}: expected ${rec.expectedPresent}, got ${node.presentAttr}`,
        });
      }
    };

    verifyTarget('Digital DOM', digitalMap);
    verifyTarget('Print Edition', printMap);
  }

  // 5. Verify no PENDING items from status-registry.json leaked into production Digital or Print DOM
  const pendingItems = collectPendingChecklist();
  for (const p of pendingItems) {
    const checkIds: string[] =
      p.category === 'Episode' ? [p.fieldId, `${p.fieldId}-title`] : [p.fieldId];

    // Also map path/index keys to their corresponding DOM data-verify-id(s)
    const pracMatch = p.fieldId.match(
      /^(ep-\d+)\.activity2\.teacherInterview\.practicesTable\.rows\[(\d+)\]$/
    );
    if (pracMatch) {
      const epPrefix = pracMatch[1];
      const rowNum = Number(pracMatch[2]) + 1;
      checkIds.push(
        `${p.fieldId}.practice`,
        `${p.fieldId}.illustration`,
        `${epPrefix}-prac-r${rowNum}`,
        `${epPrefix}-prac-r${rowNum}-practice`,
        `${epPrefix}-prac-r${rowNum}-description`
      );
    }

    const obsMatch = p.fieldId.match(/^(ep-\d+)\.activity2\.observationSheet\.([a-zA-Z0-9_]+)$/);
    if (obsMatch) {
      checkIds.push(`${obsMatch[1]}-obs-${obsMatch[2]}`);
    }

    const rtiMatch = p.fieldId.match(
      /^(ep-\d+)\.activity2\.rtInterview\.profile\.([a-zA-Z0-9_]+)$/
    );
    if (rtiMatch) {
      checkIds.push(`${rtiMatch[1]}-rti-profile-${rtiMatch[2]}`);
    }

    for (const cid of checkIds) {
      if (digitalMap.has(cid)) {
        mismatches.push({
          id: cid,
          kind: p.category,
          sourceFile: p.sourceFile,
          target: 'Digital DOM',
          expectedWords: 0,
          actualWords: countWords(digitalMap.get(cid)?.text || ''),
          expectedHash: 'HIDDEN',
          actualHash: sha256Short(digitalMap.get(cid)?.text || ''),
          reason: `Item with ${p.reason} was not hidden in production Digital DOM`,
        });
      }
      if (printMap.has(cid)) {
        mismatches.push({
          id: cid,
          kind: p.category,
          sourceFile: p.sourceFile,
          target: 'Print Edition',
          expectedWords: 0,
          actualWords: countWords(printMap.get(cid)?.text || ''),
          expectedHash: 'HIDDEN',
          actualHash: sha256Short(printMap.get(cid)?.text || ''),
          reason: `Item with ${p.reason} was not hidden in production Print Edition`,
        });
      }
    }
  }

  // 6. Sync README.md Pending Checklist
  updateReadmePendingChecklist();

  // 7. Summary or Fail/Warn according to VERIFY_STRICT
  const metaCount = expectedRecords.filter(
    (r) => r.kind === 'Metadata' || r.kind === 'ThemeQuote'
  ).length;
  const qCount = expectedRecords.filter((r) => r.kind === 'Question').length;
  const aCount = expectedRecords.filter((r) => r.kind === 'Answer').length;
  const pqCount = expectedRecords.filter((r) => r.kind === 'PullQuote').length;
  const facCount = expectedRecords.filter((r) => r.kind === 'Facility').length;
  const chkCount = expectedRecords.filter((r) => r.kind === 'Checklist').length;
  const cellCount = expectedRecords.filter((r) => r.kind === 'TableCell').length;
  const capCount = expectedRecords.filter(
    (r) => r.kind === 'Caption' || r.kind === 'IllustrationCaption'
  ).length;

  if (mismatches.length > 0) {
    const header = isStrict
      ? `\n❌ [verify-content] FAILED with ${mismatches.length} mismatch(es):\n`
      : `\n⚠️  [verify-content] WARNING (${mismatches.length} mismatch(es) in non-strict dev mode):\n`;
    console.error(header);
    for (const m of mismatches) {
      console.error(
        `  • [${m.target}] ${m.kind} (${m.id}) in ${m.sourceFile}\n` +
          `    Words: expected ${m.expectedWords}, got ${m.actualWords} | Hash: expected ${m.expectedHash}, got ${m.actualHash}\n` +
          `    Reason: ${m.reason}\n`
      );
    }
    if (isStrict) {
      process.exit(1);
    }
    return;
  }

  console.log(
    `\n✅ [verify-content] Byte-for-byte word-count, SHA-256 hash, paragraph-count, and pullquote-substring checks passed!\n` +
      `   • Episode metadata & themeQuote: ${metaCount}\n` +
      `   • Questions verified:            ${qCount}\n` +
      `   • Answers & paragraph counts:    ${aCount}\n` +
      `   • Pullquotes (exact substrings): ${pqCount}\n` +
      `   • Facility statuses & rows:      ${facCount}\n` +
      `   • Psychosocial checklist items:  ${chkCount}\n` +
      `   • Matrix & table cells:          ${cellCount}\n` +
      `   • Illustration & photo captions: ${capCount}\n` +
      `   • Total items verified:          ${expectedRecords.length} (${
        expectedRecords.length * 2
      } DOM assertions)\n` +
      `   • Pending items in status-registry.json hidden & synced to README.md: ${pendingItems.length}\n`
  );
}

main();

