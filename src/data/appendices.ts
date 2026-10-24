import { MediaItem } from './types';
import { rawAppendices } from './contentIntake';

export interface ResourceTeacherProfile {
  name: string;
  title: string;
  designation: string;
  subjectArea: string;
  school: string;
  observedClasses: string[];
  pedagogicalSpecialties: string[];
  biographicalNote: string;
}

export interface ClassScheduleSlot {
  time: string;
  days: string;
  gradeSection: string;
  subject: string;
  focus: string;
  status?: string;
}

export interface DTREntry {
  sessionNumber: number;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  episodeFocus: string;
  remarks: string;
  status?: string;
}

export interface DTRPage {
  id: string;
  label: string;
  file: string;
  alt: string;
}

export interface DocumentationPhotoItem {
  id: string;
  file: string;
  alt: string;
  caption: string;
}

export interface DocumentationGroup {
  id: string;
  name: string;
  photos: DocumentationPhotoItem[];
}

export interface AppendicesData {
  resourceTeacher: ResourceTeacherProfile;
  classProgram: ClassScheduleSlot[];
  schoolSite: {
    schoolName: string;
    address: string;
    campusOverview: string;
    description: string;
    rulesAndRegulations: string[];
  };
  dtr: {
    title?: string;
    pages?: DTRPage[];
    studentName: string;
    course: string;
    semester: string;
    totalRequiredHours: number;
    completedHours: number;
    verifiedBy: string;
    summary: string;
    entries: DTREntry[];
  };
  clearance: {
    title?: string;
    file?: string;
    alt?: string;
    status: string;
    dateIssued: string;
    signatories: {
      name: string;
      designation: string;
    }[];
    office: string;
    certificationText: string;
  };
  documentation: {
    title: string;
    groups: DocumentationGroup[];
  };
  evidenceGallery: MediaItem[];
}

let appendixPhotoModules: Record<string, { default: string }> = {};
try {
  appendixPhotoModules = import.meta.glob(
    '../assets/photos/*.{jpg,jpeg,png,webp,avif,svg}',
    { eager: true }
  ) as Record<string, { default: string }>;
} catch {
  appendixPhotoModules = {};
}

export function resolveAppendixPhotoSrc(fileOrSrc?: string): string | undefined {
  if (!fileOrSrc) return undefined;
  if (fileOrSrc.startsWith('/assets/') || fileOrSrc.startsWith('http')) {
    return fileOrSrc;
  }
  const cleanName = fileOrSrc.split('/').pop() || fileOrSrc;
  for (const [modPath, mod] of Object.entries(appendixPhotoModules)) {
    if (modPath.endsWith(`/${cleanName}`) && mod?.default) {
      return mod.default;
    }
  }
  return `/assets/photos/${cleanName}`;
}

/**
 * Programmatically imported from src/content/appendices.json.
 * Never retype, paraphrase, shorten, or edit client wording in code.
 */
export const appendicesData: AppendicesData = rawAppendices as unknown as AppendicesData;
