import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCorrections, getSessions } from '@/lib/data'
import { getSectionBySlug } from '@/lib/exercises-tree'
import { getExerciseCorrections, groupByTheme } from '@/lib/theme-groups'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ classSlug: string; sectionSlug: string; code: string }>
}) {
  const { classSlug, sectionSlug, code } = await params
  const located = getSectionBySlug(classSlug, sectionSlug)
  if (!located) notFound()
  const { cls, section } = located
  if (!section.codes.includes(code)) notFound()

  const [corrections, sessions] = await Promise.all([getCorrections(), getSessions()])
  const exercise = corrections.exercises.find((e) => e.code === code)
  if (!exercise) notFound()

  const groups = groupByTheme(getExerciseCorrections(sessions, code))

  const idx = section.codes.indexOf(code)
  const prevCode = idx > 0 ? section.codes[idx - 1] : null
  const nextCode = idx < section.codes.length - 1 ? section.codes[idx + 1] : null
  const prevEx = prevCode ? corrections.exercises.find((e) => e.code === prevCode) : null
  const nextEx = nextCode ? corrections.exercises.find((e) => e.code === nextCode) : null

  const base = `/exercises/${classSlug}/${sectionSlug}`

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Syllabus', href: '/exercises' },
          { label: cls.category, href: `/exercises/${classSlug}` },
          { label: section.name, href: base },
          { label: exercise.name },
        ]}
      />

      <div className="flex items-baseline gap-2 mb-6 pb-3 border-b border-border">
        <h1 className="font-mono text-[28px] leading-[1.2]">{exercise.name}</h1>
        <span className="text-sm text-muted-foreground">{exercise.code}</span>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.theme} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={
                    group.colorVar
                      ? { backgroundColor: `var(${group.colorVar})` }
                      : { backgroundColor: 'var(--muted-foreground)', opacity: 0.55 }
                  }
                />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em]">
                  {group.theme}
                </span>
              </div>
              <ul className="space-y-1.5 ml-4">
                {group.items.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No corrections recorded yet.</p>
      )}

      <div className="flex items-center justify-between gap-4 mt-10 pt-4 border-t border-border">
        {prevEx ? (
          <Link
            href={`${base}/${prevEx.code}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            {prevEx.name}
          </Link>
        ) : <span />}
        {nextEx ? (
          <Link
            href={`${base}/${nextEx.code}`}
            className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {nextEx.name}
            <ChevronRight className="size-4" />
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
