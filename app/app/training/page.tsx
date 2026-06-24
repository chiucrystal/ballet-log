import { getSessions, formatDate } from '@/lib/data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function TrainingPage() {
  const sessions = await getSessions()
  const sessionsWithExercises = sessions.filter((s) => s.homeExercises.length > 0)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Home Training</h1>

      {sessionsWithExercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">No home exercises recorded yet.</p>
      ) : (
        sessionsWithExercises.map((session) => (
          <div key={session.date} className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
