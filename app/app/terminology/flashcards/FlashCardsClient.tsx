'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Term, Grade } from '@/lib/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQueue(terms: Term[], grade: string): Term[] {
  const deck = grade === 'ALL' ? terms : terms.filter((t) => t.introduced_at_grade === grade)
  return shuffle(deck)
}

export default function FlashCardsClient({
  terms,
  grades,
}: {
  terms: Term[]
  grades: Grade[]
}) {
  const [grade, setGrade] = useState('ALL')
  const [isFlipped, setIsFlipped] = useState(false)
  const [animated, setAnimated] = useState(true)
  const [queue, setQueue] = useState<Term[]>(() => buildQueue(terms, 'ALL'))
  const [idx, setIdx] = useState(0)

  const gradeOptions = [
    { value: 'ALL', label: 'All' },
    ...grades.map((g) => ({ value: g.id, label: g.label })),
  ]

  function instantTo(newQueue: Term[], newIdx: number) {
    setAnimated(false)
    setIsFlipped(false)
    setQueue(newQueue)
    setIdx(newIdx)
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)))
  }

  function changeGrade(g: string) {
    setGrade(g)
    instantTo(buildQueue(terms, g), 0)
  }

  function next() {
    const nextIdx = idx + 1
    if (nextIdx >= queue.length) {
      const currentId = queue[idx]?.id
      let newQ = buildQueue(terms, grade)
      if (newQ[0]?.id === currentId && newQ.length > 1) {
        newQ = [newQ[1], newQ[0], ...newQ.slice(2)]
      }
      instantTo(newQ, 0)
    } else {
      setAnimated(false)
      setIsFlipped(false)
      setIdx(nextIdx)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)))
    }
  }

  const card = queue[idx]
  if (!card) {
    return <p className="text-muted-foreground text-sm">No terms for this grade.</p>
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[28px] leading-[1.2]">Flash Cards</h1>

      {/* Grade toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0 mr-1">
          Grade
        </span>
        {gradeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => changeGrade(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              grade === opt.value
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="max-w-lg">
        <div
          className="[perspective:1200px] cursor-pointer select-none"
          onClick={() => setIsFlipped((f) => !f)}
        >
          <div
            className={cn(
              'relative h-72 [transform-style:preserve-3d]',
              animated && 'transition-transform duration-[400ms] ease-in-out',
              isFlipped && '[transform:rotateY(180deg)]'
            )}
          >
            {/* Side A — term name */}
            <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center justify-center gap-5 p-10 rounded-2xl bg-card border border-border shadow-sm">
              <p className="font-heading text-[2rem] leading-snug text-center">{card.term}</p>
              <p className="text-xs text-muted-foreground/60 tracking-wide">tap to reveal</p>
            </div>

            {/* Side B — translation + description */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center gap-3 p-10 rounded-2xl bg-card border border-border shadow-sm">
              <p className="text-sm italic text-muted-foreground text-center leading-relaxed">
                {card.french_translation}
              </p>
              <div className="w-8 h-px bg-border" />
              <p className="text-sm text-center leading-relaxed">{card.description}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-muted-foreground tabular-nums">
            {idx + 1}
            <span className="mx-1 opacity-40">/</span>
            {queue.length}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-foreground text-background hover:opacity-80 transition-opacity"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
