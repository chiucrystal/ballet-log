import { getHomeExercises } from '@/lib/data'
import type { LibraryExercise } from '@/lib/types'

const CATEGORY_ORDER = [
  'Core stability',
  'Back strength',
  'Ankle strength & pointe',
  'Ankle stability & balance',
]

export default async function TrainingPage() {
  const exercises = await getHomeExercises()

  const grouped = CATEGORY_ORDER.reduce<Record<string, LibraryExercise[]>>((acc, cat) => {
    const items = exercises.filter((e) => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const ungrouped = exercises.filter((e) => !CATEGORY_ORDER.includes(e.category))
  if (ungrouped.length > 0) {
    grouped['Other'] = ungrouped
  }

  return (
    <div className="space-y-12">
      <h1 className="font-heading text-[28px] leading-[1.2]">Home Training</h1>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-6">
            {category}
          </h2>
          <div className="space-y-8">
            {items.map((ex) => (
              <div key={ex.id} className="space-y-2">
                <div className="flex items-baseline gap-2 pb-2 border-b border-border">
                  <h3 className="font-heading text-xl">{ex.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ex.goal}</p>
                <details className="group">
                  <summary className="text-xs font-medium text-muted-foreground/70 cursor-pointer select-none mt-3 hover:text-foreground transition-colors list-none flex items-center gap-1.5">
                    <span className="group-open:hidden">How to</span>
                    <span className="hidden group-open:inline">Hide</span>
                    <svg
                      className="w-3 h-3 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-muted-foreground/80 leading-relaxed italic">
                      {ex.description}
                    </p>
                    <p className="text-sm leading-relaxed">{ex.howTo}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}import { getSessions, formatDate } from '@/lib/data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function TrainingPage() {
  const sessions = await getSessions()
  const sessionsWithExercises = sessions.filter((s) => s.homeExercises.length > 0)

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[28px] leading-[1.2]">Home Training</h1>

      {sessionsWithExercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">No home exercises recorded yet.</p>
      ) : (
        sessionsWithExercises.map((session) => (
          <div key={session.date} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
              {formatDate(session.date)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {session.homeExercises.map((ex, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>{ex.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ex.notes}</p>
                    <Badge className="mt-3">{ex.use}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
