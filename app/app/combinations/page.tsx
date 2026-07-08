import Link from 'next/link'
import { getCombinations } from '@/lib/db/combinations'
import { getCorrections } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DeleteCombinationButton } from './DeleteCombinationButton'

export const dynamic = 'force-dynamic'

const SECTION_ORDER = ['Barre', 'Centre', 'Adage', 'Allegro', 'Pointe', 'Variation', 'Free Enchaînement']

export default async function CombinationsPage() {
  const [combos, corrections] = await Promise.all([getCombinations(), getCorrections()])

  const exerciseNames = new Map(corrections.exercises.map((e) => [e.code, e.name]))

  const grouped = combos.reduce<Record<string, typeof combos>>((acc, combo) => {
    acc[combo.section] = acc[combo.section] ?? []
    acc[combo.section].push(combo)
    return acc
  }, {})

  const sections = [
    ...SECTION_ORDER.filter((s) => grouped[s]?.length),
    ...Object.keys(grouped).filter((s) => !SECTION_ORDER.includes(s)),
  ]

  return (
    <div className="space-y-12">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-[1.2]">Combinations</h1>
        <Button render={<Link href="/combinations/new" />} nativeButton={false}>
          New combination
        </Button>
      </div>

      {combos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No combinations yet. Build your first one to start drilling specific corrections.
        </p>
      )}

      {sections.map((section) => (
        <section key={section}>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-6">
            {section}
          </h2>
          <div className="space-y-10">
            {grouped[section].map((combo) => (
              <div key={combo.id} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-border">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-heading text-xl">{combo.name}</h3>
                    {combo.timeSignature && (
                      <span className="text-sm text-muted-foreground">{combo.timeSignature}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Link
                      href={`/combinations/${combo.id}/edit`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </Link>
                    <DeleteCombinationButton id={combo.id} name={combo.name} />
                  </div>
                </div>

                {(combo.tempoStyle || combo.commence) && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {[combo.tempoStyle, combo.commence].filter(Boolean).join(' · ')}
                  </p>
                )}

                {combo.intro && (
                  <p className="text-sm text-muted-foreground/80 italic">Intro: {combo.intro}</p>
                )}

                {combo.steps.length > 0 && (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        <th className="font-semibold pb-2 pr-4 w-20">Counts</th>
                        <th className="font-semibold pb-2 pr-4">Step</th>
                        <th className="font-semibold pb-2">Arms / Head</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combo.steps.map((step) => (
                        <tr key={step.id} className="border-t border-border/60 align-top">
                          <td className="py-1.5 pr-4 text-muted-foreground">{step.counts}</td>
                          <td className="py-1.5 pr-4">{step.step}</td>
                          <td className="py-1.5 text-muted-foreground">{step.armsHead}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {combo.notes && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{combo.notes}</p>
                )}

                {combo.targets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {combo.targets.map((target) => (
                      <Badge key={target.id} className="text-muted-foreground">
                        {target.type === 'exercise'
                          ? `${target.value} — ${exerciseNames.get(target.value) ?? target.value}`
                          : target.value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
