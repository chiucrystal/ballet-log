import Link from 'next/link'
import { getCorrections } from '@/lib/data'
import { EXERCISES_TREE, slugify } from '@/lib/exercises-tree'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default async function ExercisesPage() {
  const corrections = await getCorrections()
  const exercises = corrections.exercises

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Syllabus' }]} />
      <h1 className="font-mono text-[28px] leading-[1.2] mb-6">Syllabus</h1>
      <div className="space-y-3">
        {EXERCISES_TREE.map((cat) => {
          const total = cat.subgroups.reduce((n, sg) => n + sg.codes.length, 0)
          const covered = cat.subgroups.reduce(
            (n, sg) => n + sg.codes.filter((code) => exercises.some((e) => e.code === code)).length,
            0
          )
          return (
            <Link
              key={cat.category}
              href={`/exercises/${slugify(cat.category)}`}
              className="flex items-baseline justify-between gap-2 rounded-sm border border-border px-4 py-3.5 hover:border-foreground/30 transition-colors"
            >
              <span className="font-heading text-base">{cat.category}</span>
              <span className="text-xs text-muted-foreground shrink-0">{covered}/{total} exercises</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
