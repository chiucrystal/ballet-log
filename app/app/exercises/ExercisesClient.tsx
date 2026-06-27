"use client"

import { useRef, useEffect, useCallback, useMemo } from "react"
import { useExNav } from "@/context/exercises-nav"
import { EXERCISES_TREE } from "@/lib/exercises-tree"
import type { Exercise } from "@/lib/types"

export default function ExercisesClient({ exercises }: { exercises: Exercise[] }) {
  const groups = useMemo(() =>
    EXERCISES_TREE.flatMap((cat) =>
      cat.subgroups.map((sg) => ({
        category: cat.category,
        subgroup: sg.name,
        exercises: sg.codes
          .map((code) => exercises.find((e) => e.code === code))
          .filter(Boolean) as Exercise[],
      }))
    ).filter((g) => g.exercises.length > 0),
    [exercises]
  )

  const orderedExercises = useMemo(
    () => groups.flatMap((g) => g.exercises),
    [groups]
  )

  const { _register, _setActive, _unregister } = useExNav()
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const programmingRef = useRef(false)

  const scrollTo = useCallback(
    (code: string) => {
      _setActive(code)
      programmingRef.current = true
      sectionRefs.current[code]?.scrollIntoView({ behavior: "smooth", block: "start" })
      setTimeout(() => {
        programmingRef.current = false
      }, 800)
    },
    [_setActive]
  )

  useEffect(() => {
    _register(orderedExercises, scrollTo)
    return () => _unregister()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onScroll() {
      if (programmingRef.current) return
      let hit = orderedExercises[0]?.code ?? ""
      for (const ex of orderedExercises) {
        const el = sectionRefs.current[ex.code]
        if (el && el.getBoundingClientRect().top <= 100) hit = ex.code
      }
      _setActive(hit)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [orderedExercises, _setActive])

  return (
    <div>
      {groups.map((group) => (
        <div key={`${group.category}__${group.subgroup ?? "flat"}`} className="mb-12">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.category}
            </p>
            {group.subgroup && (
              <h3 className="text-base font-semibold text-foreground mt-0.5">
                {group.subgroup}
              </h3>
            )}
          </div>

          {group.exercises.map((exercise) => (
            <section
              key={exercise.code}
              ref={(el) => { sectionRefs.current[exercise.code] = el }}
              className="mb-10 scroll-mt-[4.5rem] md:scroll-mt-8"
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
      ))}
    </div>
  )
}
