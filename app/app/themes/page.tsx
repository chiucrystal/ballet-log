import { getSessions, getCorrections, formatDate } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

// Rubric criteria bucketed into 4 groups so each can carry a distinct accent
// tint. Brand orange is reserved for the gradient only (never a standalone
// fill), so the "control" bucket uses an ink-tinted neutral instead.
const RUBRIC_BUCKETS: Record<string, 'placement' | 'control' | 'musicality' | 'performance'> = {
  'correct posture and weight placement': 'placement',
  'line': 'placement',
  'control': 'control',
  'co-ordination': 'control',
  'timing': 'musicality',
  'dynamic values': 'musicality',
  'responsiveness to music': 'musicality',
  'expression': 'performance',
  'projection': 'performance',
  'communication': 'performance',
}

const RUBRIC_STYLES: Record<string, string> = {
  placement: 'bg-[#bdbbff]/50 text-foreground',
  control: 'bg-primary/10 text-primary',
  musicality: 'bg-[#c8f6f9] text-foreground',
  performance: 'bg-[#ef2cc1]/20 text-foreground',
}

type ThemeCorrectionItem = { text: string; exercise: string | null; date: string }

function groupByExercise(items: ThemeCorrectionItem[], exerciseNames: Record<string, string>) {
  const order: (string | null)[] = []
  const map = new Map<string | null, ThemeCorrectionItem[]>()
  for (const item of items) {
    if (!map.has(item.exercise)) {
      order.push(item.exercise)
      map.set(item.exercise, [])
    }
    map.get(item.exercise)!.push(item)
  }
  return order.map((code) => ({
    code,
    name: code ? (exerciseNames[code] ?? code) : 'General',
    items: map.get(code)!,
  }))
}

export default async function ThemesPage() {
  const [sessions, corrections] = await Promise.all([getSessions(), getCorrections()])
  const exerciseNames = Object.fromEntries(corrections.exercises.map((e) => [e.code, e.name]))

  const themeCorrections: Record<string, ThemeCorrectionItem[]> = {}
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
      <Accordion multiple>
        {corrections.themes.map((theme) => {
          const items = themeCorrections[theme.name] ?? []
          return (
            <AccordionItem key={theme.name} value={theme.name}>
              <AccordionTrigger>
                <div className="text-left flex-1 pr-4">
                  <span className="font-medium">{theme.name}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {theme.summary}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No corrections recorded yet.</p>
                ) : (
                  <div className="space-y-5">
                    {groupByExercise(items, exerciseNames).map((group) => (
                      <div key={group.code ?? 'general'}>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-2">
                          {group.code && <span className="mr-1.5 opacity-60">{group.code}</span>}
                          {group.name}
                        </p>
                        <ul className="space-y-2.5">
                          {group.items.map((c, i) => (
                            <li key={i} className="flex items-baseline justify-between gap-3 text-sm leading-relaxed">
                              <span className="flex-1">{c.text}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{formatDate(c.date)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {theme.markCriteria.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-1.5">
                    {theme.markCriteria.map((c) => (
                      <Badge
                        key={c}
                        className={cn('text-xs capitalize', RUBRIC_STYLES[RUBRIC_BUCKETS[c]] ?? 'bg-secondary text-secondary-foreground')}
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
