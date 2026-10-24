import {
  Episode,
  ContentStatus,
  DeliveredPhotoEntry,
  EpisodeQuestion,
  DeliveredClassroomMatrixRow,
  DeliveredFacilityRow,
  DeliveredPsychosocialItem,
} from './types';
import statusRegistryRaw from '../content/status-registry.json';
import ep01Raw from '../content/episode-01.json';
import ep02Raw from '../content/episode-02.json';
import ep03Raw from '../content/episode-03.json';
import ep04Raw from '../content/episode-04.json';
import ep05Raw from '../content/episode-05.json';
import ep06Raw from '../content/episode-06.json';
import institutionalRaw from '../content/institutional.json';
import philosophyRaw from '../content/philosophy.json';
import appendicesRaw from '../content/appendices.json';
import photosRaw from '../assets/photos/photos.json';
import photosEp02ContentRaw from '../content/photos-episode-02.json';

/**
 * Separate status registry (never mutates delivered JSON files).
 */
export interface StatusRegistry {
  _comment?: string;
  episodes: Record<string, ContentStatus>;
  fields: Record<string, ContentStatus>;
}

export const statusRegistry: StatusRegistry = statusRegistryRaw as unknown as StatusRegistry;

/**
 * Keys in delivered JSON files that are non-content metadata and must always be ignored
 * at any depth by adapters and verify-content.
 */
export const IGNORED_METADATA_KEYS = new Set([
  '_note',
  '_omitted',
  '_changes',
  '_comment',
  'statusKey',
]);

/**
 * Requirement (2): Ignore every key beginning with `_` and `statusKey` at any depth in all content files.
 */
export function isIgnoredKey(key: string): boolean {
  return key.startsWith('_') || key === 'statusKey';
}

/**
 * Recursively clones a JSON value while omitting any object key beginning with `_` or equal to `statusKey` at any depth.
 * Does not reshape or fill any content fields.
 */
export function stripIgnoredKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripIgnoredKeysDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isIgnoredKey(k)) continue;
      out[k] = stripIgnoredKeysDeep(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Determines whether fields/rows/episodes marked status: "PENDING" should be hidden.
 * - True in production builds (import.meta.env.PROD)
 * - True when VERIFY_HIDE_PENDING='true' during npm run verify-content
 * - True when ?hidePending=1 is present in URL query
 */
export function shouldHidePending(forceHide?: boolean): boolean {
  if (forceHide !== undefined) return forceHide;
  if (typeof process !== 'undefined' && process.env && process.env.VERIFY_HIDE_PENDING === 'true') {
    return true;
  }
  if (typeof window !== 'undefined' && window.location && window.location.search.includes('showPending=1')) {
    return false;
  }
  try {
    if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_SHOW_PENDING === 'true') {
      return false;
    }
  } catch {
    // Fallback for Node execution
  }
  return true;
}

/**
 * Strict check: a field or row is hidden ONLY when its status in status-registry.json
 * (resolved by path/index key) or inline status property is explicitly "PENDING".
 * Note: facility status "A" or "NA" is NEVER pending.
 */
export function isStatusPending(
  status?: ContentStatus | string | null,
  fieldPathOrId?: string,
  altFieldId?: string
): boolean {
  if (fieldPathOrId) {
    const regStatus =
      statusRegistry.fields?.[fieldPathOrId] ?? statusRegistry.episodes?.[fieldPathOrId];
    if (regStatus && String(regStatus).trim().toUpperCase() === 'PENDING') {
      return true;
    }
  }
  if (altFieldId) {
    const altStatus =
      statusRegistry.fields?.[altFieldId] ?? statusRegistry.episodes?.[altFieldId];
    if (altStatus && String(altStatus).trim().toUpperCase() === 'PENDING') {
      return true;
    }
  }
  if (!status) return false;
  return String(status).trim().toUpperCase() === 'PENDING';
}

export function getEpisodeId(ep: Episode): string {
  return `ep-${ep.number}`;
}

export function getEpisodeShortId(epOrNumber: Episode | string): string {
  const numStr = typeof epOrNumber === 'string' ? epOrNumber : epOrNumber.number;
  const parsed = parseInt(numStr, 10);
  return `ep${Number.isNaN(parsed) ? numStr : parsed}`;
}

export interface EpisodeActivityTocItem {
  id: string;
  number: string;
  label: string;
  title?: string;
  isSubActivity?: boolean;
}

export function getEpisodeActivities(
  ep: Episode,
  hidePending: boolean = shouldHidePending()
): EpisodeActivityTocItem[] {
  const items: EpisodeActivityTocItem[] = [];
  const epId = getEpisodeId(ep);
  const epShort = getEpisodeShortId(ep);

  if (ep.activity1) {
    items.push({
      id: `${epShort}-act${ep.activity1.number}`,
      number: ep.activity1.number,
      label: `Activity ${ep.activity1.number}`,
      title: ep.activity1.title,
    });
  }

  if (ep.activity2) {
    items.push({
      id: `${epShort}-act${ep.activity2.number}`,
      number: ep.activity2.number,
      label: `Activity ${ep.activity2.number}`,
      title: ep.activity2.title,
    });

    if (ep.activity2.activity2_1) {
      items.push({
        id: `${epShort}-act${ep.activity2.activity2_1.number}`,
        number: ep.activity2.activity2_1.number,
        label: ep.activity2.activity2_1.number,
        title: ep.activity2.activity2_1.title,
        isSubActivity: true,
      });
    }

    if (ep.activity2.activity2_2) {
      items.push({
        id: `${epShort}-act${ep.activity2.activity2_2.number}`,
        number: ep.activity2.activity2_2.number,
        label: ep.activity2.activity2_2.number,
        title: ep.activity2.activity2_2.title,
        isSubActivity: true,
      });
    }

    if (ep.activity2.activity2_3) {
      items.push({
        id: `${epShort}-act${ep.activity2.activity2_3.number}`,
        number: ep.activity2.activity2_3.number,
        label: ep.activity2.activity2_3.number,
        title: ep.activity2.activity2_3.title,
        isSubActivity: true,
      });
    }
  }

  if (ep.activity3) {
    const visibleAct3Q = (ep.activity3.answer?.questions || []).filter((q, qIdx) => {
      if (!hidePending) return true;
      return !isStatusPending(q.status, `${epId}.activity3.answer.questions[${qIdx}]`);
    });
    const hasVisibleDrawing =
      ep.activity3.classroomDrawing &&
      (!hidePending ||
        !isStatusPending(
          ep.activity3.classroomDrawing.status,
          `${epId}.activity3.classroomDrawing`
        ));
    if (!hidePending || ep.activity3.title || visibleAct3Q.length > 0 || hasVisibleDrawing) {
      items.push({
        id: `${epShort}-act${ep.activity3.number}`,
        number: ep.activity3.number,
        label: `Activity ${ep.activity3.number}`,
        title: ep.activity3.title,
      });
    }
  }

  if (ep.task1) {
    items.push({
      id: `${epShort}-task${ep.task1.number}`,
      number: ep.task1.number,
      label: `Task ${ep.task1.number}`,
      title: ep.task1.title,
    });
  }

  if (ep.task2) {
    const roadmapPending =
      ep.task2.roadmap &&
      isStatusPending(ep.task2.roadmap.status, `${epId}.task2.roadmap`);
    if (!hidePending || !roadmapPending) {
      items.push({
        id: `${epShort}-task${ep.task2.number}`,
        number: ep.task2.number,
        label: `Task ${ep.task2.number}`,
        title: ep.task2.title,
      });
    }
  }

  if (ep.task3) {
    items.push({
      id: `${epShort}-task${ep.task3.number}-section`,
      number: ep.task3.number,
      label: `Task ${ep.task3.number}`,
      title: ep.task3.title,
    });
  }

  return items;
}

export function getEpisodeColorToken(ep: Episode): string {
  if (ep.number === '04') return '--color-red-pen';
  if (ep.colorToken) return ep.colorToken;
  if (ep.accent) return `--color-${ep.accent}`;
  return '--color-construction';
}

export function getEpisodeStatus(ep: Episode): ContentStatus {
  const epId = getEpisodeId(ep);
  const fromRegistry = statusRegistry.episodes?.[epId];
  if (fromRegistry) return fromRegistry;
  if (ep.status) return ep.status;
  return 'COMPLETE';
}

/**
 * Strips double-asterisk (**like this** -> like this) and single-asterisk (*like this* -> like this) emphasis spans.
 * Verification compares text with the asterisks removed on both sides.
 */
export function stripInlineAsteriskEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1');
}

/**
 * Maps Episode 05 table status values ("Observed", "Not observed", "No opportunity to observe")
 * to check (✓), cross (✕), and ghost (◌) states.
 */
export function formatObservationStatusSymbol(status: string): '✓' | '✕' | '◌' {
  const norm = String(status ?? '').trim().toLowerCase();
  if (norm === 'observed') return '✓';
  if (norm === 'not observed') return '✕';
  return '◌';
}

/**
 * Canonical text normalization used for word count and SHA-256 hash comparison.
 * Does NOT perform typographic substitution (never alters quotes, dashes, or casing).
 */
export function normalizeVerbatimText(text: string): string {
  return stripInlineAsteriskEmphasis(text).replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes extracted PDF text (resolves PDF line-wrap hyphenation, ligatures, and whitespace)
 * strictly for the post-PDF text extraction check (Requirement 4).
 */
export function normalizePdfExtractedText(text: string): string {
  return text
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/-\s*\n\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(text: string): number {
  const norm = normalizeVerbatimText(text);
  if (!norm) return 0;
  return norm.split(' ').length;
}

/**
 * Counts paragraphs in a source string (split on blank lines \n\n).
 */
export function splitParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Zero-copy adapter for delivered episode JSON files (Episode 02, Episode 03, etc.).
 * Preserves delivered content byte-for-byte without adding, renaming, or filling any field
 * while stripping all `_`-prefixed keys and `statusKey` at any depth.
 */
export function unwrapDeliveredEpisode(raw: unknown): Episode {
  const cleaned = stripIgnoredKeysDeep(raw);
  if (cleaned && typeof cleaned === 'object' && 'episode' in (cleaned as Record<string, unknown>)) {
    const inner = (cleaned as Record<string, unknown>).episode;
    if (inner && typeof inner === 'object') {
      const epObj = inner as Record<string, unknown>;
      if (!epObj.title && Array.isArray(epObj.titleLines)) {
        Object.defineProperty(epObj, 'title', {
          get: () => (epObj.titleLines as string[]).join(' · '),
          enumerable: false,
        });
      }
      return inner as Episode;
    }
  }
  return cleaned as Episode;
}

export function getQuestionPrompt(q: EpisodeQuestion): string {
  return q.question !== undefined ? q.question : q.prompt || '';
}

export function getQuestionPullquote(q: EpisodeQuestion): string | undefined {
  return q.pullquote !== undefined ? q.pullquote : q.pullQuoteExcerpt;
}

export function getQuestionId(
  epNumber: string,
  prefix: string,
  q: EpisodeQuestion,
  idx: number
): string {
  const num = q.n !== undefined ? q.n : idx + 1;
  return `ep-${epNumber}-${prefix}-${num}`;
}

export function getClassroomMatrixData(ep: Episode): {
  title?: string;
  columns?: { key: string; label: string }[];
  rows: DeliveredClassroomMatrixRow[];
} {
  if (!ep.classroomMatrix) return { rows: [] };
  if (Array.isArray(ep.classroomMatrix)) {
    return { rows: ep.classroomMatrix };
  }
  return {
    title: ep.classroomMatrix.title,
    columns: ep.classroomMatrix.columns,
    rows: ep.classroomMatrix.rows || [],
  };
}

export function getSchoolFacilitiesData(ep: Episode): {
  title?: string;
  rows: DeliveredFacilityRow[];
} {
  if (!ep.schoolFacilities) return { rows: [] };
  if (Array.isArray(ep.schoolFacilities)) {
    return { rows: ep.schoolFacilities };
  }
  return {
    title: ep.schoolFacilities.title,
    rows: ep.schoolFacilities.rows || [],
  };
}

export function getPsychosocialChecklistData(ep: Episode): {
  title?: string;
  items: DeliveredPsychosocialItem[];
} {
  if (!ep.psychosocialChecklist) return { items: [] };
  if (Array.isArray(ep.psychosocialChecklist)) {
    return { items: ep.psychosocialChecklist };
  }
  return {
    title: ep.psychosocialChecklist.title,
    items: ep.psychosocialChecklist.items || [],
  };
}

export function getPsychosocialItemText(item: DeliveredPsychosocialItem): string {
  return item.text !== undefined ? item.text : item.item || '';
}

/**
 * Requirement (8): Ignore ep-02-wall-displays.jpg and any Screenshot_* files.
 */
export function isIgnoredPhotoFile(fileName: string): boolean {
  const base = (fileName.split('/').pop() || fileName).trim();
  if (base.toLowerCase() === 'ep-02-wall-displays.jpg') return true;
  if (/^Screenshot_/i.test(base)) return true;
  return false;
}

/**
 * Requirement (8): Photo fileMatch entries can use a glob (e.g. "misc-schoolhallway*mokingsign.webp").
 */
export function matchesPhotoGlob(pattern: string, fileName: string): boolean {
  if (!pattern || !fileName) return false;
  const cleanFile = (fileName.split('/').pop() || fileName).trim();
  const cleanPattern = pattern.trim();
  if (cleanPattern.toLowerCase() === cleanFile.toLowerCase()) return true;
  if (cleanPattern.includes('*') || cleanPattern.includes('?')) {
    const escaped = cleanPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${escaped}$`, 'i');
    return regex.test(cleanFile);
  }
  return false;
}

export const rawEpisodes: Episode[] = [
  unwrapDeliveredEpisode(ep01Raw),
  unwrapDeliveredEpisode(ep02Raw),
  unwrapDeliveredEpisode(ep03Raw),
  unwrapDeliveredEpisode(ep04Raw),
  unwrapDeliveredEpisode(ep05Raw),
  unwrapDeliveredEpisode(ep06Raw),
];

export const rawInstitutional = stripIgnoredKeysDeep(institutionalRaw);
export const rawPhilosophy = stripIgnoredKeysDeep(philosophyRaw);
export const rawAppendices = stripIgnoredKeysDeep(appendicesRaw);
export const rawPhotos = stripIgnoredKeysDeep(photosRaw) as Record<
  string,
  { status?: ContentStatus; alt?: string; caption: string; credit?: string; needsFaceCheck?: boolean; role?: string; fileMatch?: string }
>;

/**
 * Parses photos-episode-02.json as delivered (supports { photos: [...] } or dictionary,
 * ignoring all _-prefixed keys and statusKey at any depth).
 */
export function getEpisode02Photos(): DeliveredPhotoEntry[] {
  const raw = stripIgnoredKeysDeep(photosEp02ContentRaw) as Record<string, unknown>;
  if (!raw) return [];
  if (Array.isArray(raw.photos)) {
    return (raw.photos as DeliveredPhotoEntry[]).filter(
      (p) => !isIgnoredPhotoFile(p.file || p.fileMatch || '')
    );
  }
  const entries: DeliveredPhotoEntry[] = [];
  for (const [k, v] of Object.entries(raw)) {
    if (isIgnoredKey(k) || k === 'note') continue;
    if (v && typeof v === 'object' && 'caption' in (v as Record<string, unknown>)) {
      const item = v as Record<string, unknown>;
      const file = (item.file as string) || (item.fileMatch as string) || k;
      if (isIgnoredPhotoFile(file)) continue;
      entries.push({
        id: (item.id as string) || k,
        file,
        fileMatch: (item.fileMatch as string) || file,
        role: item.role as string | undefined,
        needsFaceCheck: Boolean(item.needsFaceCheck),
        alt: (item.alt as string) || (item.caption as string),
        caption: String(item.caption || ''),
        credit: item.credit as string | undefined,
        status: item.status as ContentStatus | undefined,
      });
    }
  }
  return entries;
}

export const rawEpisode02Photos: DeliveredPhotoEntry[] = getEpisode02Photos();

export interface PendingChecklistItem {
  sourceFile: string;
  fieldId: string;
  category: 'Episode' | 'Section' | 'Question' | 'Table' | 'TableCell' | 'Reflection' | 'Appendix' | 'Photo';
  description: string;
  reason: 'status: PENDING';
}

/**
 * Collects all items explicitly marked status: "PENDING" in status-registry.json
 * (or inline status: "PENDING") using item paths and array indexes.
 * Intentional empty values (such as description: "" on a facility with status: "NA",
 * or worksheetPdf: "") are NEVER flagged as pending or leaks.
 */
export function collectPendingChecklist(): PendingChecklistItem[] {
  const items: PendingChecklistItem[] = [];

  for (const ep of rawEpisodes) {
    const file = `src/content/episode-${ep.number}.json`;
    const epId = getEpisodeId(ep);
    const epStatus = getEpisodeStatus(ep);
    if (isStatusPending(epStatus, epId)) {
      items.push({
        sourceFile: file,
        fieldId: epId,
        category: 'Episode',
        description: `Episode ${ep.number}: ${ep.title} (overall episode status)`,
        reason: 'status: PENDING',
      });
    }

    (ep.sections || []).forEach((sec, sIdx) => {
      const secPath = `${epId}.sections[${sIdx}]`;
      const legacyKey = `${epId}.${sec.id}`;
      if (isStatusPending(sec.status, secPath, legacyKey)) {
        items.push({
          sourceFile: file,
          fieldId: secPath,
          category: 'Section',
          description: `Episode ${ep.number} section "${sec.title}"`,
          reason: 'status: PENDING',
        });
      }
    });

    const questionSets: { list?: EpisodeQuestion[]; pathPrefix: string; prefix: string }[] = [
      { list: ep.questions, pathPrefix: `${epId}.questions`, prefix: 'q' },
      { list: ep.classroomQuestions, pathPrefix: `${epId}.classroomQuestions`, prefix: 'cq' },
      { list: ep.reflectSchool, pathPrefix: `${epId}.reflectSchool`, prefix: 'rs' },
      { list: ep.psychosocialReflect, pathPrefix: `${epId}.psychosocialReflect`, prefix: 'pr' },
    ];

    for (const { list, pathPrefix, prefix } of questionSets) {
      (list || []).forEach((q, idx) => {
        const pathKey = `${pathPrefix}[${idx}]`;
        const qId = getQuestionId(ep.number, prefix, q, idx);
        if (isStatusPending(q.status, pathKey, qId)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} question (${pathKey}): "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
    }

    // Episode 03 & Episode 04 Activity 1 & Activity 2 pending checks
    if (ep.activity1) {
      (ep.activity1.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity1.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 1 Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity1.interviewGuide?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity1.interviewGuide.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 1 interview guide Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity1.answer?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity1.answer.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 1 answer Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
    }

    if (ep.activity2) {
      if (ep.activity2.observationSheet) {
        for (const [k, rawVal] of Object.entries(ep.activity2.observationSheet)) {
          if (isIgnoredKey(k) || rawVal === undefined) continue;
          const pathKey = `${epId}.activity2.observationSheet.${k}`;
          const inlineStatus =
            typeof rawVal === 'object' && rawVal !== null && 'status' in rawVal
              ? rawVal.status
              : undefined;
          if (isStatusPending(inlineStatus, pathKey)) {
            items.push({
              sourceFile: file,
              fieldId: pathKey,
              category: 'TableCell',
              description: `Episode ${ep.number} Activity 2 observationSheet.${k}`,
              reason: 'status: PENDING',
            });
          }
        }
      }
      (ep.activity2.classObservation?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity2.classObservation.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 2 class observation Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.teacherInterview?.parts || []).forEach((part, pIdx) => {
        (part.questions || []).forEach((q, qIdx) => {
          const pathKey = `${epId}.activity2.teacherInterview.parts[${pIdx}].questions[${qIdx}]`;
          if (isStatusPending(q.status, pathKey)) {
            items.push({
              sourceFile: file,
              fieldId: pathKey,
              category: 'Question',
              description: `Episode ${ep.number} teacher interview Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
              reason: 'status: PENDING',
            });
          }
        });
      });
      (ep.activity2.teacherInterview?.practicesTable?.rows || []).forEach((row, rIdx) => {
        const pathKey = `${epId}.activity2.teacherInterview.practicesTable.rows[${rIdx}]`;
        if (isStatusPending(row.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'TableCell',
            description: `Episode ${ep.number} teacher-guided practices row ${rIdx + 1} ("${row.practice}")`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.answer?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity2.answer.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 2 answer Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.activity2_1?.methodsTable?.rows || []).forEach((row, rIdx) => {
        const pathKey = `${epId}.activity2.activity2_1.methodsTable.rows[${rIdx}]`;
        if (isStatusPending(row.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'TableCell',
            description: `Episode ${ep.number} Activity 2-1 methods table row ${rIdx + 1} ("${row.method}")`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.activity2_1?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity2.activity2_1.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 2-1 Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.activity2_2?.materialsTable?.rows || []).forEach((row, rIdx) => {
        const pathKey = `${epId}.activity2.activity2_2.materialsTable.rows[${rIdx}]`;
        if (isStatusPending(row.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'TableCell',
            description: `Episode ${ep.number} Activity 2-2 materials table row ${rIdx + 1} ("${row.material}")`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.activity2_2?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity2.activity2_2.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 2-2 Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      (ep.activity2.activity2_3?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity2.activity2_3.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 2-3 Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
      if (ep.activity2.rtInterview?.profile) {
        for (const [k, rawVal] of Object.entries(ep.activity2.rtInterview.profile)) {
          if (isIgnoredKey(k) || rawVal === undefined) continue;
          const pathKey = `${epId}.activity2.rtInterview.profile.${k}`;
          const inlineStatus =
            typeof rawVal === 'object' && rawVal !== null && 'status' in rawVal
              ? rawVal.status
              : undefined;
          if (isStatusPending(inlineStatus, pathKey)) {
            items.push({
              sourceFile: file,
              fieldId: pathKey,
              category: 'TableCell',
              description: `Episode ${ep.number} Activity 2 rtInterview.profile.${k}`,
              reason: 'status: PENDING',
            });
          }
        }
      }
      (ep.activity2.rtInterview?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity2.rtInterview.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 2 rtInterview Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
    }

    if (ep.activity3) {
      if (ep.activity3.classroomDrawing) {
        const drawPath = `${epId}.activity3.classroomDrawing`;
        if (isStatusPending(ep.activity3.classroomDrawing.status, drawPath)) {
          items.push({
            sourceFile: file,
            fieldId: drawPath,
            category: 'Photo',
            description: `Episode ${ep.number} Activity 3 classroomDrawing (hand-drawn classroom layout)`,
            reason: 'status: PENDING',
          });
        }
      }
      (ep.activity3.answer?.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.activity3.answer.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Question',
            description: `Episode ${ep.number} Activity 3 answer Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
    }

    if (ep.task2?.roadmap) {
      const rmPath = `${epId}.task2.roadmap`;
      if (isStatusPending(ep.task2.roadmap.status, rmPath)) {
        items.push({
          sourceFile: file,
          fieldId: rmPath,
          category: 'Section',
          description: `Episode ${ep.number} Task ${ep.task2.number} (${ep.task2.title})`,
          reason: 'status: PENDING',
        });
      }
    }

    if (ep.reflections) {
      const refPath = `${epId}.reflections`;
      if (isStatusPending(ep.reflections.status, refPath)) {
        items.push({
          sourceFile: file,
          fieldId: refPath,
          category: 'Reflection',
          description: `Episode ${ep.number} reflections`,
          reason: 'status: PENDING',
        });
      }
    }

    if (ep.reflectionQuestions) {
      (ep.reflectionQuestions.questions || []).forEach((q, qIdx) => {
        const pathKey = `${epId}.reflectionQuestions.questions[${qIdx}]`;
        if (isStatusPending(q.status, pathKey)) {
          items.push({
            sourceFile: file,
            fieldId: pathKey,
            category: 'Reflection',
            description: `Episode ${ep.number} Reflection Q${q.n ?? qIdx + 1}: "${getQuestionPrompt(q)}"`,
            reason: 'status: PENDING',
          });
        }
      });
    }

    (ep.tables || []).forEach((tbl, tIdx) => {
      const tblPath = `${epId}.tables[${tIdx}]`;
      if (isStatusPending(tbl.status, tblPath, tbl.id) || tbl.isPending) {
        items.push({
          sourceFile: file,
          fieldId: tblPath,
          category: 'Table',
          description: `Episode ${ep.number} table "${tbl.title}"`,
          reason: 'status: PENDING',
        });
      } else {
        tbl.rows.forEach((row, rIdx) => {
          tbl.columns.forEach((col) => {
            const cellPath = `${tblPath}.rows[${rIdx}].${col.key}`;
            const legacyCellId = `${tbl.id}-r${rIdx}-${col.key}`;
            const cellVal = row[col.key];
            if (isStatusPending(String(cellVal || ''), cellPath, legacyCellId)) {
              items.push({
                sourceFile: file,
                fieldId: cellPath,
                category: 'TableCell',
                description: `Episode ${ep.number} table "${tbl.title}" row ${rIdx + 1}, column "${col.label}"`,
                reason: 'status: PENDING',
              });
            }
          });
        });
      }
    });

    if (ep.reflection) {
      const refPath = `${epId}.reflection`;
      const legacyRefId = `${epId}-reflection`;
      if (isStatusPending(ep.reflection.status, refPath, legacyRefId)) {
        items.push({
          sourceFile: file,
          fieldId: refPath,
          category: 'Reflection',
          description: `Episode ${ep.number} reflection`,
          reason: 'status: PENDING',
        });
      }
    }
  }

  // Check appendices classProgram, DTR & evidenceGallery
  (rawAppendices.classProgram || []).forEach((cp: any, idx: number) => {
    const fieldId = `appendices.classProgram[${idx}]`;
    if (isStatusPending(cp.status, fieldId)) {
      items.push({
        sourceFile: 'src/content/appendices.json',
        fieldId,
        category: 'Appendix',
        description: `Class program slot ${idx + 1} (${cp.gradeSection})`,
        reason: 'status: PENDING',
      });
    }
  });

  (rawAppendices.dtr?.entries || []).forEach((entry: any, idx: number) => {
    const fieldId = `appendices.dtr.entries[${idx}]`;
    if (isStatusPending(entry.status, fieldId)) {
      items.push({
        sourceFile: 'src/content/appendices.json',
        fieldId,
        category: 'Appendix',
        description: `Daily Time Record session ${entry.sessionNumber} (${entry.episodeFocus})`,
        reason: 'status: PENDING',
      });
    }
  });

  if (isStatusPending(undefined, 'appendices.evidenceGallery')) {
    items.push({
      sourceFile: 'src/content/appendices.json',
      fieldId: 'appendices.evidenceGallery',
      category: 'Appendix',
      description: 'Appendices placeholder evidence gallery slots',
      reason: 'status: PENDING',
    });
  }

  // Check photos.json & photos-episode-02.json
  Object.entries(rawPhotos).forEach(([key, meta]) => {
    if (isIgnoredKey(key)) return;
    const pathKey = `photos.${key}`;
    const legacyId = `photo-${key}-caption`;
    if (isStatusPending(meta.status, pathKey, legacyId)) {
      items.push({
        sourceFile: 'src/assets/photos/photos.json',
        fieldId: pathKey,
        category: 'Photo',
        description: `Photo "${key}" metadata`,
        reason: 'status: PENDING',
      });
    }
  });

  rawEpisode02Photos.forEach((p, idx) => {
    const rawName = p.id || p.file || p.fileMatch || `photo-${idx}`;
    const key = rawName.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '');
    const pathKey = `photos-ep-02[${idx}]`;
    const legacyId = `photo-${key}-caption`;
    if (isStatusPending(p.status, pathKey, legacyId)) {
      items.push({
        sourceFile: 'src/content/photos-episode-02.json',
        fieldId: pathKey,
        category: 'Photo',
        description: `Episode 02 photo "${rawName}"`,
        reason: 'status: PENDING',
      });
    }
  });

  return items;
}

