import Link from 'next/link'
import { EXERCISES_TREE, slugify } from '@/lib/exercises-tree'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default function ExercisesPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Syllabus' }]} />
      <h1 className="font-mono text-[28px] leading-[1.2] mb-6">Syllabus</h1>
      <div className="space-y-3">
        {EXERCISES_TREE.map((cat) => (
          <Link
            key={cat.category}
            href={`/exercises/${slugify(cat.category)}`}
            className="block rounded-sm border border-border px-4 py-3.5 hover:border-foreground/30 transition-colors"
          >
            <span className="font-heading text-base">{cat.category}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
