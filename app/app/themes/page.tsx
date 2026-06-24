import { getSessions, getCorrections, formatDate } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { AccordionRoot, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

export default async function ThemesPage() {
  const [sessions, corrections] = await Promise.all([getSessions(), getCorrections()])

  const themeCorrections: Record<string, Array<{ text: string; exercise: string | null; date: string }>> = {}
  for (const session of sessions) {
    for (const correction of session.corrections) {
      if (!themeCorrections[correction.theme]) {
        themeCorrections[correction.theme] = []
      }
      themeCorrections[correction.theme].push({
        text: correction.text,
        exercise: correction.exercise,
        date: session.date,
      })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-[28px] leading-[1.2]">Themes</h1>
      <AccordionRoot multiple>
        {corrections.themes.map((theme) => {
          const items = themeCorrections[theme.name] ?? []
          return (
            <AccordionItem key={theme.name} value={theme.name}>
              <AccordionTrigger>
                <div className="text-left flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{theme.name}</span>
                    {theme.examImpact && (
                      <Badge className="text-xs">Exam impact</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {theme.summary}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No corrections recorded yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {items.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex-1 leading-relaxed">{c.text}</span>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {c.exercise && <Badge>{c.exercise}</Badge>}
                          <span className="text-xs text-muted-foreground">{formatDate(c.date)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {theme.markCriteria.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5">
                    {theme.markCriteria.map((c) => (
                      <Badge key={c} className="text-xs capitalize">{c}</Badge>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </AccordionRoot>
    </div>
  )
}
