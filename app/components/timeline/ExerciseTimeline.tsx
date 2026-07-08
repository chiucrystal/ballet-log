'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineBlock, TimelineTrack } from '@/lib/timeline-types'

const UNIT_PX = 34 // px per half-count grid unit, along the vertical (time) axis
const PICKUP_UNITS = 2 // half-count units before count 1 of the phrase
const MIN_DURATION = 1
const DEFAULT_PHRASE_LENGTH = 8 // counts per phrase, when phraseBreaks isn't given explicitly

function snap(raw: number) {
  return Math.round(raw)
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

function isPickupRange(start: number, duration: number) {
  return start + duration <= PICKUP_UNITS
}

/** Unit positions where the on-screen count resets to 1 (e.g. every 8 counts). Always starts at PICKUP_UNITS. */
function defaultPhraseBreaks(totalUnits: number, phraseLength: number) {
  const breaks: number[] = []
  const step = phraseLength * 2
  for (let b = PICKUP_UNITS; b < totalUnits; b += step) breaks.push(b)
  return breaks
}

function phraseStartFor(u: number, breaks: number[]) {
  let b = breaks[0]
  for (const brk of breaks) {
    if (brk <= u) b = brk
    else break
  }
  return b
}

function unitLabel(u: number, breaks: number[]): string | null {
  if (u < breaks[0]) return null
  const b = phraseStartFor(u, breaks)
  const n = Math.floor((u - b) / 2) + 1
  return (u - b) % 2 === 0 ? String(n) : '&'
}

/** Free gap in `blocks` (a single track) that contains `anchor`, excluding `excludeId`. */
function freeRange(blocks: TimelineBlock[], excludeId: string | undefined, anchor: number, totalUnits: number) {
  let lo = 0
  let hi = totalUnits
  for (const b of blocks) {
    if (b.id === excludeId) continue
    const start = b.startCount
    const end = b.startCount + b.durationCount
    if (end <= anchor && end > lo) lo = end
    if (start >= anchor && start < hi) hi = start
  }
  return { lo, hi }
}

function blockAt(blocks: TimelineBlock[], unit: number) {
  return blocks.find((b) => unit >= b.startCount && unit < b.startCount + b.durationCount)
}

type DragState =
  | { kind: 'create'; track: TimelineTrack; start: number; end: number; lo: number; hi: number }
  | { kind: 'move'; track: TimelineTrack; id: string; anchorUnit: number; originalStart: number; duration: number; lo: number; hi: number; start: number }
  | {
      kind: 'resize'
      track: TimelineTrack
      id: string
      edge: 'start' | 'end' // 'start' = the edge nearer count 1, 'end' = the edge further away
      anchorUnit: number
      originalStart: number
      originalDuration: number
      lo: number
      hi: number
      start: number
      duration: number
    }

interface PendingTerm {
  track: TimelineTrack
  id: string | null // null = new block, string = renaming an existing block
  startCount: number
  durationCount: number
  value: string
}

export interface ExerciseTimelineProps {
  mode: 'author' | 'studio'
  legTrack: TimelineBlock[]
  armTrack: TimelineBlock[]
  onLegTrackChange?: (blocks: TimelineBlock[]) => void
  onArmTrackChange?: (blocks: TimelineBlock[]) => void
  /** Length of the danced phrase in whole counts (excludes the pickup lead-in). */
  totalCounts?: number
  /** Counts per on-screen phrase, for the common case where every phrase is the same length. Default 8. */
  phraseLength?: number
  /**
   * Explicit unit positions where the displayed count resets to 1, for exercises whose phrases
   * aren't a uniform length (e.g. a 4-count intro before the first 8-count phrase). Overrides phraseLength.
   */
  phraseBreaks?: number[]
}

export function ExerciseTimeline({
  mode,
  legTrack,
  armTrack,
  onLegTrackChange,
  onArmTrackChange,
  totalCounts = 16,
  phraseLength = DEFAULT_PHRASE_LENGTH,
  phraseBreaks,
}: ExerciseTimelineProps) {
  const totalUnits = PICKUP_UNITS + totalCounts * 2
  const gridHeight = totalUnits * UNIT_PX
  const breaks = phraseBreaks ?? defaultPhraseBreaks(totalUnits, phraseLength)

  const legColRef = useRef<HTMLDivElement>(null)
  const armColRef = useRef<HTMLDivElement>(null)

  const [drag, setDrag] = useState<DragState | null>(null)
  const [pending, setPending] = useState<PendingTerm | null>(null)
  const [selected, setSelected] = useState<{ track: TimelineTrack; id: string } | null>(null)
  const [expanded, setExpanded] = useState<{ track: TimelineTrack; id: string } | null>(null)
  const longPress = useRef<{ timer: ReturnType<typeof setTimeout>; moved: boolean } | null>(null)

  const tracksOf = (track: TimelineTrack) => (track === 'leg' ? legTrack : armTrack)
  const colRefOf = (track: TimelineTrack) => (track === 'leg' ? legColRef : armColRef)

  function updateTrack(track: TimelineTrack, updater: (blocks: TimelineBlock[]) => TimelineBlock[]) {
    const setter = track === 'leg' ? onLegTrackChange : onArmTrackChange
    setter?.(updater(tracksOf(track)))
  }

  function unitFromClientY(track: TimelineTrack, clientY: number) {
    const rect = colRefOf(track).current?.getBoundingClientRect()
    const raw = rect ? (clientY - rect.top) / UNIT_PX : 0
    return clamp(snap(raw), 0, totalUnits)
  }

  function clearLongPress() {
    if (longPress.current) {
      clearTimeout(longPress.current.timer)
      longPress.current = null
    }
  }

  // ---- create ----
  function onColPointerDown(track: TimelineTrack, e: React.PointerEvent<HTMLDivElement>) {
    if (mode !== 'author' || e.button !== 0) return
    const anchor = unitFromClientY(track, e.clientY)
    if (blockAt(tracksOf(track), anchor)) return // let the block's own handler deal with it
    const { lo, hi } = freeRange(tracksOf(track), undefined, anchor, totalUnits)
    if (hi - lo < MIN_DURATION) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelected(null)
    setDrag({ kind: 'create', track, start: anchor, end: anchor, lo, hi })
  }

  function onColPointerMove(track: TimelineTrack, e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.kind !== 'create' || drag.track !== track) return
    const raw = unitFromClientY(track, e.clientY)
    setDrag({ ...drag, end: clamp(raw, drag.lo, drag.hi) })
  }

  function onColPointerUp(track: TimelineTrack) {
    if (!drag || drag.kind !== 'create' || drag.track !== track) return
    const start = Math.min(drag.start, drag.end)
    const duration = Math.max(MIN_DURATION, Math.abs(drag.end - drag.start) + 1)
    setDrag(null)
    setPending({ track, id: null, startCount: start, durationCount: duration, value: '' })
  }

  // ---- move / resize ----
  function beginMove(track: TimelineTrack, block: TimelineBlock, e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    if (mode !== 'author') return
    const { lo, hi } = freeRange(tracksOf(track), block.id, block.startCount, totalUnits)
    const anchorUnit = unitFromClientY(track, e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ kind: 'move', track, id: block.id, anchorUnit, originalStart: block.startCount, duration: block.durationCount, lo, hi, start: block.startCount })
    longPress.current = {
      moved: false,
      timer: setTimeout(() => {
        if (longPress.current && !longPress.current.moved) {
          updateTrack(track, (blocks) => blocks.filter((b) => b.id !== block.id))
          setDrag(null)
        }
      }, 550),
    }
  }

  function onBlockPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.kind !== 'move') return
    const raw = unitFromClientY(drag.track, e.clientY)
    const delta = raw - drag.anchorUnit
    if (Math.abs(delta) > 0 && longPress.current) longPress.current.moved = true
    const newStart = clamp(drag.originalStart + delta, drag.lo, drag.hi - drag.duration)
    setDrag({ ...drag, start: newStart })
  }

  function onBlockPointerUp(e: React.PointerEvent<HTMLDivElement>, block: TimelineBlock) {
    if (!drag || drag.kind !== 'move') return
    const track = drag.track
    const moved = longPress.current?.moved ?? false
    clearLongPress()
    const finalStart = drag.start
    setDrag(null)
    if (!moved) {
      // quick tap: toggle selection instead of committing a move
      setSelected((prev) => (prev && prev.id === block.id ? null : { track, id: block.id }))
      return
    }
    if (finalStart === drag.originalStart) return
    updateTrack(track, (blocks) =>
      blocks.map((b) => (b.id === block.id ? { ...b, startCount: finalStart, isPickup: isPickupRange(finalStart, b.durationCount) } : b))
    )
  }

  function beginResize(track: TimelineTrack, block: TimelineBlock, edge: 'start' | 'end', e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    if (mode !== 'author') return
    const anchor = edge === 'start' ? block.startCount : block.startCount + block.durationCount
    const { lo, hi } = freeRange(tracksOf(track), block.id, anchor, totalUnits)
    const anchorUnit = unitFromClientY(track, e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({
      kind: 'resize',
      track,
      id: block.id,
      edge,
      anchorUnit,
      originalStart: block.startCount,
      originalDuration: block.durationCount,
      lo,
      hi,
      start: block.startCount,
      duration: block.durationCount,
    })
  }

  function onResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.kind !== 'resize') return
    const raw = unitFromClientY(drag.track, e.clientY)
    const delta = raw - drag.anchorUnit
    if (drag.edge === 'start') {
      const newStart = clamp(drag.originalStart + delta, drag.lo, drag.originalStart + drag.originalDuration - MIN_DURATION)
      setDrag({ ...drag, start: newStart, duration: drag.originalStart + drag.originalDuration - newStart })
    } else {
      const newEnd = clamp(drag.originalStart + drag.originalDuration + delta, drag.originalStart + MIN_DURATION, drag.hi)
      setDrag({ ...drag, duration: newEnd - drag.originalStart })
    }
  }

  function onResizePointerUp(block: TimelineBlock) {
    if (!drag || drag.kind !== 'resize') return
    const track = drag.track
    const { start, duration } = drag
    setDrag(null)
    if (start === drag.originalStart && duration === drag.originalDuration) return
    updateTrack(track, (blocks) =>
      blocks.map((b) => (b.id === block.id ? { ...b, startCount: start, durationCount: duration, isPickup: isPickupRange(start, duration) } : b))
    )
  }

  // ---- term entry ----
  function commitPending() {
    if (!pending) return
    const term = pending.value.trim()
    if (!term) {
      setPending(null)
      return
    }
    if (pending.id === null) {
      updateTrack(pending.track, (blocks) => [
        ...blocks,
        {
          id: crypto.randomUUID(),
          track: pending.track,
          startCount: pending.startCount,
          durationCount: pending.durationCount,
          term,
          isPickup: isPickupRange(pending.startCount, pending.durationCount),
        },
      ])
    } else {
      updateTrack(pending.track, (blocks) => blocks.map((b) => (b.id === pending.id ? { ...b, term } : b)))
    }
    setPending(null)
  }

  function deleteBlock(track: TimelineTrack, id: string) {
    updateTrack(track, (blocks) => blocks.filter((b) => b.id !== id))
    setSelected(null)
  }

  function onKeyDownBlock(e: React.KeyboardEvent, track: TimelineTrack, id: string) {
    if (mode !== 'author') return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      deleteBlock(track, id)
    } else if (e.key === 'Enter') {
      const block = tracksOf(track).find((b) => b.id === id)
      if (block) setPending({ track, id, startCount: block.startCount, durationCount: block.durationCount, value: block.term })
    }
  }

  function renderTrackColumn(track: TimelineTrack) {
    const blocks = tracksOf(track)
    const previewDrag = drag && drag.track === track ? drag : null

    return (
      <div
        ref={colRefOf(track)}
        className="relative flex-1 min-w-0 select-none touch-none"
        style={{
          height: gridHeight,
          backgroundImage: [
            `repeating-linear-gradient(to bottom, color-mix(in oklch, var(--border), transparent 25%) 0, color-mix(in oklch, var(--border), transparent 25%) 1px, transparent 1px, transparent ${UNIT_PX * 2}px)`,
            `repeating-linear-gradient(to bottom, color-mix(in oklch, var(--border), transparent 65%) 0, color-mix(in oklch, var(--border), transparent 65%) 1px, transparent 1px, transparent ${UNIT_PX}px)`,
          ].join(', '),
          backgroundColor: 'var(--muted)',
        }}
        onPointerDown={(e) => onColPointerDown(track, e)}
        onPointerMove={(e) => onColPointerMove(track, e)}
        onPointerUp={() => onColPointerUp(track)}
      >
        {/* phrase dividers — the first marks count 1, later ones mark where the next phrase starts */}
        {breaks.map((b, i) => (
          <div
            key={b}
            className={i === 0 ? 'absolute inset-x-0 h-px bg-border' : 'absolute inset-x-0 h-0.5 bg-foreground/30'}
            style={{ top: b * UNIT_PX }}
          />
        ))}

        {previewDrag && previewDrag.kind === 'create' && (
          <div
            className="absolute left-1 right-1 rounded-sm border border-dashed border-primary/60 bg-primary/10"
            style={{
              top: Math.min(previewDrag.start, previewDrag.end) * UNIT_PX + 2,
              height: (Math.abs(previewDrag.end - previewDrag.start) + 1) * UNIT_PX - 4,
            }}
          />
        )}

        {blocks.map((block) => {
          const activeDrag = drag && 'id' in drag && drag.id === block.id ? drag : null
          let start = block.startCount
          let duration = block.durationCount
          if (activeDrag?.kind === 'move') {
            start = activeDrag.start
          } else if (activeDrag?.kind === 'resize') {
            start = activeDrag.start
            duration = activeDrag.duration
          }
          const isSelected = selected?.track === track && selected.id === block.id
          const isExpanded = expanded?.track === track && expanded.id === block.id
          const isEditing = pending?.id === block.id && pending.track === track

          return (
            <div
              key={block.id}
              tabIndex={mode === 'author' ? 0 : -1}
              onKeyDown={(e) => onKeyDownBlock(e, track, block.id)}
              onPointerDown={(e) => beginMove(track, block, e)}
              onPointerMove={onBlockPointerMove}
              onPointerUp={(e) => onBlockPointerUp(e, block)}
              onClick={(e) => {
                if (mode !== 'studio') return
                e.stopPropagation()
                setExpanded((prev) => (prev && prev.id === block.id ? null : { track, id: block.id }))
              }}
              onDoubleClick={(e) => {
                if (mode !== 'author') return
                e.stopPropagation()
                setPending({ track, id: block.id, startCount: block.startCount, durationCount: block.durationCount, value: block.term })
              }}
              className={cn(
                'absolute left-1 right-1 rounded-sm border border-l-4 pl-2 pr-1.5 pt-1.5 pb-1 flex items-start text-sm font-semibold leading-tight outline-none select-none touch-none',
                'transition-shadow',
                block.isPickup
                  ? 'border-dashed border-l-accent-foreground/50 border-accent-foreground/40 text-accent-foreground'
                  : track === 'leg'
                    ? 'bg-primary/15 border-primary/40 border-l-primary text-foreground'
                    : 'bg-accent border-accent-foreground/30 border-l-accent-foreground text-accent-foreground',
                isSelected && 'ring-2 ring-ring',
                mode === 'author' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
              )}
              style={{
                top: start * UNIT_PX + 2,
                height: duration * UNIT_PX - 4,
                backgroundImage: block.isPickup
                  ? 'repeating-linear-gradient(45deg, color-mix(in oklch, var(--accent-foreground), transparent 85%) 0, color-mix(in oklch, var(--accent-foreground), transparent 85%) 4px, transparent 4px, transparent 8px)'
                  : undefined,
              }}
            >
              {isEditing ? (
                <InlineTermInput pending={pending} setPending={setPending} onCommit={commitPending} />
              ) : (
                <span className="truncate">{block.term}</span>
              )}

              {mode === 'author' && (
                <>
                  <div
                    onPointerDown={(e) => beginResize(track, block, 'start', e)}
                    onPointerMove={onResizePointerMove}
                    onPointerUp={() => onResizePointerUp(block)}
                    className="absolute inset-x-0 top-0 h-2 cursor-row-resize"
                  />
                  <div
                    onPointerDown={(e) => beginResize(track, block, 'end', e)}
                    onPointerMove={onResizePointerMove}
                    onPointerUp={() => onResizePointerUp(block)}
                    className="absolute inset-x-0 bottom-0 h-2 cursor-row-resize"
                  />
                  {isSelected && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteBlock(track, block.id)
                      }}
                      className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
                      aria-label="Delete block"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </>
              )}

              {mode === 'studio' && isExpanded && (
                <div className="absolute top-full left-0 z-20 mt-1 max-w-56 rounded-sm border border-border bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md">
                  {block.term}
                </div>
              )}
            </div>
          )
        })}

        {pending && pending.id === null && pending.track === track && (
          <div
            className="absolute left-1 right-1 rounded-sm border border-primary/50 bg-primary/10 pl-2 pr-1.5 pt-1.5 pb-1 flex items-start"
            style={{ top: pending.startCount * UNIT_PX + 2, height: pending.durationCount * UNIT_PX - 4 }}
          >
            <InlineTermInput pending={pending} setPending={setPending} onCommit={commitPending} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      {/* ruler */}
      <div className="w-9 shrink-0">
        <div className="h-7" />
        <div className="relative" style={{ height: gridHeight }}>
          {breaks.map((b, i) => i > 0 && <div key={b} className="absolute inset-x-0 h-0.5 bg-foreground/30" style={{ top: b * UNIT_PX }} />)}
          {Array.from({ length: totalUnits }).map((_, u) => {
            const label = unitLabel(u, breaks)
            if (label === null) return null
            const isPhraseStart = label === '1'
            return (
              <span
                key={u}
                className={cn(
                  'absolute right-0 -translate-y-1/2 tabular-nums',
                  label === '&'
                    ? 'text-xs text-muted-foreground/60'
                    : isPhraseStart
                      ? 'text-sm font-bold text-foreground'
                      : 'text-sm font-semibold text-muted-foreground',
                )}
                style={{ top: u * UNIT_PX }}
              >
                {label}
              </span>
            )
          })}
          <span className="absolute top-0 -translate-y-1/2 text-[8px] uppercase tracking-widest text-muted-foreground/40">
            pickup
          </span>
        </div>
      </div>

      {/* track columns */}
      <div className="flex-1 min-w-0">
        <div className="flex h-7 items-end pb-1">
          <div className="flex-1 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Leg</div>
          <div className="flex-1 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Arm</div>
        </div>
        <div className="flex gap-2">
          {renderTrackColumn('leg')}
          {renderTrackColumn('arm')}
        </div>
      </div>
    </div>
  )
}

/** Edits a block's term in place, in the same slot the label normally occupies. */
function InlineTermInput({
  pending,
  setPending,
  onCommit,
}: {
  pending: PendingTerm
  setPending: (p: PendingTerm | null) => void
  onCommit: () => void
}) {
  return (
    <input
      autoFocus
      value={pending.value}
      onChange={(e) => setPending({ ...pending, value: e.target.value })}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') onCommit()
        if (e.key === 'Escape') setPending(null)
      }}
      onBlur={onCommit}
      placeholder="Term…"
      className="w-full min-w-0 bg-transparent text-sm font-semibold leading-tight outline-none placeholder:text-muted-foreground"
    />
  )
}
