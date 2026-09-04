'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PHRASE_LENGTH,
  PICKUP_UNITS,
  defaultPhraseBreaks,
  phraseStartFor,
  type TimelineBlock,
  type TimelineTrack,
} from '@/lib/timeline-types'

const UNIT_PX = 34 // px per half-count grid unit, along the vertical (time) axis
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

function selKey(track: TimelineTrack, id: string) {
  return `${track}:${id}`
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<{ track: TimelineTrack; id: string } | null>(null)
  const longPress = useRef<{ timer: ReturnType<typeof setTimeout>; moved: boolean } | null>(null)
  const history = useRef<{ legTrack: TimelineBlock[]; armTrack: TimelineBlock[] }[]>([])
  const [historyLength, setHistoryLength] = useState(0)

  const tracksOf = (track: TimelineTrack) => (track === 'leg' ? legTrack : armTrack)
  const colRefOf = (track: TimelineTrack) => (track === 'leg' ? legColRef : armColRef)

  /** Snapshot both tracks onto the undo stack. Call before any committing mutation. */
  function pushHistory() {
    history.current = [...history.current, { legTrack, armTrack }].slice(-100)
    setHistoryLength(history.current.length)
  }

  function undo() {
    const prev = history.current[history.current.length - 1]
    if (!prev) return
    history.current = history.current.slice(0, -1)
    setHistoryLength(history.current.length)
    onLegTrackChange?.(prev.legTrack)
    onArmTrackChange?.(prev.armTrack)
    setSelected(new Set())
  }

  function updateTrack(track: TimelineTrack, updater: (blocks: TimelineBlock[]) => TimelineBlock[]) {
    pushHistory()
    const setter = track === 'leg' ? onLegTrackChange : onArmTrackChange
    setter?.(updater(tracksOf(track)))
  }

  function deleteSelected() {
    if (selected.size === 0) return
    const legIds = new Set<string>()
    const armIds = new Set<string>()
    for (const k of selected) {
      const [track, id] = k.split(':') as [TimelineTrack, string]
      ;(track === 'leg' ? legIds : armIds).add(id)
    }
    pushHistory()
    onLegTrackChange?.(legTrack.filter((b) => !legIds.has(b.id)))
    onArmTrackChange?.(armTrack.filter((b) => !armIds.has(b.id)))
    setSelected(new Set())
  }

  /** Clone the selected blocks, placed contiguously right after the selection, preserving relative timing across tracks. */
  function duplicateSelected() {
    if (selected.size === 0) return
    const legIds = new Set<string>()
    const armIds = new Set<string>()
    for (const k of selected) {
      const [track, id] = k.split(':') as [TimelineTrack, string]
      ;(track === 'leg' ? legIds : armIds).add(id)
    }
    const legSel = legTrack.filter((b) => legIds.has(b.id))
    const armSel = armTrack.filter((b) => armIds.has(b.id))
    const all = [...legSel, ...armSel]
    if (all.length === 0) return

    const minStart = Math.min(...all.map((b) => b.startCount))
    const maxEnd = Math.max(...all.map((b) => b.startCount + b.durationCount))
    const shift = maxEnd - minStart

    function shiftBlocks(blocks: TimelineBlock[], others: TimelineBlock[]): TimelineBlock[] | null {
      const clones: TimelineBlock[] = []
      for (const b of blocks) {
        const newStart = b.startCount + shift
        if (newStart + b.durationCount > totalUnits) return null
        const overlaps = others.some(
          (o) => newStart < o.startCount + o.durationCount && newStart + b.durationCount > o.startCount
        )
        if (overlaps) return null
        clones.push({ ...b, id: crypto.randomUUID(), startCount: newStart, isPickup: isPickupRange(newStart, b.durationCount) })
      }
      return clones
    }

    const newLegBlocks = shiftBlocks(legSel, legTrack.filter((b) => !legIds.has(b.id)))
    const newArmBlocks = shiftBlocks(armSel, armTrack.filter((b) => !armIds.has(b.id)))
    if (newLegBlocks === null || newArmBlocks === null) return // no room right after the selection

    pushHistory()
    onLegTrackChange?.([...legTrack, ...newLegBlocks])
    onArmTrackChange?.([...armTrack, ...newArmBlocks])
    setSelected(new Set([...newLegBlocks.map((b) => selKey('leg', b.id)), ...newArmBlocks.map((b) => selKey('arm', b.id))]))
  }

  const latest = useRef({ undo, duplicateSelected, deleteSelected, hasSelection: selected.size > 0 })
  useEffect(() => {
    latest.current = { undo, duplicateSelected, deleteSelected, hasSelection: selected.size > 0 }
  })

  useEffect(() => {
    if (mode !== 'author') return
    function onWindowKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        latest.current.undo()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        latest.current.duplicateSelected()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && latest.current.hasSelection) {
        e.preventDefault()
        latest.current.deleteSelected()
      } else if (e.key === 'Escape' && latest.current.hasSelection) {
        setSelected(new Set())
      }
    }
    window.addEventListener('keydown', onWindowKeyDown)
    return () => window.removeEventListener('keydown', onWindowKeyDown)
  }, [mode])

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
    setSelected(new Set())
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
      // quick tap: toggle selection instead of committing a move. Shift/Cmd/Ctrl adds to the selection.
      const k = selKey(track, block.id)
      const additive = e.shiftKey || e.metaKey || e.ctrlKey
      setSelected((prev) => {
        const next = additive ? new Set(prev) : new Set<string>()
        if (next.has(k)) next.delete(k)
        else next.add(k)
        return next
      })
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
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(selKey(track, id))
      return next
    })
  }

  function onKeyDownBlock(e: React.KeyboardEvent, track: TimelineTrack, id: string) {
    if (mode !== 'author') return
    if (e.key === 'Enter') {
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
          const isSelected = selected.has(selKey(track, block.id))
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
    <div className="space-y-2">
      {mode === 'author' && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyLength === 0}
            className="gap-1.5"
          >
            <Undo2 /> Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={duplicateSelected}
            disabled={selected.size === 0}
            className="gap-1.5"
          >
            <Copy /> Duplicate{selected.size > 1 ? ` (${selected.size})` : ''}
          </Button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
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
