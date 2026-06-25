import { getSessions, getCorrections, formatDate } from '@/lib/data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AccordionRoot, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

function groupByExercise(
  corrections: { text: string; theme: string; exercise: string | null }[],
  nameMap: Map<string, string>,
): { code: string | null; name: string | null; items: string[] }[] {
  const order: (string | null)[] = []
  const map = new Map<string | null, string[]>()
  for (const c of corrections) {
    if (!map.has(c.exercise)) {
      order.push(c.exercise)
      map.set(c.exercise, [])
    }
    map.get(c.exercise)!.push(c.text)
  }
  return order.map((code) => ({
    code,
    name: code ? (nameMap.get(code) ?? code) : null,
    items: map.get(code)!,
  }))
}

export default async function Home() {
  const [sessions, corrections] = await Promise.all([getSessions(), getCorrections()])
  const exerciseNames = new Map(corrections.exercises.map((e) => [e.code, e.name]))

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[40px] leading-[1.1] -tracking-[0.01em]">Welcome back, Crystal</h1>

      <div className="flex gap-10 items-start">
        {/* Left — priorities */}
        <div className="flex-1 min-w-0 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Current Priorities
          </h2>
          <div className="space-y-3">
            {corrections.priorities.map((p, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{i + 1}. {p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{p.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right — timeline */}
        <div className="w-80 shrink-0 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Session Timeline
          </h2>
          <AccordionRoot multiple>
            {sessions.map((session) => (
              <AccordionItem key={session.date} value={session.date}>
                <AccordionTrigger>
                  <div className="text-left">
                    <div className="font-medium">{formatDate(session.date)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{session.context}</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {session.corrections.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No corrections recorded for this session.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {groupByExercise(session.corrections, exerciseNames).map((group) => (
                        <div key={group.code ?? 'general'}>
                          {group.name && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
                              <span className="opacity-50 mr-1.5">{group.code}</span>{group.name}
                            </p>
                          )}
                          <ul className="space-y-1.5">
                            {group.items.map((text, i) => (
                              <li key={i} className="text-sm leading-relaxed">{text}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {session.openQuestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-[0.07em]">
                        Open questions
                      </p>
                      <ul className="space-y-1">
                        {session.openQuestions.map((q, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </AccordionRoot>
        </div>
      </div>
    </div>
  )
}
