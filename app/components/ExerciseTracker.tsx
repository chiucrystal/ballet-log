'use client'

import { useState, useEffect, Fragment } from 'react'
import { EXERCISES_TREE } from '@/lib/exercises-tree'
import { cn } from '@/lib/utils'
import type { Session } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (parseDateLocal(b).getTime() - parseDateLocal(a).getTime()) / (1000 * 60 * 60 * 24)
  )
}

function toDDMM(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}-${m}`
}

function timeAgo(dateStr: string): string {
  const diff = daysBetween(dateStr, new Date().toISOString().slice(0, 10))
  if (diff === 0) return 'today'
  if (diff < 7) return `${diff}d ago`
  if (diff < 14) return '1 wk ago'
  return `${Math.floor(diff / 7)} wks ago`
}

// ── Syllabus exercise order ───────────────────────────────────────────────────

type SyllabusRow = {
  code: string
  category: string
  subgroup: string
}

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

// ── Mobile hook ──────────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

// ── Column types ──────────────────────────────────────────────────────────────

type SessionCol = { kind: 'session'; session: Session }
type GapCol = { kind: 'gap'; days: number }
type Col = SessionCol | GapCol

// ── Main component ────────────────────────────────────────────────────────────

export function ExerciseTracker({
  sessions,
  exerciseNames,
}: {
  sessions: Session[]
  exerciseNames: Record<string, string>
}) {
  const [sortOrder, setSortOrder] = useState<'syllabus' | 'neglected'>('syllabus')
  const [classFilter, setClassFilter] = useState<'all' | 'advanced' | 'discovering'>('all')
  const isMobile = useIsMobile()

  // Sessions newest-first for left-to-right reading
  const chronological = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

  // Build columns: insert gap markers where there's a >4 week gap between sessions
  const cols: Col[] = []
  for (let i = 0; i < chronological.length; i++) {
    const s = chronological[i]
    if (i > 0) {
      const prev = chronological[i - 1]
      const gap = daysBetween(s.date, prev.date)
      if (gap > 28) {
        cols.push({ kind: 'gap', days: gap })
      }
    }
    cols.push({ kind: 'session', session: s })
  }

  // Which exercise codes actually appear in any session
  const appearedCodes = new Set<string>()
  const sessionExercises = new Map<string, Set<string>>() // date → set of codes
  for (const s of chronological) {
    const codes = new Set<string>()
    for (const c of s.corrections) {
      if (c.exercise) {
        appearedCodes.add(c.exercise)
        codes.add(c.exercise)
      }
    }
    sessionExercises.set(s.date, codes)
  }

  const syllabusRows = ALL_SYLLABUS_ROWS.filter(r => {
    if (classFilter === 'advanced') return r.category === 'Advanced Foundation' || r.category === 'Pointe Work'
    if (classFilter === 'discovering') return r.category === 'Discovering Repertoire'
    return true
  })

  // For "neglected" sort: compute last-seen per code, sort ascending
  const lastSeenMap = new Map<string, string>()
  for (const s of chronological) {
    for (const code of sessionExercises.get(s.date) ?? []) {
      lastSeenMap.set(code, s.date)
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

  // Group display rows by category (only when in syllabus order)
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

  // On mobile, cap to 5 most-recent session columns (plus any gap cols between them)
  const visibleCols = isMobile
    ? (() => {
        const result: Col[] = []
        let sessionCount = 0
        for (const col of cols) {
          if (col.kind === 'session') {
            if (sessionCount >= 5) break
            sessionCount++
          }
          result.push(col)
        }
        return result
      })()
    : cols

  // Cell width constants
  const SESSION_COL_W = 28 // px
  const GAP_COL_W = 36

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
          Exercise Tracker
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-wrap gap-0.5">
            {([
              { value: 'all', label: 'All' },
              { value: 'advanced', label: 'Advanced Foundation' },
              { value: 'discovering', label: 'Discovering Repertoire' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setClassFilter(value)}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded transition-colors',
                  classFilter === value
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortOrder(s => s === 'syllabus' ? 'neglected' : 'syllabus')}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border hover:border-foreground/30"
          >
            {sortOrder === 'syllabus' ? 'By syllabus' : 'By frequency'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0">
          <thead>
            <tr>
              {/* Exercise label column */}
              <th className="w-28 min-w-28 md:w-40 md:min-w-40" />
              {/* Session / gap columns */}
              {visibleCols.map((col, i) =>
                col.kind === 'session' ? (
                  <th
                    key={col.session.date}
                    style={{ width: SESSION_COL_W, minWidth: SESSION_COL_W }}
                    className="pb-1 align-bottom"
                    title={col.session.context}
                  >
                    <div
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="text-[10px] text-muted-foreground font-normal leading-none whitespace-nowrap mx-auto"
                    >
                      {toDDMM(col.session.date)}
                    </div>
                  </th>
                ) : (
                  <th
                    key={`gap-${i}`}
                    style={{ width: GAP_COL_W, minWidth: GAP_COL_W }}
                    className="pb-1 align-bottom"
                  >
                    <div
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      className="text-[10px] text-muted-foreground/40 font-normal leading-none whitespace-nowrap mx-auto"
                    >
                      ~{Math.round(col.days / 7)}wk gap
                    </div>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              <Fragment key={gi}>
                {/* Category header row (syllabus mode only) */}
                {sortOrder === 'syllabus' && group.category && (
                  <tr key={`cat-${gi}`}>
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
                      {/* Exercise label */}
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
                      {/* Cells */}
                      {visibleCols.map((col, ci) => {
                        if (col.kind === 'gap') {
                          return (
                            <td key={`gap-${ci}`} className="py-0.5 px-1">
                              <div className="flex items-center justify-center h-5">
                                <span className="text-[10px] text-muted-foreground/25 select-none">✕</span>
                              </div>
                            </td>
                          )
                        }
                        const done = sessionExercises.get(col.session.date)?.has(row.code) ?? false
                        return (
                          <td
                            key={col.session.date}
                            className="py-0.5"
                            title={done ? col.session.context : undefined}
                          >
                            <div className="flex items-center justify-center">
                              <div
                                className={[
                                  'w-4 h-4 rounded-sm transition-colors',
                                  done
                                    ? 'bg-foreground group-hover:opacity-80'
                                    : 'bg-muted/60',
                                ].join(' ')}
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
      <div className="flex gap-4 pt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-foreground inline-block" /> Covered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-muted/60 inline-block" /> Not covered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground/25 text-xs">✕</span> Injury gap
        </span>
      </div>
    </div>
  )
}
