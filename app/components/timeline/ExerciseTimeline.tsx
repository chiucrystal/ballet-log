'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineBlock, TimelineTrack } from '@/lib/timeline-types'

const UNIT_PX = 26
const PICKUP_UNITS = 2 // half-count units before count 1 of the phrase
const MIN_DURATION = 1

function snap(raw: number) {
  return Math.round(raw)
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

function isPickupRange(start: number, duration: number) {
  return start + duration <= PICKUP_UNITS
}

function unitLabel(u: number): string | null {
  if (u < PICKUP_UNITS) return null
  const n = Math.floor(u / 2)
  return u % 2 === 0 ? String(n) : '&'
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
      edge: 'left' | 'right'
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
}

export function ExerciseTimeline({
  mode,
  legTrack,
  armTrack,
  onLegTrackChange,
  onArmTrackChange,
  totalCounts = 16,
}: ExerciseTimelineProps) {
  const totalUnits = PICKUP_UNITS + totalCounts * 2
  const gridWidth = totalUnits * UNIT_PX

  const legRowRef = useRef<HTMLDivElement>(null)
  const armRowRef = useRef<HTMLDivElement>(null)

  const [drag, setDrag] = useState<DragState | null>(null)
  const [pending, setPending] = useState<PendingTerm | null>(null)
  const [selected, setSelected] = useState<{ track: TimelineTrack; id: string } | null>(null)
  const [expanded, setExpanded] = useState<{ track: TimelineTrack; id: string } | null>(null)
  const longPress = useRef<{ timer: ReturnType<typeof setTimeout>; moved: boolean } | null>(null)

  const tracksOf = (track: TimelineTrack) => (track === 'leg' ? legTrack : armTrack)
  const rowRefOf = (track: TimelineTrack) => (track === 'leg' ? legRowRef : armRowRef)

  function updateTrack(track: TimelineTrack, updater: (blocks: TimelineBlock[]) => TimelineBlock[]) {
    const setter = track === 'leg' ? onLegTrackChange : onArmTrackChange
    setter?.(updater(tracksOf(track)))
  }

  function unitFromClientX(track: TimelineTrack, clientX: number) {
    const rect = rowRefOf(track).current?.getBoundingClientRect()
    const raw = rect ? (clientX - rect.left) / UNIT_PX : 0
    return clamp(snap(raw), 0, totalUnits)
  }

  function clearLongPress() {
    if (longPress.current) {
      clearTimeout(longPress.current.timer)
      longPress.current = null
    }
  }

  // ---- create ----
  function onRowPointerDown(track: TimelineTrack, e: React.PointerEvent<HTMLDivElement>) {
    if (mode !== 'author' || e.button !== 0) return
    const anchor = unitFromClientX(track, e.clientX)
    if (blockAt(tracksOf(track), anchor)) return // let the block's own handler deal with it
    const { lo, hi } = freeRange(tracksOf(track), undefined, anchor, totalUnits)
    if (hi - lo < MIN_DURATION) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelected(null)
    setDrag({ kind: 'create', track, start: anchor, end: anchor, lo, hi })
  }

  function onRowPointerMove(track: TimelineTrack, e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.kind !== 'create' || drag.track !== track) return
    const raw = unitFromClientX(track, e.clientX)
    setDrag({ ...drag, end: clamp(raw, drag.lo, drag.hi) })
  }

  function onRowPointerUp(track: TimelineTrack) {
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
    const anchorUnit = unitFromClientX(track, e.clientX)
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
    const raw = unitFromClientX(drag.track, e.clientX)
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

  function beginResize(track: TimelineTrack, block: TimelineBlock, edge: 'left' | 'right', e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    if (mode !== 'author') return
    const anchor = edge === 'left' ? block.startCount : block.startCount + block.durationCount
    const { lo, hi } = freeRange(tracksOf(track), block.id, anchor, totalUnits)
    const anchorUnit = unitFromClientX(track, e.clientX)
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
    const raw = unitFromClientX(drag.track, e.clientX)
    const delta = raw - drag.anchorUnit
    if (drag.edge === 'left') {
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

  function renderTrackRow(track: TimelineTrack, label: string) {
    const blocks = tracksOf(track)
    const previewDrag = drag && drag.track === track ? drag : null

    return (
      <div className="flex items-stretch gap-3">
        <div className="w-10 shrink-0 self-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </div>
        <div
          ref={rowRefOf(track)}
          className="relative h-12 rounded-md select-none touch-none"
          style={{
            width: gridWidth,
            backgroundImage: [
              `repeating-linear-gradient(to right, color-mix(in oklch, var(--border), transparent 25%) 0, color-mix(in oklch, var(--border), transparent 25%) 1px, transparent 1px, transparent ${UNIT_PX * 2}px)`,
              `repeating-linear-gradient(to right, color-mix(in oklch, var(--border), transparent 65%) 0, color-mix(in oklch, var(--border), transparent 65%) 1px, transparent 1px, transparent ${UNIT_PX}px)`,
            ].join(', '),
            backgroundColor: 'var(--muted)',
          }}
          onPointerDown={(e) => onRowPointerDown(track, e)}
          onPointerMove={(e) => onRowPointerMove(track, e)}
          onPointerUp={() => onRowPointerUp(track)}
        >
          {/* count-1 divider */}
          <div className="absolute inset-y-0 w-px bg-border" style={{ left: PICKUP_UNITS * UNIT_PX }} />

          {previewDrag && previewDrag.kind === 'create' && (
            <div
              className="absolute top-1 bottom-1 rounded-md border border-dashed border-primary/60 bg-primary/10"
              style={{
                left: Math.min(previewDrag.start, previewDrag.end) * UNIT_PX + 2,
                width: (Math.abs(previewDrag.end - previewDrag.start) + 1) * UNIT_PX - 4,
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
                  'absolute top-1 bottom-1 rounded-md border px-1.5 flex items-center text-[11px] font-medium leading-tight outline-none select-none touch-none',
                  'transition-shadow',
                  block.isPickup
                    ? 'border-dashed border-accent-foreground/40 text-accent-foreground'
                    : track === 'leg'
                      ? 'bg-primary/15 border-primary/40 text-foreground'
                      : 'bg-accent border-accent-foreground/30 text-accent-foreground',
                  isSelected && 'ring-2 ring-ring',
                  mode === 'author' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                )}
                style={{
                  left: start * UNIT_PX + 2,
                  width: duration * UNIT_PX - 4,
                  backgroundImage: block.isPickup
                    ? 'repeating-linear-gradient(45deg, color-mix(in oklch, var(--accent-foreground), transparent 85%) 0, color-mix(in oklch, var(--accent-foreground), transparent 85%) 4px, transparent 4px, transparent 8px)'
                    : undefined,
                }}
              >
                <span className="truncate">{block.term}</span>

                {mode === 'author' && (
                  <>
                    <div
                      onPointerDown={(e) => beginResize(track, block, 'left', e)}
                      onPointerMove={onResizePointerMove}
                      onPointerUp={() => onResizePointerUp(block)}
                      className="absolute inset-y-0 left-0 w-2 cursor-col-resize"
                    />
                    <div
                      onPointerDown={(e) => beginResize(track, block, 'right', e)}
                      onPointerMove={onResizePointerMove}
                      onPointerUp={() => onResizePointerUp(block)}
                      className="absolute inset-y-0 right-0 w-2 cursor-col-resize"
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
                  <div className="absolute top-full left-0 z-20 mt-1 max-w-56 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
                    {block.term}
                  </div>
                )}

                {pending && pending.id === block.id && pending.track === track && (
                  <TermEditorPopover pending={pending} setPending={setPending} onCommit={commitPending} />
                )}
              </div>
            )
          })}

          {pending && pending.id === null && pending.track === track && (
            <div
              className="absolute top-1 bottom-1 rounded-md border border-primary/50 bg-primary/10"
              style={{ left: pending.startCount * UNIT_PX + 2, width: pending.durationCount * UNIT_PX - 4 }}
            >
              <TermEditorPopover pending={pending} setPending={setPending} onCommit={commitPending} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-2" style={{ overflowY: 'visible' }}>
        <div style={{ width: gridWidth + 40 }}>
          <div className="flex items-stretch gap-3 mb-1">
            <div className="w-10 shrink-0" />
            <div className="relative h-4" style={{ width: gridWidth }}>
              {Array.from({ length: totalUnits }).map((_, u) => {
                const label = unitLabel(u)
                if (label === null) return null
                return (
                  <span
                    key={u}
                    className={cn(
                      'absolute top-0 tabular-nums',
                      label === '&' ? 'text-[9px] text-muted-foreground/50' : 'text-[10px] text-muted-foreground font-medium',
                    )}
                    style={{ left: u * UNIT_PX + 2 }}
                  >
                    {label}
                  </span>
                )
              })}
              <span className="absolute -top-0 text-[8px] uppercase tracking-widest text-muted-foreground/40" style={{ left: 0 }}>
                pickup
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {renderTrackRow('leg', 'Leg')}
            {renderTrackRow('arm', 'Arm')}
          </div>
        </div>
      </div>
    </div>
  )
}

function TermEditorPopover({
  pending,
  setPending,
  onCommit,
}: {
  pending: PendingTerm
  setPending: (p: PendingTerm | null) => void
  onCommit: () => void
}) {
  return (
    <div
      className="absolute top-full left-0 z-30 mt-1 flex w-40 gap-1"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={pending.value}
        onChange={(e) => setPending({ ...pending, value: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit()
          if (e.key === 'Escape') setPending(null)
        }}
        onBlur={onCommit}
        placeholder="Term…"
        className="h-6 w-full min-w-0 rounded-md border border-ring bg-popover px-1.5 text-xs text-popover-foreground shadow-md outline-none"
      />
    </div>
  )
}
