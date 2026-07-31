import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCorrections, getSessions } from '@/lib/data'
import { getSectionBySlug } from '@/lib/exercises-tree'
import { getExerciseCorrections } from '@/lib/theme-groups'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default async function SectionPage({
  params,
}: {
  params: Promise<{ classSlug: string; sectionSlug: string }>
}) {
  const { classSlug, sectionSlug } = await params
  const located = getSectionBySlug(classSlug, sectionSlug)
  if (!located) notFound()
  const { cls, section } = located

  const [corrections, sessions] = await Promise.all([getCorrections(), getSessions()])
  const exercises = section.codes
    .map((code) => corrections.exercises.find((e) => e.code === code))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((e) => ({ ...e, latestCorrection: getExerciseCorrections(sessions, e.code)[0]?.text ?? null }))

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: cls.category, href: `/exercises/${classSlug}` },
          { label: section.name },
        ]}
      />
      <h1 className="font-mono text-[28px] leading-[1.2] mb-6">{section.name}</h1>
      <div className="space-y-3">
        {exercises.map((ex) => (
          <Link
            key={ex.code}
            href={`/exercises/${classSlug}/${sectionSlug}/${ex.code}`}
            className="block rounded-sm border border-border px-4 py-3.5 hover:border-foreground/30 transition-colors"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-heading text-base">{ex.name}</span>
              <span className="font-mono text-xs text-muted-foreground shrink-0">{ex.code}</span>
            </div>
            {ex.latestCorrection && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
                {ex.latestCorrection}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
