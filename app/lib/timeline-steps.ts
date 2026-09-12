import {
  DEFAULT_PHRASE_LENGTH,
  DEFAULT_UNITS_PER_COUNT,
  defaultPhraseBreaks,
  phraseStartFor,
  unitLabelFor,
  type TimelineBlock,
} from './timeline-types'

export interface StepRow {
  key: number
  counts: string
  step: string
  armsHead: string
}

function fullUnitLabel(u: number, breaks: number[], unitsPerCount: number): string {
  const b = phraseStartFor(u, breaks)
  return unitLabelFor(u - b, unitsPerCount)
}

/**
 * A block that ends on a count's last subdivision (the "&" in a simple meter, or the "a" in 6/8)
 * has danced through the whole count — so the end of its range is just that count's number, not
 * "N&"/"Na". The subdivision is only shown when the block genuinely stops partway through a count.
 */
function blockCountLabel(block: TimelineBlock, breaks: number[], unitsPerCount: number): string {
  if (block.isPickup) return 'pickup'
  const startU = block.startCount
  const endU = block.startCount + block.durationCount - 1
  const startLabel = fullUnitLabel(startU, breaks, unitsPerCount)
  if (startU === endU) return startLabel

  const endOffset = endU - phraseStartFor(endU, breaks)
  const endsOnLastSubdivision = endOffset % unitsPerCount === unitsPerCount - 1
  const endLabel = endsOnLastSubdivision
    ? String(Math.floor(endOffset / unitsPerCount) + 1)
    : fullUnitLabel(endU, breaks, unitsPerCount)

  return startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`
}

/** Highest occupied unit across both tracks, used to size the grid with a little headroom. */
export function maxOccupiedUnit(legTrack: TimelineBlock[], armTrack: TimelineBlock[]): number {
  return Math.max(0, ...[...legTrack, ...armTrack].map((b) => b.startCount + b.durationCount))
}

/** Grid length (in whole counts) sized to fit the current blocks, padded by one phrase, with a sane minimum. */
export function fitTotalCounts(
  legTrack: TimelineBlock[],
  armTrack: TimelineBlock[],
  phraseLength = DEFAULT_PHRASE_LENGTH,
  unitsPerCount = DEFAULT_UNITS_PER_COUNT
): number {
  const maxUnit = maxOccupiedUnit(legTrack, armTrack)
  const minCounts = phraseLength * 4
  const padded = Math.ceil((maxUnit + phraseLength * unitsPerCount) / (phraseLength * unitsPerCount)) * phraseLength
  return Math.max(minCounts, padded)
}

/**
 * Leg track is the spine: one row per leg block, counts formatted phrase-relative (matching what's
 * on screen). Arm blocks overlapping a leg block's range fold into that row's armsHead; an arm block
 * with no overlapping leg block gets its own "Hold" row so nothing silently drops on save.
 */
export function blocksToStepRows(
  legTrack: TimelineBlock[],
  armTrack: TimelineBlock[],
  phraseLength = DEFAULT_PHRASE_LENGTH,
  unitsPerCount = DEFAULT_UNITS_PER_COUNT
): StepRow[] {
  const totalUnits = maxOccupiedUnit(legTrack, armTrack) + phraseLength * unitsPerCount
  const breaks = defaultPhraseBreaks(totalUnits, phraseLength, unitsPerCount)

  const usedArmIds = new Set<string>()
  const rows: (StepRow & { sortKey: number })[] = []
  let key = 0

  for (const leg of [...legTrack].sort((a, b) => a.startCount - b.startCount)) {
    const legEnd = leg.startCount + leg.durationCount
    const overlapping = armTrack
      .filter((a) => a.startCount < legEnd && a.startCount + a.durationCount > leg.startCount)
      .sort((a, b) => a.startCount - b.startCount)
    overlapping.forEach((a) => usedArmIds.add(a.id))
    rows.push({
      key: key++,
      counts: blockCountLabel(leg, breaks, unitsPerCount),
      step: leg.term,
      armsHead: overlapping.map((a) => a.term).join('; '),
      sortKey: leg.startCount,
    })
  }

  for (const arm of armTrack.filter((a) => !usedArmIds.has(a.id))) {
    rows.push({
      key: key++,
      counts: blockCountLabel(arm, breaks, unitsPerCount),
      step: 'Hold',
      armsHead: arm.term,
      sortKey: arm.startCount,
    })
  }

  return rows.sort((a, b) => a.sortKey - b.sortKey).map((row) => ({ key: row.key, counts: row.counts, step: row.step, armsHead: row.armsHead }))
}

function parseCountToken(tok: string, unitsPerCount: number): { n: number; sub: number } | null {
  const t = tok.trim()
  const trailing = t.match(/^(\d+)(&|a)?$/) // "4", "4&", "4a" (the "a" subdivision only occurs in 6/8)
  if (trailing) {
    const suffix = trailing[2]
    return { n: parseInt(trailing[1], 10), sub: suffix === 'a' ? 2 : suffix === '&' ? 1 : 0 }
  }
  const leading = t.match(/^&(\d+)$/) // "&4" — the upbeat before count 4, i.e. "3&"
  if (leading) {
    const n = parseInt(leading[1], 10)
    return n > 1 ? { n: n - 1, sub: unitsPerCount - 1 } : { n: 1, sub: 0 }
  }
  return null
}

/** Local unit offset from the start of a phrase (count 1 = offset 0). */
function localOffset(tok: { n: number; sub: number }, unitsPerCount: number) {
  return (tok.n - 1) * unitsPerCount + tok.sub
}

function parseCountsRange(
  counts: string,
  unitsPerCount: number
): { startTok: { n: number; sub: number }; endTok: { n: number; sub: number } } | null {
  const parts = counts.split('-').map((s) => s.trim()).filter(Boolean)
  if (parts.length === 1) {
    const a = parseCountToken(parts[0], unitsPerCount)
    return a ? { startTok: a, endTok: a } : null
  }
  if (parts.length === 2) {
    const a = parseCountToken(parts[0], unitsPerCount)
    const b = parseCountToken(parts[1], unitsPerCount)
    return a && b ? { startTok: a, endTok: b } : null
  }
  return null
}

/**
 * Best-effort reverse of blocksToStepRows, for loading a combination saved under the old
 * row-based UI into the timeline. Counts text is free-form ("1-2", "a4&a", blank), so this
 * heuristically detects a new phrase whenever the parsed count resets to something <= the
 * previous row's, and falls back to placing unparseable rows sequentially rather than dropping
 * them — exact grid position may need a manual nudge afterward, but nothing is lost.
 */
export function stepRowsToBlocks(
  steps: { counts: string | null; step: string; armsHead: string | null }[],
  phraseLength = DEFAULT_PHRASE_LENGTH,
  unitsPerCount = DEFAULT_UNITS_PER_COUNT
): { legTrack: TimelineBlock[]; armTrack: TimelineBlock[] } {
  const legTrack: TimelineBlock[] = []
  const armTrack: TimelineBlock[] = []

  const pickup = unitsPerCount
  let phraseBase = pickup
  let lastLocalStart = -1
  let cursor = pickup

  steps.forEach((step, i) => {
    const parsed = parseCountsRange(step.counts ?? '', unitsPerCount)
    let startAbs: number
    let endAbs: number

    if (parsed) {
      const localStart = localOffset(parsed.startTok, unitsPerCount)
      const localEnd = localOffset(parsed.endTok, unitsPerCount)
      if (localStart <= lastLocalStart) phraseBase += phraseLength * unitsPerCount
      startAbs = phraseBase + localStart
      endAbs = phraseBase + localEnd
      lastLocalStart = localStart
    } else {
      startAbs = cursor
      endAbs = cursor + 1
    }

    const duration = Math.max(1, endAbs - startAbs + 1)
    cursor = startAbs + duration

    if (step.step.trim()) {
      legTrack.push({ id: `leg-${i}`, track: 'leg', startCount: startAbs, durationCount: duration, term: step.step })
    }
    if (step.armsHead?.trim()) {
      armTrack.push({ id: `arm-${i}`, track: 'arm', startCount: startAbs, durationCount: duration, term: step.armsHead })
    }
  })

  return { legTrack, armTrack }
}
