import { getSessions, getCorrections, formatDate } from '@/lib/data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AccordionRoot, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

export default async function Home() {
  const [sessions, corrections] = await Promise.all([getSessions(), getCorrections()])

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Welcome back, Crystal</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Current Priorities
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
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
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
                  <ul className="space-y-2.5">
                    {session.corrections.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex-1 leading-relaxed">{c.text}</span>
                        <div className="flex gap-1 shrink-0 mt-0.5">
                          {c.exercise && <Badge>{c.exercise}</Badge>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {session.openQuestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
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
      </section>
    </div>
  )
}
