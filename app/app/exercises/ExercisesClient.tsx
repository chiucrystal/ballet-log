"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { Exercise } from "@/lib/types"

const TREE = [
  {
    category: "Advanced Foundation",
    subgroups: [
      { name: "Barre", codes: ["AF-01", "AF-02", "AF-05", "AF-06", "AF-08"] },
      { name: "Centre", codes: ["AF-09", "AF-10", "AF-11F", "AF-12", "AF-25", "ALLEGRO"] },
    ],
  },
  {
    category: "Discovering Repertoire",
    subgroups: [{ name: null, codes: ["DR"] }],
  },
]

const ITEM_H = 28
const GROUP_H = 24

function VLine({ height, top = 0 }: { height: number; top?: number }) {
  return (
    <div
      className="absolute w-px bg-border"
      style={{ left: 0, top, height }}
    />
  )
}

function HLine({ top }: { top: number }) {
  return (
    <div
      className="absolute h-px w-3 bg-border"
      style={{ left: 0, top }}
    />
  )
}

function ExerciseItem({
  exercise,
  isActive,
  onClick,
}: {
  exercise: Exercise
  isActive: boolean
  onClick: () => void
}) {
  const label = `${exercise.name} (${exercise.code})`
  return (
    <div className="relative" style={{ height: ITEM_H }}>
      <HLine top={ITEM_H / 2 - 0.5} />
      <button
        onClick={onClick}
        title={label}
        className={cn(
          "absolute inset-y-0 right-0 ml-3 w-[calc(100%-12px)] flex items-center px-2 rounded-md text-left text-xs transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <span className="truncate">{label}</span>
      </button>
    </div>
  )
}

function SubgroupBlock({
  name,
  exercises,
  activeCode,
  onSelect,
}: {
  name: string | null
  exercises: Exercise[]
  activeCode: string
  onSelect: (code: string) => void
}) {
  const n = exercises.length

  if (!name) {
    return (
      <div className="relative pl-3" style={{ height: n * ITEM_H }}>
        <VLine height={n * ITEM_H - ITEM_H / 2} />
        {exercises.map((ex) => (
          <ExerciseItem
            key={ex.code}
            exercise={ex}
            isActive={activeCode === ex.code}
            onClick={() => onSelect(ex.code)}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ height: GROUP_H + n * ITEM_H }}>
      <div className="relative flex items-center" style={{ height: GROUP_H }}>
        <HLine top={GROUP_H / 2 - 0.5} />
        <span className="ml-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {name}
        </span>
      </div>
      <div className="relative ml-4 pl-3" style={{ height: n * ITEM_H }}>
        <VLine height={n * ITEM_H - ITEM_H / 2} />
        {exercises.map((ex) => (
          <ExerciseItem
            key={ex.code}
            exercise={ex}
            isActive={activeCode === ex.code}
            onClick={() => onSelect(ex.code)}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryNav({
  category,
  subgroups,
  exercises,
  activeCode,
  onSelect,
}: {
  category: string
  subgroups: { name: string | null; codes: string[] }[]
  exercises: Exercise[]
  activeCode: string
  onSelect: (code: string) => void
}) {
  const resolvedSubgroups = subgroups.map((sg) => ({
    name: sg.name,
    exercises: sg.codes
      .map((code) => exercises.find((e) => e.code === code))
      .filter(Boolean) as Exercise[],
  }))

  const totalH = resolvedSubgroups.reduce(
    (sum, sg) =>
      sum + (sg.name ? GROUP_H + sg.exercises.length * ITEM_H : sg.exercises.length * ITEM_H),
    0
  )

  return (
    <div className="mb-5">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {category}
      </p>
      <div className="relative pl-3" style={{ height: totalH }}>
        <VLine height={totalH - ITEM_H / 2} />
        {resolvedSubgroups.map((sg) => (
          <SubgroupBlock
            key={sg.name ?? "__flat__"}
            name={sg.name}
            exercises={sg.exercises}
            activeCode={activeCode}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

export default function ExercisesClient({ exercises }: { exercises: Exercise[] }) {
  const allCodes = TREE.flatMap((cat) => cat.subgroups.flatMap((sg) => sg.codes))
  const orderedExercises = allCodes
    .map((code) => exercises.find((e) => e.code === code))
    .filter(Boolean) as Exercise[]

  const [activeCode, setActiveCode] = useState(orderedExercises[0]?.code ?? "")
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const programmingRef = useRef(false)

  const scrollTo = useCallback((code: string) => {
    setActiveCode(code)
    programmingRef.current = true
    sectionRefs.current[code]?.scrollIntoView({ behavior: "smooth", block: "start" })
    setTimeout(() => { programmingRef.current = false }, 800)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onScroll() {
      if (programmingRef.current) return
      const top = el!.scrollTop + 80
      let hit = orderedExercises[0]?.code ?? ""
      for (const ex of orderedExercises) {
        const ref = sectionRefs.current[ex.code]
        if (ref && ref.offsetTop <= top) hit = ex.code
      }
      setActiveCode(hit)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [orderedExercises])

  return (
    <div className="-mx-6 -my-8 flex">
      {/* Tree nav — sticky */}
      <aside className="w-52 shrink-0 border-r border-border sticky top-14 h-[calc(100dvh-3.5rem)] md:top-0 md:h-dvh overflow-y-auto py-6 px-3">
        {TREE.map((cat) => (
          <CategoryNav
            key={cat.category}
            category={cat.category}
            subgroups={cat.subgroups}
            exercises={exercises}
            activeCode={activeCode}
            onSelect={scrollTo}
          />
        ))}
      </aside>

      {/* Corrections content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-8">
        {orderedExercises.map((exercise) => (
          <section
            key={exercise.code}
            ref={(el) => { sectionRefs.current[exercise.code] = el }}
            className="mb-10"
          >
            <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-border">
              <h2 className="font-heading text-xl">{exercise.name}</h2>
              <span className="text-sm text-muted-foreground">{exercise.code}</span>
            </div>
            <ul className="space-y-2">
              {exercise.corrections.map((correction, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                  <span className="text-muted-foreground/50 select-none mt-0.5 shrink-0">•</span>
                  <span>{correction}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
