/**
 * Content schemas for The Observer's Edition (Design System v1 + Content Intake Protocol v2)
 * Supports both general episode JSON files and the exact delivered episode-02.json /
 * photos-episode-02.json schema byte-for-byte without filling absent fields.
 */

export type ContentStatus = 'COMPLETE' | 'PENDING' | 'complete' | 'pending';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'badge' | 'tick' | 'Status' | 'monospaced' | 'number' | 'facilityStatus' | 'facilityDesc';
}

export type TableRow = Record<string, string | number | boolean | string[] | null | undefined>;

export interface FlexibleTable {
  id: string;
  title: string;
  status?: ContentStatus;
  description?: string;
  columns: TableColumn[];
  rows: TableRow[];
  isPending?: boolean;
  footnote?: string;
}

export type MediaType = 'image' | 'svg' | 'sketch' | 'diagram' | 'certificate' | 'document';

export interface MediaItem {
  id: string;
  type: MediaType;
  status?: ContentStatus;
  src?: string;
  alt?: string;
  caption: string;
  credit?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4' | 'auto' | '16/9' | '4/3';
  svgContent?: string;
  title?: string;
  placeholderLabel?: string;
}

export interface MarginAnnotation {
  id: string;
  anchorText: string;
  note: string;
  markType: 'circle' | 'underline' | 'bracket' | 'arrow' | 'note';
}

export interface EpisodeQuestion {
  id?: string;
  n?: number;
  status?: ContentStatus;
  prompt?: string;
  question?: string;
  answer: string;
  pullquote?: string;
  pullQuoteExcerpt?: string;
  display?: 'expander' | 'prose' | 'full';
}

export interface DeliveredFacilityRow {
  id?: string;
  facility: string;
  status: 'A' | 'NA' | string;
  description: string;
  photos?: string[];
}

export interface DeliveredSchoolFacilitiesObject {
  title?: string;
  statusKey?: string;
  rows: DeliveredFacilityRow[];
}

export interface DeliveredClassroomMatrixRow {
  id?: string;
  item?: string;
  area?: string;
  condition?: string;
  description?: string;
  photos?: string[];
  [key: string]: unknown;
}

export interface DeliveredClassroomMatrixObject {
  title?: string;
  columns?: { key: string; label: string }[];
  rows: DeliveredClassroomMatrixRow[];
}

export interface DeliveredPsychosocialItem {
  id?: string;
  text?: string;
  item?: string;
  observed: boolean;
}

export interface DeliveredPsychosocialChecklistObject {
  title?: string;
  items: DeliveredPsychosocialItem[];
}

export interface DeliveredPersonalIllustration {
  format?: string;
  image: string;
  caption: string;
}

export interface DeliveredLearnerObservedRow {
  code: string;
  group: string;
  age?: string;
  gender?: string;
  description: string;
  status?: ContentStatus;
}

export interface DeliveredLearnersObserved {
  title: string;
  gradeSection?: string;
  rows: DeliveredLearnerObservedRow[];
}

export interface DeliveredQuestionGroup {
  title: string;
  guideTitle?: string;
  questions: EpisodeQuestion[];
}

export interface DeliveredRoutinesTableRow {
  routine: string;
  status: string;
}

export interface DeliveredRoutinesTable {
  columns: { key: string; label: string }[];
  rows: DeliveredRoutinesTableRow[];
}

export interface DeliveredActivity1 {
  number: string;
  title?: string;
  learnersObserved?: DeliveredLearnersObserved;
  interviewGuide?: DeliveredQuestionGroup;
  answer?: DeliveredQuestionGroup;
  questions?: EpisodeQuestion[];
  routinesTable?: DeliveredRoutinesTable;
}

export interface DeliveredTeacherInterviewProfile {
  resourceTeacher?: string;
  nameOfResourceTeacher?: string;
  school?: string;
  gradeLevelSubject: string;
  dateOfInterview: string;
  yearsInService?: DeliveredObservationSheetField;
  [key: string]: DeliveredObservationSheetField | undefined;
}

export interface DeliveredTeacherInterviewPart {
  heading: string;
  questions: EpisodeQuestion[];
}

export interface DeliveredPracticesTableRow {
  practice: string;
  illustration: string;
  status?: ContentStatus;
}

export interface DeliveredPracticesTable {
  title: string;
  instruction?: string;
  columns: { key: string; label: string }[];
  rows: DeliveredPracticesTableRow[];
}

export interface DeliveredTeacherInterview {
  title: string;
  profile: DeliveredTeacherInterviewProfile;
  attribution?: 'full' | string;
  parts: DeliveredTeacherInterviewPart[];
  practicesTable?: DeliveredPracticesTable;
}

export type DeliveredObservationSheetField =
  | string
  | {
      value: string;
      status?: ContentStatus;
    };

export interface DeliveredObservationSheet {
  nameOfTeacher?: DeliveredObservationSheetField;
  school?: DeliveredObservationSheetField;
  date?: DeliveredObservationSheetField;
  sessions?: DeliveredObservationSheetField;
  gradeLevel?: DeliveredObservationSheetField;
  subjectArea?: DeliveredObservationSheetField;
  [key: string]: DeliveredObservationSheetField | undefined;
}

export interface DeliveredMethodsTableRow {
  method: string;
  description: string;
  status?: ContentStatus;
}

export interface DeliveredMethodsTable {
  columns: { key: string; label: string }[];
  rows: DeliveredMethodsTableRow[];
}

export interface DeliveredActivity2_1 {
  number: string;
  title: string;
  methodsTable?: DeliveredMethodsTable;
  questions?: EpisodeQuestion[];
}

export interface DeliveredMaterialsTableRow {
  material: string;
  present: boolean;
  notes?: string;
  status?: ContentStatus;
}

export interface DeliveredMaterialsTable {
  columns: { key: string; label: string }[];
  rows: DeliveredMaterialsTableRow[];
}

export interface DeliveredActivity2_2 {
  number: string;
  title: string;
  materialsTable?: DeliveredMaterialsTable;
  questions?: EpisodeQuestion[];
}

export interface DeliveredActivity2_3 {
  number: string;
  title: string;
  questions?: EpisodeQuestion[];
}

export interface DeliveredStrategiesTableRow {
  strategy: string;
  status: string;
  remarks?: string;
}

export interface DeliveredStrategiesTable {
  columns: { key: string; label: string }[];
  rows: DeliveredStrategiesTableRow[];
}

export interface DeliveredRtInterview {
  title: string;
  profile: DeliveredTeacherInterviewProfile;
  attribution?: 'full' | string;
  questions: EpisodeQuestion[];
}

export interface DeliveredActivity2 {
  number: string;
  title: string;
  note?: string;
  classObservation?: DeliveredQuestionGroup;
  teacherInterview?: DeliveredTeacherInterview;
  answer?: DeliveredQuestionGroup;
  observationSheet?: DeliveredObservationSheet;
  activity2_1?: DeliveredActivity2_1;
  activity2_2?: DeliveredActivity2_2;
  activity2_3?: DeliveredActivity2_3;
  strategiesTable?: DeliveredStrategiesTable;
  rtInterview?: DeliveredRtInterview;
}

export interface DeliveredClassroomDrawing {
  image: string;
  status?: ContentStatus;
  caption?: string;
}

export interface DeliveredActivity3 {
  number: string;
  title: string;
  classroomDrawing?: DeliveredClassroomDrawing;
  answer?: DeliveredQuestionGroup;
}

export interface DeliveredReflections {
  title: string;
  prompt: string;
  answer: string;
  display?: 'expander' | 'prose' | 'full';
  pullquote?: string;
  status?: ContentStatus;
}

export interface DeliveredPhotoEntry {
  id?: string;
  file?: string;
  fileMatch?: string;
  role?: 'facility' | 'classroom' | 'mood' | 'illustration' | string;
  needsFaceCheck?: boolean;
  alt?: string;
  caption: string;
  note?: string;
  credit?: string;
  status?: ContentStatus;
}

export interface EpisodeSection {
  id: string;
  status?: ContentStatus;
  kicker?: string;
  title: string;
  paragraphs?: string[];
  content?: string[];
  tables?: FlexibleTable[];
  media?: MediaItem[];
  marginNotes?: MarginAnnotation[];
  highlights?: string[];
}

export interface PullQuoteData {
  quote: string;
  attribution?: string;
  role?: string;
  status?: ContentStatus;
}

export interface EpisodeReflection {
  status?: ContentStatus;
  prompt: string;
  text: string;
}

export interface DeliveredTask1Level {
  label: string;
  description: string;
}

export interface DeliveredTask1Evidence {
  url: string;
  label?: string;
}

export interface DeliveredTask1Indicator {
  indicator: string;
  level: string;
  evidence: DeliveredTask1Evidence[];
}

export interface DeliveredTask1Domain {
  heading: string;
  indicators: DeliveredTask1Indicator[];
  notYetAchieved: string;
  remarks: string;
}

export interface DeliveredTask1 {
  number: string;
  title: string;
  levels: DeliveredTask1Level[];
  domains: DeliveredTask1Domain[];
}

export interface DeliveredTask2 {
  number: string;
  title: string;
  roadmap?: {
    status?: ContentStatus;
    [key: string]: unknown;
  };
}

export interface DeliveredPhilosophyRow {
  philosophy: string;
  definition: string;
  deped: string;
  k12: string;
  category?: string;
}

export interface DeliveredPhilosophiesTable {
  columns: { key: string; label: string }[];
  rows: DeliveredPhilosophyRow[];
}

export interface DeliveredCredoAudience {
  label: string;
  text: string;
}

export interface DeliveredCredoSection {
  lead: string;
  paragraphs: string[];
  audiences?: DeliveredCredoAudience[];
  pullquote?: string;
}

export interface DeliveredCredo {
  title: string;
  sections: DeliveredCredoSection[];
}

export interface DeliveredTask3 {
  number: string;
  title: string;
  philosophiesTable: DeliveredPhilosophiesTable;
  credo: DeliveredCredo;
}

export interface Episode {
  _note?: string;
  statusKey?: Record<string, string>;
  id?: string;
  number: string;
  title: string;
  titleLines?: string[];
  accent?: string;
  school?: string;
  date?: string;
  timeObserved?: string;
  gradeSection?: string;
  gradeSections?: string;
  sectionsObserved?: string;
  resourceTeacher?: string;
  subtitle?: string;
  thesis?: string;
  keyFinding?: string;
  themeQuote?: string;
  status?: ContentStatus;
  colorToken?: string;
  ppstDomains?: string[];
  worksheetPdf?: string;
  // Delivered Episode 01 keys (used byte-for-byte without reshaping)
  task1?: DeliveredTask1;
  task2?: DeliveredTask2;
  task3?: DeliveredTask3;
  // Delivered Episode 02 keys (used byte-for-byte without reshaping)
  classroomQuestions?: EpisodeQuestion[];
  classroomMatrix?: DeliveredClassroomMatrixObject | DeliveredClassroomMatrixRow[];
  schoolFacilities?: DeliveredSchoolFacilitiesObject | DeliveredFacilityRow[];
  reflectSchool?: EpisodeQuestion[];
  psychosocialChecklist?: DeliveredPsychosocialChecklistObject | DeliveredPsychosocialItem[];
  psychosocialReflect?: EpisodeQuestion[];
  personalIllustration?: DeliveredPersonalIllustration;
  // Delivered Episode 03, 04, & 05 keys (used byte-for-byte without reshaping)
  activity1?: DeliveredActivity1;
  activity2?: DeliveredActivity2;
  activity3?: DeliveredActivity3;
  reflections?: DeliveredReflections;
  reflectionQuestions?: DeliveredQuestionGroup;
  // Standard Episode keys (Episode 06)
  questions?: EpisodeQuestion[];
  sections?: EpisodeSection[];
  tables?: FlexibleTable[];
  media?: MediaItem[];
  quotes?: PullQuoteData[];
  reflection?: EpisodeReflection;
}


