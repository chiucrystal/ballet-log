'use client'

import { useState } from 'react'
import { LayoutList, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { AccordionRoot, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate, formatShortDate } from '@/lib/format'
import { EXERCISES_TREE } from '@/lib/exercises-tree'
import { ExerciseTracker } from '@/components/ExerciseTracker'
import type { Session, Priority } from '@/lib/types'

// Build exercise code → { category, subgroup } lookup from the tree
const exerciseMeta: Record<string, { category: string; subgroup: string | null }> = {}
for (const cat of EXERCISES_TREE) {
  for (const sg of cat.subgroups) {
    for (const code of sg.codes) {
      exerciseMeta[code] = { category: cat.category, subgroup: sg.name }
    }
  }
}

function groupByExercise(
  corrections: Session['corrections'],
  exerciseNames: Record<string, string>,
) {
  const order: (string | null)[] = []
  const map = new Map<string | null, string[]>()
  for (const c of corrections) {
    if (!map.has(c.exercise)) {
      order.push(c.exercise)
      map.set(c.exercise, [])
    }
    map.get(c.exercise)!.push(c.text)
  }
  return order.map((code) => ({
    code,
    name: code ? (exerciseNames[code] ?? code) : null,
    items: map.get(code)!,
  }))
}

function groupForDayView(
  corrections: Session['corrections'],
  exerciseNames: Record<string, string>,
) {
  const general = corrections.filter((c) => c.exercise === null).map((c) => c.text)

  // category+subgroup → exercise → correction texts (preserve insertion order)
  const sectionOrder: string[] = []
  const sections = new Map<string, {
    category: string
    subgroup: string | null
    exerciseOrder: string[]
    exercises: Map<string, { name: string; texts: string[] }>
  }>()

  for (const c of corrections) {
    if (!c.exercise) continue
    const meta = exerciseMeta[c.exercise] ?? { category: 'General', subgroup: null }
    const sectionKey = `${meta.category}__${meta.subgroup ?? ''}`

    if (!sections.has(sectionKey)) {
      sectionOrder.push(sectionKey)
      sections.set(sectionKey, {
        category: meta.category,
        subgroup: meta.subgroup,
        exerciseOrder: [],
        exercises: new Map(),
      })
    }
    const section = sections.get(sectionKey)!

    if (!section.exercises.has(c.exercise)) {
      section.exerciseOrder.push(c.exercise)
      section.exercises.set(c.exercise, {
        name: exerciseNames[c.exercise] ?? c.exercise,
        texts: [],
      })
    }
    section.exercises.get(c.exercise)!.texts.push(c.text)
  }

  return {
    general,
    sections: sectionOrder.map((key) => sections.get(key)!),
  }
}

// ── Day view ────────────────────────────────────────────────────────────────

function DayView({
  session,
  exerciseNames,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  session: Session
  exerciseNames: Record<string, string>
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const { general, sections } = groupForDayView(session.corrections, exerciseNames)

  return (
    <div className="max-w-xl">
      {/* Date navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous session"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="font-heading text-2xl">{formatShortDate(session.date)}</span>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next session"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Context */}
      {session.context && (
        <p className="text-sm text-muted-foreground mb-6">{session.context}</p>
      )}

      {/* General / key themes */}
      {general.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Key themes
          </p>
          <ul className="space-y-1.5">
            {general.map((text, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="text-muted-foreground/40 select-none shrink-0 mt-0.5">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exercise sections */}
      {sections.map((section) => (
        <div key={`${section.category}__${section.subgroup ?? ''}`} className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
            {section.category}{section.subgroup && ` — ${section.subgroup}`}
          </p>
          <div className="space-y-4">
            {section.exerciseOrder.map((code) => {
              const ex = section.exercises.get(code)!
              return (
                <div key={code}>
                  <p className="text-sm font-medium mb-1.5">{ex.name}</p>
                  <ul className="space-y-1.5">
                    {ex.texts.map((text, i) => (
                      <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className="text-muted-foreground/40 select-none shrink-0 mt-0.5">•</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Home exercises */}
      {session.homeExercises.length > 0 && (
        <div className="mb-6 pt-4 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
            Home exercises
          </p>
          <div className="space-y-3">
            {session.homeExercises.map((ex, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{ex.name}</p>
                {ex.notes && <p className="text-sm text-muted-foreground mt-0.5">{ex.notes}</p>}
                {ex.use && <p className="text-xs text-muted-foreground/70 mt-0.5">{ex.use}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open questions */}
      {session.openQuestions.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Open questions
          </p>
          <ul className="space-y-1.5">
            {session.openQuestions.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground">{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Main client component ────────────────────────────────────────────────────

export default function HomeClient({
  sessions,
  priorities,
  exerciseNames,
}: {
  sessions: Session[]
  priorities: Priority[]
  exerciseNames: Record<string, string>
}) {
  const [view, setView] = useState<'list' | 'day'>('list')
  const [sessionIndex, setSessionIndex] = useState(0)
  const [mobileTab, setMobileTab] = useState<'tracker' | 'priorities' | 'timeline'>('tracker')

  const currentSession = sessions[sessionIndex]

  const timelineHeader = (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        Session Timeline
      </h2>
      <div className="flex gap-0.5">
        <button
          onClick={() => setView('list')}
          aria-label="List view"
          className={cn(
            'p-1.5 rounded transition-colors',
            view === 'list'
              ? 'text-foreground bg-muted'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <LayoutList className="size-3.5" />
        </button>
        <button
          onClick={() => setView('day')}
          aria-label="Day view"
          className={cn(
            'p-1.5 rounded transition-colors',
            view === 'day'
              ? 'text-foreground bg-muted'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <CalendarDays className="size-3.5" />
        </button>
      </div>
    </div>
  )

  const prioritiesContent = (
    <div className="space-y-3">
      {priorities.map((p, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>{i + 1}. {p.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{p.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const timelineListContent = (
    <AccordionRoot multiple>
      {sessions.map((session) => (
        <AccordionItem key={session.date} value={session.date}>
          <AccordionTrigger>
            <div className="text-left">
              <div className="font-medium">{formatDate(session.date)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{session.context}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {session.corrections.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No corrections recorded for this session.
              </p>
            ) : (
              <div className="space-y-4">
                {groupByExercise(session.corrections, exerciseNames).map((group) => (
                  <div key={group.code ?? 'general'}>
                    {group.name && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
                        <span className="opacity-50 mr-1.5">{group.code}</span>{group.name}
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {group.items.map((text, i) => (
                        <li key={i} className="text-sm leading-relaxed">{text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {session.openQuestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-[0.07em]">
                  Open questions
                </p>
                <ul className="space-y-1">
                  {session.openQuestions.map((q, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  )

  const timelineDayContent = currentSession ? (
    <DayView
      session={currentSession}
      exerciseNames={exerciseNames}
      hasPrev={sessionIndex < sessions.length - 1}
      hasNext={sessionIndex > 0}
      onPrev={() => setSessionIndex((i) => i + 1)}
      onNext={() => setSessionIndex((i) => i - 1)}
    />
  ) : (
    <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
  )

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[40px] leading-[1.1] -tracking-[0.01em]">
        Welcome back, Crystal
      </h1>

      {/* ── Mobile tab layout ── */}
      <div className="md:hidden space-y-6">
        <div className="flex border-b border-border">
          {(['tracker', 'priorities', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={cn(
                'flex-1 pb-2 text-xs font-semibold uppercase tracking-[0.07em] transition-colors',
                mobileTab === tab
                  ? 'border-b-2 border-foreground text-foreground -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'tracker' ? 'Tracker' : tab === 'priorities' ? 'Priorities' : 'Timeline'}
            </button>
          ))}
        </div>

        {mobileTab === 'tracker' && (
          <ExerciseTracker sessions={sessions} exerciseNames={exerciseNames} />
        )}

        {mobileTab === 'priorities' && prioritiesContent}

        {mobileTab === 'timeline' && (
          <div className="space-y-2">
            {timelineHeader}
            {view === 'list' ? timelineListContent : timelineDayContent}
          </div>
        )}
      </div>

      {/* ── Desktop layout (unchanged) ── */}
      <div className="hidden md:block">
        <ExerciseTracker sessions={sessions} exerciseNames={exerciseNames} />
      </div>

      {view === 'list' ? (
        <div className="hidden md:flex gap-10 items-start">
          {/* Left — priorities */}
          <div className="flex-1 min-w-0 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
              Current Priorities
            </h2>
            {prioritiesContent}
          </div>

          {/* Right — timeline */}
          <div className="w-80 shrink-0 space-y-2">
            {timelineHeader}
            {timelineListContent}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex gap-10 items-start">
          {/* Left — priorities */}
          <div className="flex-1 min-w-0 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
              Current Priorities
            </h2>
            {prioritiesContent}
          </div>

          {/* Right — day view */}
          <div className="w-80 shrink-0">
            {timelineHeader}
            {timelineDayContent}
          </div>
        </div>
      )}
    </div>
  )
}
