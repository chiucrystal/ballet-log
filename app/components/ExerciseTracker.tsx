'use client'

import { useState, Fragment } from 'react'
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

// Monday=#3971B8, Thursday=#C8D69B, Saturday=#F6E6A5
function getDayColor(dateStr: string): string | null {
  const dow = parseDateLocal(dateStr).getDay()
  if (dow === 1) return '#3971B8'
  if (dow === 4) return '#C8D69B'
  if (dow === 6) return '#F6E6A5'
  return null
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

  return cols.reverse() // newest first
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExerciseTracker({
  sessions,
  exerciseNames,
}: {
  sessions: Session[]
  exerciseNames: Record<string, string>
}) {
  const [sortOrder, setSortOrder]   = useState<'syllabus' | 'neglected'>('syllabus')
  const [classFilter, setClassFilter] = useState<'advanced' | 'discovering'>('advanced')
  const [viewMode, setViewMode]     = useState<'attended' | 'all'>('attended')

  const allCols = buildCols(sessions)

  const visibleCols: Col[] = viewMode === 'attended'
    ? allCols.filter((col): col is ClassCol => col.kind === 'class' && col.session !== null)
    : allCols

  // exercise code → set of session dates it was covered
  const sessionExercises = new Map<string, Set<string>>()
  for (const col of allCols) {
    if (col.kind === 'class' && col.session) {
      const codes = new Set<string>()
      for (const c of col.session.corrections) {
        if (c.exercise) codes.add(c.exercise)
      }
      sessionExercises.set(col.date, codes)
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

  type CategoryGroup = { category: string; rows: SyllabusRow[] }
  const groups: CategoryGroup[] = []
  if (sortOrder === 'syllabus') {
    for (const row of displayRows) {
      const last = groups[groups.length - 1]
      if (last && last.category === row.category) {
        last.rows.push(row)
      } else {
        groups.push({ category: row.category, rows: [row] })
      }
    }
  } else {
    groups.push({ category: '', rows: displayRows })
  }

  const COL_W    = 28
  const BREAK_W  = 20
  const LABEL_W  = 160 // px, matches md:w-40

  return (
    <div className="space-y-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Class tabs — replace heading */}
        <div className="flex gap-5">
          {([
            { value: 'advanced',   label: 'Advanced Foundation' },
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

        {/* Controls */}
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
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          color: col.session ? (getDayColor(col.date) ?? undefined) : undefined,
                        }}
                        className={cn(
                          'text-[10px] font-normal leading-none whitespace-nowrap',
                          !col.session && (col.absent
                            ? 'text-muted-foreground/20'
                            : 'text-muted-foreground/40'
                          )
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
                {sortOrder === 'syllabus' && group.category && (
                  <tr>
                    <td
                      colSpan={visibleCols.length + 1}
                      className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50"
                    >
                      {group.category}
                    </td>
                  </tr>
                )}
                {group.rows.map((row) => {
                  const lastSeen = lastSeenMap.get(row.code)
                  return (
                    <tr key={row.code} className="group">
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
                        const dayColor = getDayColor(col.date)
                        return (
                          <td key={col.date} className="py-0.5" title={covered ? col.session?.context : undefined}>
                            <div className="flex items-center justify-center">
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-sm transition-opacity',
                                  covered
                                    ? 'group-hover:opacity-70'
                                    : col.absent
                                    ? 'bg-muted/30'
                                    : 'bg-muted/60'
                                )}
                                style={covered && dayColor ? { backgroundColor: dayColor } : undefined}
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
          <span className="w-4 h-4 rounded-sm bg-foreground inline-block" /> Covered
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
    </div>
  )
}
