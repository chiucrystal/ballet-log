import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCorrections } from '@/lib/data'
import { getClassBySlug, slugify } from '@/lib/exercises-tree'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classSlug: string }>
}) {
  const { classSlug } = await params
  const cls = getClassBySlug(classSlug)
  if (!cls) notFound()

  const corrections = await getCorrections()
  const exercises = corrections.exercises

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Syllabus', href: '/exercises' },
          { label: cls.category },
        ]}
      />
      <h1 className="font-mono text-[28px] leading-[1.2] mb-6">{cls.category}</h1>
      <div className="space-y-3">
        {cls.subgroups.map((sg) => {
          const covered = sg.codes.filter((code) => exercises.some((e) => e.code === code)).length
          return (
            <Link
              key={sg.name}
              href={`/exercises/${classSlug}/${slugify(sg.name)}`}
              className="flex items-baseline justify-between gap-2 rounded-sm border border-border px-4 py-3.5 hover:border-foreground/30 transition-colors"
            >
              <span className="font-heading text-base">{sg.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{covered}/{sg.codes.length} exercises</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
