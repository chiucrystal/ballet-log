'use client'

import { useState } from 'react'
import { ExerciseTimeline } from '@/components/timeline/ExerciseTimeline'
import { TagStep } from '@/components/timeline/TagStep'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineBlock } from '@/lib/timeline-types'

// AF-01: Pliés — Male and Female. Transcribed from the syllabus table: a 4-count intro
// (its own short phrase, not 8 counts) followed by 8 phrases of 8 counts each, three of
// which are literal "repeat counts 1-8 in [2nd/4th/5th]" instructions with no per-step
// detail in the source. Sub-count anacrusis notation ("a4&a", trailing "a") is collapsed
// to the nearest half-count, per spec — this MVP grid doesn't resolve finer than that.
const SEED_LEG_TRACK: TimelineBlock[] = [
  // Intro (counts 1-4)
  { id: 'l-intro', track: 'leg', startCount: 2, durationCount: 8, term: 'Hold' },
  // Phrase 1 (counts 1-8): Grand plié
  { id: 'l-a1', track: 'leg', startCount: 10, durationCount: 4, term: 'Demi-plié' },
  { id: 'l-a2', track: 'leg', startCount: 14, durationCount: 2, term: 'Rise' },
  { id: 'l-a3', track: 'leg', startCount: 16, durationCount: 2, term: 'Lower heels & demi-plié' },
  { id: 'l-a4', track: 'leg', startCount: 18, durationCount: 8, term: 'Grand plié' },
  // Phrase 2 (counts 1-8): port de bras + close 2nd
  { id: 'l-b1', track: 'leg', startCount: 26, durationCount: 4, term: 'Hold' },
  { id: 'l-b2', track: 'leg', startCount: 30, durationCount: 4, term: 'Hold' },
  { id: 'l-b3', track: 'leg', startCount: 34, durationCount: 2, term: 'Rise' },
  { id: 'l-b4', track: 'leg', startCount: 36, durationCount: 2, term: 'Lower heels & demi-plié' },
  { id: 'l-b5', track: 'leg', startCount: 38, durationCount: 2, term: 'Dégagé to 2nd, straighten' },
  { id: 'l-b6', track: 'leg', startCount: 40, durationCount: 2, term: 'Lower heel in 2nd' },
  // Phrase 3 (counts 1-8): repeat in 2nd
  { id: 'l-c1', track: 'leg', startCount: 42, durationCount: 16, term: 'Repeat counts 1–8 in 2nd' },
  // Phrase 4 (counts 1-8): rond de jambe, turn to other side
  { id: 'l-d1', track: 'leg', startCount: 58, durationCount: 4, term: 'Hold' },
  { id: 'l-d2', track: 'leg', startCount: 62, durationCount: 4, term: 'Hold' },
  { id: 'l-d3', track: 'leg', startCount: 66, durationCount: 2, term: 'Rise' },
  { id: 'l-d4', track: 'leg', startCount: 68, durationCount: 2, term: 'Lower heels & demi-plié' },
  { id: 'l-d5', track: 'leg', startCount: 70, durationCount: 1, term: 'Demi rond de jambe à terre en dedans' },
  { id: 'l-d6', track: 'leg', startCount: 71, durationCount: 2, term: 'Demi-plié in 4th, turn to other side' },
  { id: 'l-d7', track: 'leg', startCount: 73, durationCount: 1, term: 'Lower heel in 4th', isPickup: true },
  // Phrase 5 (counts 1-8): repeat in 4th
  { id: 'l-e1', track: 'leg', startCount: 74, durationCount: 16, term: 'Repeat counts 1–8 in 4th' },
  // Phrase 6 (counts 1-8): dégagé, close 5th
  { id: 'l-f1', track: 'leg', startCount: 90, durationCount: 8, term: 'Hold' },
  { id: 'l-f2', track: 'leg', startCount: 98, durationCount: 2, term: 'Rise' },
  { id: 'l-f3', track: 'leg', startCount: 100, durationCount: 2, term: 'Lower heels & demi-plié' },
  { id: 'l-f4', track: 'leg', startCount: 102, durationCount: 2, term: 'Dégagé devant, straighten' },
  { id: 'l-f5', track: 'leg', startCount: 104, durationCount: 2, term: 'Close 5th' },
  // Phrase 7 (counts 1-8): repeat in 5th
  { id: 'l-g1', track: 'leg', startCount: 106, durationCount: 16, term: 'Repeat counts 1–8 in 5th' },
  // Phrase 8 (counts 1-8): half turn, arabesque line
  { id: 'l-h1', track: 'leg', startCount: 122, durationCount: 4, term: 'Rise, draw front foot to 5th' },
  { id: 'l-h2', track: 'leg', startCount: 126, durationCount: 4, term: 'Hold' },
  { id: 'l-h3', track: 'leg', startCount: 130, durationCount: 2, term: 'Half turn to other side' },
  { id: 'l-h4', track: 'leg', startCount: 132, durationCount: 2, term: 'Hold' },
  { id: 'l-h5', track: 'leg', startCount: 134, durationCount: 4, term: 'Hold' },
  // Outro
  { id: 'l-outro', track: 'leg', startCount: 138, durationCount: 2, term: 'Lower heels' },
]

const SEED_ARM_TRACK: TimelineBlock[] = [
  { id: 'a-intro', track: 'arm', startCount: 6, durationCount: 4, term: 'Arm to demi-seconde, bras bas' },
  { id: 'a-a1', track: 'arm', startCount: 10, durationCount: 4, term: 'Arm to 1st' },
  { id: 'a-a2', track: 'arm', startCount: 14, durationCount: 2, term: 'Arm to 5th, eyeline to hand' },
  { id: 'a-a3', track: 'arm', startCount: 16, durationCount: 2, term: 'Arm through 1st, bras bas to 2nd' },
  { id: 'a-a4', track: 'arm', startCount: 18, durationCount: 8, term: 'Arm through bras bas, port de bras to 2nd' },
  { id: 'a-b1', track: 'arm', startCount: 26, durationCount: 4, term: 'Port de bras, forward bend in 5th + recover' },
  { id: 'a-b2', track: 'arm', startCount: 30, durationCount: 4, term: 'Port de bras, back bend in 5th + recover, arm 2nd' },
  { id: 'a-b3', track: 'arm', startCount: 40, durationCount: 2, term: 'Bras bas, head erect' },
  { id: 'a-d1', track: 'arm', startCount: 58, durationCount: 4, term: 'Port de bras, side bend toward barre' },
  { id: 'a-d2', track: 'arm', startCount: 62, durationCount: 4, term: 'Forward bend, arm 5th + recover, arm 2nd' },
  { id: 'a-d3', track: 'arm', startCount: 71, durationCount: 2, term: 'Arm to 2nd, head centre' },
  { id: 'a-d4', track: 'arm', startCount: 73, durationCount: 1, term: 'Bras bas, head erect', isPickup: true },
  { id: 'a-f1', track: 'arm', startCount: 90, durationCount: 8, term: 'Circular port de bras toward barre + recover, arm 2nd' },
  { id: 'a-f2', track: 'arm', startCount: 104, durationCount: 2, term: 'Bras bas, head erect' },
  { id: 'a-h1', track: 'arm', startCount: 122, durationCount: 4, term: 'Arm through bras bas, full port de bras to 5th' },
  { id: 'a-h2', track: 'arm', startCount: 126, durationCount: 4, term: 'Barre arm to 5th' },
  { id: 'a-h3', track: 'arm', startCount: 134, durationCount: 4, term: 'Arms 2nd arabesque line' },
  { id: 'a-outro', track: 'arm', startCount: 138, durationCount: 2, term: 'Bras bas' },
]

// Unit positions where the displayed count resets to 1: the 4-count intro, then eight 8-count phrases.
const PLIES_PHRASE_BREAKS = [2, 10, 26, 42, 58, 74, 90, 106, 122, 138]
const PLIES_TOTAL_COUNTS = 70

// The seeded vocab is free-enchaînement only (see spec's "known gap") — barre content like this
// has no seed tags to pull from, so these come from the custom-tag/personal-library path instead.
const SEED_PERSONAL_TAGS = ['Pliés', 'Barre']
const SEED_TAGS = ['Pliés', 'Barre']

export function TimelineDemoClient({ seedVocab }: { seedVocab: string[] }) {
  const [mode, setMode] = useState<'author' | 'studio'>('author')
  const [legTrack, setLegTrack] = useState<TimelineBlock[]>(SEED_LEG_TRACK)
  const [armTrack, setArmTrack] = useState<TimelineBlock[]>(SEED_ARM_TRACK)
  const [tags, setTags] = useState<string[]>(SEED_TAGS)
  const [personalTags, setPersonalTags] = useState<string[]>(SEED_PERSONAL_TAGS)
  const [showData, setShowData] = useState(false)

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('author')}
          className={cn(
            'rounded-sm px-3 py-1 text-xs font-medium transition-colors',
            mode === 'author' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Authoring
        </button>
        <button
          type="button"
          onClick={() => setMode('studio')}
          className={cn(
            'rounded-sm px-3 py-1 text-xs font-medium transition-colors',
            mode === 'studio' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Studio (read-only)
        </button>
      </div>

      {mode === 'author' ? (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          Seeded with AF-01 Pliés. Counts restart at 1 every phrase (a thicker line marks where the next one
          starts) — this exercise&apos;s 4-count intro is its own short phrase before the 8-count phrases begin. Drag
          on an empty grid cell to draw a block, release to name it. Drag a block&apos;s body to move it, its edges to
          resize it. Click a block to select it (× appears), long-press to delete, double-click to rename. The
          hatched block is a pickup — modeled with <code className="text-[11px]">isPickup</code>, not a finer grid.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          Same component, same data, read-only. No drag, resize, or create affordances — tap a block to see its full
          term if truncated.
        </p>
      )}

      <ExerciseTimeline
        mode={mode}
        legTrack={legTrack}
        armTrack={armTrack}
        onLegTrackChange={setLegTrack}
        onArmTrackChange={setArmTrack}
        totalCounts={PLIES_TOTAL_COUNTS}
        phraseBreaks={PLIES_PHRASE_BREAKS}
      />

      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
          Tags <span className="normal-case text-muted-foreground/50">— applied once, at the exercise level</span>
        </h2>
        <TagStep
          seedTags={seedVocab}
          personalTags={personalTags}
          selected={tags}
          onSelectedChange={setTags}
          onAddPersonalTag={(tag) => setPersonalTags((prev) => [...prev, tag])}
        />
      </div>

      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowData((v) => !v)}>
          {showData ? 'Hide' : 'Show'} underlying data model
        </Button>
        {showData && (
          <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed">
            {JSON.stringify({ tags, legTrack, armTrack }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
