import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCorrections } from '@/lib/data'
import { getSectionBySlug } from '@/lib/exercises-tree'
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

  const corrections = await getCorrections()
  const exercise = corrections.exercises.find((e) => e.code === code)
  if (!exercise) notFound()

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
          { label: cls.category, href: `/exercises/${classSlug}` },
          { label: section.name, href: base },
          { label: exercise.name },
        ]}
      />

      <div className="flex items-baseline gap-2 mb-6 pb-3 border-b border-border">
        <h1 className="font-mono text-[28px] leading-[1.2]">{exercise.name}</h1>
        <span className="text-sm text-muted-foreground">{exercise.code}</span>
      </div>

      {exercise.corrections.length > 0 ? (
        <ul className="space-y-2.5">
          {exercise.corrections.map((correction, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="text-muted-foreground/50 select-none mt-0.5 shrink-0">•</span>
              <span>{correction}</span>
            </li>
          ))}
        </ul>
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
