export type RootCause =
  | 'Outer hip and ankle stability'
  | 'Foot intrinsics and arch'
  | 'Pelvic alignment'
  | 'Shoulder girdle and épaulement'
  | 'Pirouette axis and preparation'
  | 'Arabesque mechanics'
  | 'Opposition and length under load'
  | 'Weight placement and balance';

export type ExerciseCode = 'AF-10' | 'AF-11F' | 'AF-12' | 'AF-25';

export type SessionSource = 'teacher' | 'private' | 'physio';

export interface TopPriority {
  rank: number;
  title: string;
  rootCause: RootCause;
  description: string;
  whyNow: string;
}

export interface Pattern {
  id: string;
  pattern: string;
  rootCause: RootCause;
  firstNoted: string;
  sessions: number;
  exercisesAffected: ExerciseCode[];
  examImpact: string;
}

export interface ExerciseCorrection {
  code: ExerciseCode;
  name: string;
  corrections: {
    criterion: string;
    notes: string;
  }[];
}

export interface SessionBlock {
  rootCause: RootCause;
  bullets: string[];
  exercisesTagged?: ExerciseCode[];
}

export interface SessionEntry {
  date: string;
  source: SessionSource;
  corrections: SessionBlock[];
}

export interface PhysioNote {
  date: string;
  practitioner: string;
  notes: string[];
}
