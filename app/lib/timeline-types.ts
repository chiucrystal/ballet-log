export type TimelineTrack = 'leg' | 'arm'

export interface TimelineBlock {
  id: string
  track: TimelineTrack
  startCount: number // half-count units. count 3 = 6, count 3& = 7
  durationCount: number // half-count units, minimum 1
  term: string // free text, no vocab-id matching for MVP
  isPickup?: boolean // true if this block precedes count 1 of a phrase
}

export interface TimelineExerciseData {
  tags: string[]
  legTrack: TimelineBlock[]
  armTrack: TimelineBlock[]
}
