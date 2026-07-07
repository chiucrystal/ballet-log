import Link from 'next/link'
import { getTerminology } from '@/lib/data'
import { TimelineDemoClient } from './TimelineDemoClient'

export const dynamic = 'force-dynamic'

const OPEN_QUESTIONS: { question: string; stance: string }[] = [
  {
    question: 'Compound phrase authoring — does an autocompleted term pre-size its block, or does the teacher size first?',
    stance:
      'Sized first, in this demo: MVP terms are free text with no vocab-id matching, so there’s no default duration to apply. The teacher draws the width, the term just labels it.',
  },
  {
    question: 'Track height / arm track default state — empty-collapsed, or always visible?',
    stance: 'Always visible, empty until a block is added — signals the option on first use.',
  },
  {
    question: 'What renders when arms have no entry under a leg block?',
    stance: 'Blank space. No implicit "held from previous position" indicator in this pass.',
  },
  {
    question: 'Does the shared read-only component hold up at a glance mid-class?',
    stance: 'Not answered here — studio mode below is the same component, unstyled for decode-speed. Flagged as a follow-up, not resolved by this demo.',
  },
]

export default async function TimelineDemoPage() {
  const terminology = await getTerminology()
  const seedVocab = terminology.terms
    .filter((t) => t.free_enchainement_role)
    .map((t) => t.term)
    .sort((a, b) => a.localeCompare(b))

  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <Link href="/combinations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Combinations
        </Link>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-heading text-[28px] leading-[1.2]">Exercise Timeline (demo)</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Spec v0.2 exploration: a dual-track, drag-to-set-duration builder that replaces typed count entry with a
          half-count snapped grid. This page is for evaluating the interaction, not a shipped feature — it doesn&apos;t
          read from or write to the combinations database yet.
        </p>
      </div>

      <TimelineDemoClient seedVocab={seedVocab} />

      <div className="border-t border-border pt-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
          Open questions — stance taken for this demo
        </h2>
        <dl className="space-y-4">
          {OPEN_QUESTIONS.map((item) => (
            <div key={item.question} className="text-sm">
              <dt className="font-medium">{item.question}</dt>
              <dd className="text-muted-foreground leading-relaxed mt-0.5">{item.stance}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
