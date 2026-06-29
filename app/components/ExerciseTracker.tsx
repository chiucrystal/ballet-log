'use client'

import { useState, useRef, Fragment } from 'react'
import { X } from 'lucide-react'
import { EXERCISES_TREE } from '@/lib/exercises-tree'
import { cn } from '@/lib/utils'
import type { Session } from '@/lib/types'

// ── Schedule constants ────────────────────────────────────────────────────────

const SCHEDULE_START = '2026-03-09'
const BREAK_START    = '2026-04-03'
const BREAK_END      = '2026-04-20'
const ABSENCE_START  = '2026-03-19'
const ABSENCE_END    = '2026-05-09'

const COVERED_COLOR = '#3971B8'

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toDDMM(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}-${m}`
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (parseDateLocal(b).getTime() - parseDateLocal(a).getTime()) / (1000 * 60 * 60 * 24)
  )
}

function timeAgo(dateStr: string): string {
  const diff = daysBetween(dateStr, isoDate(new Date()))
  if (diff === 0) return 'today'
  if (diff < 7) return `${diff}d ago`
  if (diff < 14) return '1 wk ago'
  return `${Math.floor(diff / 7)} wks ago`
}

// ── Syllabus rows ─────────────────────────────────────────────────────────────

type SyllabusRow = { code: string; category: string; subgroup: string }

function buildSyllabusRows(): SyllabusRow[] {
  const rows: SyllabusRow[] = []
  for (const cat of EXERCISES_TREE) {
    for (const sg of cat.subgroups) {
      for (const code of sg.codes) {
        rows.push({ code, category: cat.category, subgroup: sg.name })
      }
    }
  }
  return rows
}

const ALL_SYLLABUS_ROWS = buildSyllabusRows()

// ── Column generation ─────────────────────────────────────────────────────────

type ClassCol = { kind: 'class'; date: string; session: Session | null; absent: boolean }
type BreakCol = { kind: 'break' }
type Col = ClassCol | BreakCol

function buildCols(sessions: Session[]): Col[] {
  const sessionMap = new Map<string, Session>()
  for (const s of sessions) sessionMap.set(s.date, s)

  const today  = isoDate(new Date())
  const start  = parseDateLocal(SCHEDULE_START)
  const end    = parseDateLocal(today)
  const bStart = parseDateLocal(BREAK_START)
  const bEnd   = parseDateLocal(BREAK_END)
  const aStart = parseDateLocal(ABSENCE_START)
  const aEnd   = parseDateLocal(ABSENCE_END)

  const cols: Col[] = []
  let breakInserted = false
  const d = new Date(start)

  while (d <= end) {
    const dow = d.getDay()
    if (dow === 1 || dow === 4 || dow === 6) {
      if (d >= bStart && d <= bEnd) {
        if (!breakInserted) {
          cols.push({ kind: 'break' })
          breakInserted = true
        }
      } else {
        const dateStr = isoDate(d)
        cols.push({
          kind: 'class',
          date: dateStr,
          session: sessionMap.get(dateStr) ?? null,
          absent: d >= aStart && d <= aEnd,
        })
      }
    }
    d.setDate(d.getDate() + 1)
  }

  return cols.reverse()
}

// ── Tooltip types ─────────────────────────────────────────────────────────────

type TooltipState = {
  exerciseName: string
  date: string
  texts: string[]
  x: number
  y: number
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExerciseTracker({
  sessions,
  exerciseNames,
}: {
  sessions: Session[]
  exerciseNames: Record<string, string>
}) {
  const [sortOrder, setSortOrder]     = useState<'syllabus' | 'neglected'>('syllabus')
  const [classFilter, setClassFilter] = useState<'advanced' | 'discovering'>('advanced')
  const [viewMode, setViewMode]       = useState<'attended' | 'all'>('attended')
  const [tooltip, setTooltip]         = useState<TooltipState | null>(null)
  const hideTimer                     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allCols = buildCols(sessions)

  const visibleCols: Col[] = viewMode === 'attended'
    ? allCols.filter((col): col is ClassCol => col.kind === 'class' && col.session !== null)
    : allCols

  const sessionExercises = new Map<string, Set<string>>()
  const sessionCorrections = new Map<string, Map<string, string[]>>() // date → code → texts
  for (const col of allCols) {
    if (col.kind === 'class' && col.session) {
      const codes = new Set<string>()
      const codeTexts = new Map<string, string[]>()
      for (const c of col.session.corrections) {
        if (c.exercise) {
          codes.add(c.exercise)
          const arr = codeTexts.get(c.exercise) ?? []
          arr.push(c.text)
          codeTexts.set(c.exercise, arr)
        }
      }
      sessionExercises.set(col.date, codes)
      sessionCorrections.set(col.date, codeTexts)
    }
  }

  const syllabusRows = ALL_SYLLABUS_ROWS.filter(r =>
    classFilter === 'advanced'
      ? r.category === 'Advanced Foundation' || r.category === 'Pointe Work'
      : r.category === 'Discovering Repertoire'
  )

  const lastSeenMap = new Map<string, string>()
  for (const [date, codes] of sessionExercises) {
    for (const code of codes) {
      const prev = lastSeenMap.get(code)
      if (!prev || date > prev) lastSeenMap.set(code, date)
    }
  }

  const displayRows =
    sortOrder === 'neglected'
      ? [...syllabusRows].sort((a, b) => {
          const la = lastSeenMap.get(a.code) ?? '0000-00-00'
          const lb = lastSeenMap.get(b.code) ?? '0000-00-00'
          return la.localeCompare(lb)
        })
      : syllabusRows

  // In syllabus order: group by subgroup name (Barre / Centre / Allegro),
  // except Pointe Work is kept as a single section.
  type Group = { label: string; rows: SyllabusRow[] }
  const groups: Group[] = []
  if (sortOrder === 'syllabus') {
    for (const row of displayRows) {
      const last = groups[groups.length - 1]
      const label = row.category === 'Pointe Work' ? 'Pointe Work' : row.subgroup
      if (last && last.label === label) {
        last.rows.push(row)
      } else {
        groups.push({ label, rows: [row] })
      }
    }
  } else {
    groups.push({ label: '', rows: displayRows })
  }

  function showTooltip(e: React.MouseEvent, exerciseName: string, date: string, texts: string[]) {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({
      exerciseName,
      date,
      texts,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }

  function hideTooltip() {
    hideTimer.current = setTimeout(() => setTooltip(null), 120)
  }

  const COL_W   = 28
  const BREAK_W = 20
  const LABEL_W = 160

  return (
    <div className="space-y-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex gap-5">
          {([
            { value: 'advanced',    label: 'Advanced Foundation' },
            { value: 'discovering', label: 'Discovering Repertoire' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setClassFilter(value)}
              className={cn(
                'text-xs font-semibold uppercase tracking-[0.07em] transition-colors pb-0.5',
                classFilter === value
                  ? 'text-foreground border-b border-foreground'
                  : 'text-muted-foreground/40 hover:text-muted-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSortOrder(s => s === 'syllabus' ? 'neglected' : 'syllabus')}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border hover:border-foreground/30 whitespace-nowrap"
          >
            Sort: {sortOrder === 'syllabus' ? 'By syllabus' : 'By frequency'}
          </button>
          <button
            onClick={() => setViewMode(v => v === 'attended' ? 'all' : 'attended')}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border hover:border-foreground/30 whitespace-nowrap"
          >
            View: {viewMode === 'attended' ? 'Attended only' : 'All classes'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: LABEL_W }} />
            {visibleCols.map((col, i) => (
              <col
                key={col.kind === 'break' ? 'break' : col.date}
                style={{ width: col.kind === 'break' ? BREAK_W : COL_W }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: LABEL_W }} />
              {visibleCols.map((col) =>
                col.kind === 'break' ? (
                  <th key="break" className="pb-1 align-bottom">
                    <div className="flex justify-center items-end pb-0.5">
                      <X className="size-3 text-muted-foreground/25" />
                    </div>
                  </th>
                ) : (
                  <th key={col.date} className="pb-1 align-bottom" title={col.session?.context ?? undefined}>
                    <div className="flex justify-center items-end">
                      <div
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        className={cn(
                          'text-[10px] font-normal leading-none whitespace-nowrap',
                          col.session
                            ? 'text-muted-foreground'
                            : col.absent
                            ? 'text-muted-foreground/20'
                            : 'text-muted-foreground/40'
                        )}
                      >
                        {toDDMM(col.date)}
                      </div>
                    </div>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              <Fragment key={gi}>
                {sortOrder === 'syllabus' && group.label && (
                  <tr>
                    <td
                      colSpan={visibleCols.length + 1}
                      className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50"
                    >
                      {group.label}
                    </td>
                  </tr>
                )}
                {group.rows.map((row) => {
                  const lastSeen = lastSeenMap.get(row.code)
                  return (
                    <tr key={row.code}>
                      <td className="pr-3 py-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">
                            {row.code}
                          </span>
                          <span className="text-sm truncate">
                            {exerciseNames[row.code] ?? row.code}
                          </span>
                          {lastSeen && sortOrder === 'neglected' && (
                            <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-auto pl-2">
                              {timeAgo(lastSeen)}
                            </span>
                          )}
                        </div>
                      </td>
                      {visibleCols.map((col) => {
                        if (col.kind === 'break') {
                          return (
                            <td key="break" className="py-0.5" title="Injury period">
                              <div className="flex items-center justify-center">
                                <X className="size-3 text-muted-foreground/30" />
                              </div>
                            </td>
                          )
                        }
                        const covered = sessionExercises.get(col.date)?.has(row.code) ?? false
                        return (
                          <td key={col.date} className="py-0.5">
                            <div className="flex items-center justify-center">
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-sm transition-opacity cursor-default',
                                  covered
                                    ? 'hover:opacity-70'
                                    : col.absent
                                    ? 'bg-muted/30'
                                    : 'bg-muted/60'
                                )}
                                style={covered ? { backgroundColor: COVERED_COLOR } : undefined}
                                onMouseEnter={covered ? (e) => {
                                  const texts = sessionCorrections.get(col.date)?.get(row.code) ?? []
                                  showTooltip(e, exerciseNames[row.code] ?? row.code, col.date, texts)
                                } : undefined}
                                onMouseLeave={covered ? hideTooltip : undefined}
                              />
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-2 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: COVERED_COLOR }} />
          Covered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-muted/60 inline-block" /> Not covered
        </span>
        {viewMode === 'all' && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-muted/30 inline-block" /> Absent
          </span>
        )}
      </div>

      {/* Correction popover */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: tooltip.y, left: tooltip.x, transform: 'translateX(-50%)' }}
        >
          <div className="bg-background border border-border rounded-lg shadow-md px-3.5 py-3 w-64 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground leading-none">
                {tooltip.exerciseName}
              </p>
              <p className="text-[10px] text-muted-foreground/50 shrink-0">{toDDMM(tooltip.date)}</p>
            </div>
            <ul className="space-y-1.5">
              {tooltip.texts.map((text, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug">
                  <span className="text-muted-foreground/30 shrink-0 mt-0.5">—</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
