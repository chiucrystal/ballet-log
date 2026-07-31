import { Check, X } from 'lucide-react'
import { getPointeShoes, formatMonthYear } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default async function PointeShoesPage() {
  const shoes = await getPointeShoes()

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-mono text-[28px] leading-[1.2]">Pointe Shoe Journey</h1>
        <div
          className="h-[3px] w-16"
          style={{ background: 'linear-gradient(to right, #FC4C02, #EF2CC1, #BDBBFF)' }}
        />
      </div>

      <div className="relative max-w-2xl">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />

        <div className="space-y-10">
          {shoes.map((shoe) => (
            <div key={shoe.id} className="relative pl-8">
              <span
                className={cn(
                  'absolute left-0 top-1.5 size-3.5 rounded-full border-2',
                  shoe.current
                    ? 'bg-primary border-primary'
                    : 'bg-background border-muted-foreground/40'
                )}
                aria-hidden
              />

              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {formatMonthYear(shoe.date)}
                </p>
                {shoe.current && <Badge>Current</Badge>}
              </div>

              <h2 className="font-heading text-xl mt-1">
                {shoe.brand} <span className="text-muted-foreground">{shoe.model}</span>
              </h2>

              {(shoe.pros.length > 0 || shoe.cons.length > 0) && (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                      Pros
                    </p>
                    {shoe.pros.length > 0 ? (
                      <ul className="space-y-1.5">
                        {shoe.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                            <Check className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">None noted</p>
                    )}
                  </div>

                  <div>
                    <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                      Cons
                    </p>
                    {shoe.cons.length > 0 ? (
                      <ul className="space-y-1.5">
                        {shoe.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                            <X className="size-3.5 mt-0.5 shrink-0 text-destructive/70" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">None noted</p>
                    )}
                  </div>
                </div>
              )}

              {shoe.fitNotes && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {shoe.fitNotes}
                </p>
              )}

              {shoe.pros.length === 0 && shoe.cons.length === 0 && !shoe.fitNotes && (
                <p className="mt-3 text-sm text-muted-foreground/60 italic">
                  Currently trialling — notes to come.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
