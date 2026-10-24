import { rawPhilosophy } from './contentIntake';

export interface PhilosophyStatement {
  id: string;
  lead: string;
  emphasis: string;
  rest: string;
  annotation?: string;
}

export interface PhilosophyPillar {
  id: string;
  numeral: string;
  title: string;
  thesis: string;
  elaboration: string;
  classroomPractice: string;
  theoristAnchor: string;
}

export interface EducationalPhilosophyData {
  title: string;
  subtitle: string;
  epigraph: string;
  credo: string;
  author: string;
  date: string;
  statements: PhilosophyStatement[];
  pillars: PhilosophyPillar[];
  closingCommitment: string;
  closingReflection?: string;
}

/**
 * Programmatically imported from src/content/philosophy.json.
 * Never retype, paraphrase, shorten, or edit client wording in code.
 */
export const educationalPhilosophy: EducationalPhilosophyData = rawPhilosophy;
