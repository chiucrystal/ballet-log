export const DEFAULT_UNITS_PER_COUNT = 2 // grid units per count for simple meters: "1", "1&"
export const DEFAULT_PHRASE_LENGTH = 8 // counts per phrase, when no explicit phraseBreaks is given

export const TIME_SIGNATURES = ['3/4', '4/4', '6/8'] as const
export type TimeSignature = (typeof TIME_SIGNATURES)[number]

/**
 * Grid units per count. Simple meters (3/4, 4/4) split each count into 2 ("1", "1&"). 6/8 is compound
 * duple — each count is a dotted-quarter pulse split into 3 eighth notes ("1", "1&", "1a").
 */
export function unitsPerCountFor(timeSignature?: string | null): number {
  return timeSignature === '6/8' ? 3 : DEFAULT_UNITS_PER_COUNT
}

export type TimelineTrack = 'leg' | 'arm'

export interface TimelineBlock {
  id: string
  track: TimelineTrack
  startCount: number // grid units (2 or 3 per count depending on meter). count 3 = 6, count 3& = 7 in a simple meter
  durationCount: number // grid units, minimum 1
  term: string // free text, no vocab-id matching for MVP
  isPickup?: boolean // true if this block precedes count 1 of a phrase
}

export interface TimelineExerciseData {
  tags: string[]
  legTrack: TimelineBlock[]
  armTrack: TimelineBlock[]
}

/** Unit positions where the on-screen count resets to 1 (e.g. every 8 counts). Always starts at one count's pickup. */
export function defaultPhraseBreaks(
  totalUnits: number,
  phraseLength: number = DEFAULT_PHRASE_LENGTH,
  unitsPerCount: number = DEFAULT_UNITS_PER_COUNT
) {
  const pickup = unitsPerCount // one count's worth of lead-in
  const breaks: number[] = []
  const step = phraseLength * unitsPerCount
  for (let b = pickup; b < totalUnits; b += step) breaks.push(b)
  return breaks.length > 0 ? breaks : [pickup]
}

export function phraseStartFor(u: number, breaks: number[]) {
  let b = breaks[0]
  for (const brk of breaks) {
    if (brk <= u) b = brk
    else break
  }
  return b
}

/** The on-screen label for a single grid unit: "N", "N&", or (6/8 only) "Na". */
export function unitLabelFor(offsetInPhrase: number, unitsPerCount: number): string {
  const n = Math.floor(offsetInPhrase / unitsPerCount) + 1
  const sub = offsetInPhrase % unitsPerCount
  if (sub === 0) return String(n)
  if (unitsPerCount === 3) return sub === 1 ? `${n}&` : `${n}a`
  return `${n}&`
}
