'use client'

import { useState } from 'react'
import { ExerciseTimeline } from '@/components/timeline/ExerciseTimeline'
import { TagStep } from '@/components/timeline/TagStep'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineBlock } from '@/lib/timeline-types'

const SEED_LEG_TRACK: TimelineBlock[] = [
  { id: 'l1', track: 'leg', startCount: 1, durationCount: 1, term: 'Pas de bourrée couru', isPickup: true },
  { id: 'l2', track: 'leg', startCount: 2, durationCount: 4, term: 'Chassé en avant' },
  { id: 'l3', track: 'leg', startCount: 6, durationCount: 1, term: 'Coupé dessous' },
  { id: 'l4', track: 'leg', startCount: 7, durationCount: 3, term: 'Assemblé dessus' },
  { id: 'l5', track: 'leg', startCount: 14, durationCount: 4, term: 'Sissonne fermée de côté' },
  { id: 'l6', track: 'leg', startCount: 18, durationCount: 2, term: 'Pas de bourrée dessous' },
  { id: 'l7', track: 'leg', startCount: 20, durationCount: 6, term: 'Piqué arabesque' },
  { id: 'l8', track: 'leg', startCount: 28, durationCount: 4, term: 'Chassé de côté' },
]

const SEED_ARM_TRACK: TimelineBlock[] = [
  { id: 'a1', track: 'arm', startCount: 2, durationCount: 8, term: 'Bras bas through to 2nd' },
  { id: 'a2', track: 'arm', startCount: 14, durationCount: 12, term: 'Arms to 1st, right arm raised' },
  { id: 'a3', track: 'arm', startCount: 28, durationCount: 4, term: 'Left arm to 2nd, palm up' },
]

const SEED_TAGS = ['Assemblé dessus', 'Piqué']

export function TimelineDemoClient({ seedVocab }: { seedVocab: string[] }) {
  const [mode, setMode] = useState<'author' | 'studio'>('author')
  const [legTrack, setLegTrack] = useState<TimelineBlock[]>(SEED_LEG_TRACK)
  const [armTrack, setArmTrack] = useState<TimelineBlock[]>(SEED_ARM_TRACK)
  const [tags, setTags] = useState<string[]>(SEED_TAGS)
  const [personalTags, setPersonalTags] = useState<string[]>([])
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
          Drag on an empty grid cell to draw a block, release to name it. Drag a block&apos;s body to move it, its edges
          to resize it. Click a block to select it (× appears), long-press to delete, double-click to rename. The
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
        totalCounts={16}
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
