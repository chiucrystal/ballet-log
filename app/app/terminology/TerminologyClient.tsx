'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Term, Grade } from '@/lib/types'

// ---------------------------------------------------------------------------
// Filter system — extensible: each dimension is a key in FilterState.
// When a dimension has no active values, all items pass that dimension.
// ---------------------------------------------------------------------------
type FilterDimension = 'introduced_at_grade' // extend here as needed
type FilterState = Partial<Record<FilterDimension, Set<string>>>

function toggleFilter(
  state: FilterState,
  dim: FilterDimension,
  value: string
): FilterState {
  const current = new Set(state[dim] ?? [])
  if (current.has(value)) current.delete(value)
  else current.add(value)
  return { ...state, [dim]: current }
}

function passesFilters(term: Term, filters: FilterState): boolean {
  for (const [dim, values] of Object.entries(filters) as [FilterDimension, Set<string>][]) {
    if (!values || values.size === 0) continue
    if (!values.has(term[dim])) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Grade badge config
// ---------------------------------------------------------------------------
const GRADE_STYLES: Record<string, string> = {
  IF: 'bg-muted text-muted-foreground',
  I:  'bg-accent text-accent-foreground',
  AF: 'bg-primary/10 text-primary',
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', GRADE_STYLES[grade] ?? 'bg-muted text-muted-foreground')}>
      {grade}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------
function FilterChip({
  label,
  active,
  onToggle,
}: {
  label: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
      )}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Filter group — add new FilterGroup calls to the page for more dimensions
// ---------------------------------------------------------------------------
function FilterGroup({
  label,
  options,
  activeValues,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  activeValues: Set<string>
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
        {label}
      </span>
      {options.map((opt) => (
        <FilterChip
          key={opt.value}
          label={opt.label}
          active={activeValues.has(opt.value)}
          onToggle={() => onToggle(opt.value)}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Term row
// ---------------------------------------------------------------------------
function TermRow({ term }: { term: Term }) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-heading text-base">{term.term}</span>
            {term.open_question && (
              <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                verify
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground italic mb-1.5">{term.french_translation}</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{term.description}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
          <GradeBadge grade={term.introduced_at_grade} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export default function TerminologyClient({
  terms,
  grades,
}: {
  terms: Term[]
  grades: Grade[]
}) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})

  const gradeOptions = grades.map((g) => ({ value: g.id, label: g.label }))
  const activeGrades = filters.introduced_at_grade ?? new Set<string>()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return terms.filter((term) => {
      if (q) {
        const match =
          term.term.toLowerCase().includes(q) ||
          term.french_translation.toLowerCase().includes(q) ||
          term.description.toLowerCase().includes(q)
        if (!match) return false
      }
      return passesFilters(term, filters)
    })
  }, [terms, query, filters])

  return (
    <div className="space-y-6">
      {/* Header + search */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-[1.2] shrink-0">Terminology</h1>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <FilterGroup
          label="Grade"
          options={gradeOptions}
          activeValues={activeGrades}
          onToggle={(val) =>
            setFilters((f) => toggleFilter(f, 'introduced_at_grade', val))
          }
        />
        {/* Add more FilterGroup components here for new dimensions */}
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
        {(query || activeGrades.size > 0) && (
          <button
            onClick={() => { setQuery(''); setFilters({}) }}
            className="ml-3 underline underline-offset-2 hover:text-foreground transition-colors"
          >
            clear
          </button>
        )}
      </p>

      {/* List */}
      <div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No terms match.</p>
        ) : (
          filtered.map((term) => <TermRow key={term.id} term={term} />)
        )}
      </div>
    </div>
  )
}
