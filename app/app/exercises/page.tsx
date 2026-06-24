import Link from 'next/link'
import { getCorrections } from '@/lib/data'
import { cn } from '@/lib/utils'

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { ex } = await searchParams
  const corrections = await getCorrections()

  const selectedCode = typeof ex === 'string' ? ex : corrections.exercises[0]?.code
  const selected = corrections.exercises.find((e) => e.code === selectedCode)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">By Exercise</h1>

      <div className="flex flex-wrap gap-2">
        {corrections.exercises.map((exercise) => (
          <Link
            key={exercise.code}
            href={`/exercises?ex=${exercise.code}`}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border transition-colors',
              exercise.code === selectedCode
                ? 'bg-foreground text-background border-foreground'
                : 'border-border hover:bg-muted'
            )}
          >
            {exercise.code}
          </Link>
        ))}
      </div>

      {selected && (
        <div className="space-y-1">
          <h2 className="text-base font-medium">{selected.name}</h2>
          <ul className="divide-y divide-border">
            {selected.corrections.map((c, i) => (
              <li key={i} className="py-3 text-sm leading-relaxed">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
