/**
 * Archival Image & Asset Manifest
 * Defines the complete inventory of photographic, cutout, and sketch assets
 * across The Observer's Edition e-portfolio and archival print edition.
 *
 * All entries require width and height to prevent Cumulative Layout Shift (CLS).
 * Unfilled entries are kept hidden in production builds and displayed with dashed
 * archival draft framing in development mode.
 */

export type AssetType = 'photo' | 'cutout' | 'sketch';
export type TapeStyle = 'neutral' | 'red' | 'none';
export type ShadowStyle = 'none' | 'sm' | 'md' | 'lg' | 'polaroid';
export type CropStyle = 'natural' | 'square' | 'wide' | 'tall';
export type TiltStyle = '-rotate-3' | '-rotate-2' | '-rotate-1' | 'rotate-0' | 'rotate-1' | 'rotate-2' | 'rotate-3';

export interface ArchivalAsset {
  id: string;
  type: AssetType;
  src?: string; // Relative path or URL once client images are dropped in; empty string if pending
  alt: string; // REQUIRED: Semantic accessibility description
  width: number; // REQUIRED: Natural width in pixels to eliminate CLS
  height: number; // REQUIRED: Natural height in pixels to eliminate CLS
  caption?: string;
  credit?: string;
  artDirection?: {
    tilt?: TiltStyle;
    tapeStyle?: TapeStyle;
    shadow?: ShadowStyle;
    crop?: CropStyle;
    parallaxDepth?: number; // 0.0 (static) to 1.0 (deep)
    isTransparentCutout?: boolean; // If true, avoids white container backgrounds
  };
}

export const assetsManifest: Record<string, ArchivalAsset> = {
  // ---------------------------------------------------------------------------
  // ACT I / LANDING DESK COLLAGE
  // ---------------------------------------------------------------------------
  'landing-polaroid-1': {
    id: 'landing-polaroid-1',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Classroom observation setting in Room 204 during English instruction',
    width: 800,
    height: 600,
    caption: 'Classroom Space (Room 204) — Observation Session 01',
    credit: 'Field Study 1 Archive',
    artDirection: {
      tilt: '-rotate-2',
      tapeStyle: 'neutral',
      shadow: 'polaroid',
      crop: 'natural',
      parallaxDepth: 0.15,
    },
  },
  'landing-polaroid-2': {
    id: 'landing-polaroid-2',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Daily Lesson Plan manuscript and instructional materials reviewed with Cooperating Teacher',
    width: 800,
    height: 600,
    caption: 'Daily Lesson Plan Inspection — PPST Domain 4',
    credit: 'Field Study 1 Archive',
    artDirection: {
      tilt: 'rotate-2',
      tapeStyle: 'none',
      shadow: 'polaroid',
      crop: 'natural',
      parallaxDepth: 0.25,
    },
  },
  'desk-cutout-pen': {
    id: 'desk-cutout-pen',
    type: 'cutout',
    src: '', // Pending client submission
    alt: 'Archival fountain pen resting on the desk',
    width: 600,
    height: 180,
    artDirection: {
      tilt: 'rotate-3',
      shadow: 'md',
      isTransparentCutout: true,
      parallaxDepth: 0.35,
    },
  },

  // ---------------------------------------------------------------------------
  // ACT II: FOUNDATIONS
  // ---------------------------------------------------------------------------
  'act2-certificate-completion': {
    id: 'act2-certificate-completion',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Official Bicol University Certificate of Completion for Field Study 1',
    width: 1200,
    height: 850,
    caption: 'Certificate of Field Study 1 Completion · Experiential Learning Office',
    credit: 'Bicol University College of Education',
    artDirection: {
      tilt: 'rotate-0',
      tapeStyle: 'none',
      shadow: 'lg',
      crop: 'natural',
    },
  },

  // ---------------------------------------------------------------------------
  // ACT III: THE FIELD (EPISODES 01–06)
  // ---------------------------------------------------------------------------
  'ep01-academic-roadmap': {
    id: 'ep01-academic-roadmap',
    type: 'sketch',
    src: '', // Pending client submission
    alt: 'Hand-drawn academic career roadmap mapping pre-service milestones to PPST career stages',
    width: 1200,
    height: 800,
    caption: 'Personal Career Progression Roadmap — Beginning to Proficient Teacher',
    credit: 'Francois Joshua L. Bajandi',
    artDirection: {
      tilt: 'rotate-0',
      tapeStyle: 'neutral',
      shadow: 'sm',
      crop: 'wide',
    },
  },
  'ep02-school-corridor': {
    id: 'ep02-school-corridor',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Corridor and exterior learning environment of the cooperating high school',
    width: 1200,
    height: 800,
    caption: 'Campus Circulation Aisle & Department Corridor',
    credit: 'Documentary Observation Log',
    artDirection: {
      tilt: '-rotate-1',
      tapeStyle: 'neutral',
      shadow: 'md',
      crop: 'wide',
    },
  },
  'ep02-environment-sketch': {
    id: 'ep02-environment-sketch',
    type: 'sketch',
    src: '', // Pending client submission
    alt: 'Student illustration of an ideal secondary English learning studio with dialogic seating',
    width: 1200,
    height: 900,
    caption: 'Ideal English Studio Layout — Designed for Socratic Seminar Circles',
    credit: 'Francois Joshua L. Bajandi',
    artDirection: {
      tilt: 'rotate-0',
      tapeStyle: 'red',
      shadow: 'md',
      crop: 'natural',
    },
  },
  'ep03-learner-groupwork': {
    id: 'ep03-learner-groupwork',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Secondary school learners engaged in peer dyad discussions during English class',
    width: 1200,
    height: 800,
    caption: 'Peer Dyad Interaction: Think-Pair-Share in Action',
    credit: 'Documentary Observation Log',
    artDirection: {
      tilt: 'rotate-1',
      tapeStyle: 'neutral',
      shadow: 'md',
      crop: 'wide',
    },
  },
  'ep04-instructional-board': {
    id: 'ep04-instructional-board',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Instructional whiteboard demonstrating inverted pyramid news lead structure',
    width: 1200,
    height: 800,
    caption: 'Direct Instruction Modeling: Inverted Pyramid Structure',
    credit: 'Classroom Observation Record',
    artDirection: {
      tilt: '-rotate-1',
      tapeStyle: 'neutral',
      shadow: 'md',
      crop: 'wide',
    },
  },
  'ep05-classroom-furniture': {
    id: 'ep05-classroom-furniture',
    type: 'sketch',
    src: '', // Pending client submission
    alt: 'Room 204 furniture layout diagram indicating teacher pacing vector and circulation aisles',
    width: 1400,
    height: 560,
    caption: 'Classroom Floor Plan Schematic (Room 204)',
    credit: 'Francois Joshua L. Bajandi',
    artDirection: {
      tilt: 'rotate-0',
      tapeStyle: 'none',
      shadow: 'sm',
      crop: 'wide',
    },
  },
  'ep06-assessment-rubric': {
    id: 'ep06-assessment-rubric',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Authentic performance task rubric for high school journalism lead drafting',
    width: 1200,
    height: 800,
    caption: 'Analytic Rubric: News Lead Writing & Inverted Pyramid Assessment',
    credit: 'Resource Teacher Material',
    artDirection: {
      tilt: 'rotate-1',
      tapeStyle: 'neutral',
      shadow: 'md',
      crop: 'wide',
    },
  },

  // ---------------------------------------------------------------------------
  // ACT IV: EVIDENCE & APPENDICES
  // ---------------------------------------------------------------------------
  'act4-mentor-portrait': {
    id: 'act4-mentor-portrait',
    type: 'photo',
    src: '', // Pending client submission
    alt: 'Resource Teacher Herson N. Alamo, Teacher VI, Cooperating Teacher in English',
    width: 800,
    height: 1000,
    caption: 'Mr. Herson N. Alamo · Teacher VI (Cooperating Teacher)',
    credit: 'Faculty Archive',
    artDirection: {
      tilt: 'rotate-0',
      tapeStyle: 'none',
      shadow: 'lg',
      crop: 'tall',
    },
  },
};
