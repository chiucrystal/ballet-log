export interface Correction {
  text: string
  theme: string
  exercise: string | null
}

export interface HomeExercise {
  name: string
  notes: string
  use: string
}

export interface Session {
  date: string
  context: string
  corrections: Correction[]
  homeExercises: HomeExercise[]
  openQuestions: string[]
}

export interface Priority {
  title: string
  detail: string
}

export interface Theme {
  name: string
  summary: string
  firstNoted: string
  sessionCount: number
  examImpact: boolean
  markCriteria: string[]
  exercises: string[]
  resolvedDate: string | null
}

export interface Exercise {
  code: string
  name: string
  corrections: string[]
}

export interface PhysioNotes {
  itemsToRaise: string[]
  clearanceStatus: string
  restrictions: string[]
}

export interface CorrectionsDoc {
  lastUpdated: string
  priorities: Priority[]
  themes: Theme[]
  exercises: Exercise[]
  physioNotes: PhysioNotes
}
