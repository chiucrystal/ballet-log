export const PICKUP_UNITS = 2 // half-count units reserved before count 1 of the first phrase
export const DEFAULT_PHRASE_LENGTH = 8 // counts per phrase, when no explicit phraseBreaks is given

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

/** Unit positions where the on-screen count resets to 1 (e.g. every 8 counts). Always starts at PICKUP_UNITS. */
export function defaultPhraseBreaks(totalUnits: number, phraseLength: number = DEFAULT_PHRASE_LENGTH) {
  const breaks: number[] = []
  const step = phraseLength * 2
  for (let b = PICKUP_UNITS; b < totalUnits; b += step) breaks.push(b)
  return breaks.length > 0 ? breaks : [PICKUP_UNITS]
}

export function phraseStartFor(u: number, breaks: number[]) {
  let b = breaks[0]
  for (const brk of breaks) {
    if (brk <= u) b = brk
    else break
  }
  return b
}
