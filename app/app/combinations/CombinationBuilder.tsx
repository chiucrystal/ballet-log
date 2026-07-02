'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { CombinationWithDetails } from '@/lib/db/combinations'

const SECTIONS = ['Barre', 'Centre', 'Adage', 'Allegro', 'Pointe', 'Variation', 'Free Enchaînement', 'Other']

interface StepRow {
  key: number
  counts: string
  step: string
  armsHead: string
}

export function CombinationBuilder({
  themes,
  exercises,
  action,
  initial,
}: {
  themes: string[]
  exercises: { code: string; name: string }[]
  action: (formData: FormData) => void
  initial?: CombinationWithDetails
}) {
  const [steps, setSteps] = useState<StepRow[]>(() =>
    initial && initial.steps.length > 0
      ? initial.steps.map((s, i) => ({ key: i, counts: s.counts ?? '', step: s.step, armsHead: s.armsHead ?? '' }))
      : [{ key: 0, counts: '', step: '', armsHead: '' }]
  )
  const nextKey = useRef(steps.length)

  const initialTargetKeys = new Set(initial?.targets.map((t) => `${t.type}:${t.value}`) ?? [])

  function addStep() {
    setSteps((prev) => [...prev, { key: nextKey.current++, counts: '', step: '', armsHead: '' }])
  }

  function removeStep(key: number) {
    setSteps((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev))
  }

  function updateStep(key: number, field: keyof Omit<StepRow, 'key'>, value: string) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)))
  }

  const inputClass =
    'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
  const labelClass = 'text-xs font-medium text-muted-foreground mb-1 block'

  return (
    <form action={action} className="space-y-8 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initial?.name}
            placeholder="e.g. Fondu prep for AF-05"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="section">Section</label>
          <select id="section" name="section" required defaultValue={initial?.section ?? ''} className={inputClass}>
            <option value="" disabled>Select a section</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="timeSignature">Time signature</label>
          <input
            id="timeSignature"
            name="timeSignature"
            defaultValue={initial?.timeSignature ?? ''}
            placeholder="e.g. 3/4"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="tempoStyle">Tempo / style</label>
          <input
            id="tempoStyle"
            name="tempoStyle"
            defaultValue={initial?.tempoStyle ?? ''}
            placeholder="e.g. Medium fast rag tempo"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="commence">Commence</label>
          <input
            id="commence"
            name="commence"
            defaultValue={initial?.commence ?? ''}
            placeholder="e.g. 5th position, bras bas"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="intro">Intro</label>
          <input
            id="intro"
            name="intro"
            defaultValue={initial?.intro ?? ''}
            placeholder="e.g. 4 counts — Hold (1-2)..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Steps</h2>
          <button type="button" onClick={addStep} className="text-xs text-primary hover:underline">
            + Add step
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.key} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-start">
              <input
                name="step_counts"
                value={step.counts}
                onChange={(e) => updateStep(step.key, 'counts', e.target.value)}
                placeholder="1-2"
                className={inputClass}
              />
              <input
                name="step_text"
                value={step.step}
                onChange={(e) => updateStep(step.key, 'step', e.target.value)}
                placeholder="Step"
                className={inputClass}
              />
              <input
                name="step_arms_head"
                value={step.armsHead}
                onChange={(e) => updateStep(step.key, 'armsHead', e.target.value)}
                placeholder="Arms / head"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeStep(step.key)}
                disabled={steps.length === 1}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
          What is this drilling?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Root cause themes</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {themes.map((theme) => (
                <label key={theme} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="targets"
                    value={`theme:${theme}`}
                    defaultChecked={initialTargetKeys.has(`theme:${theme}`)}
                    className="mt-0.5"
                  />
                  <span>{theme}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Syllabus exercises</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {exercises.map((ex) => (
                <label key={ex.code} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="targets"
                    value={`exercise:${ex.code}`}
                    defaultChecked={initialTargetKeys.has(`exercise:${ex.code}`)}
                    className="mt-0.5"
                  />
                  <span>{ex.code} — {ex.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ''}
          placeholder="Anything else worth remembering about this combination"
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">{initial ? 'Save changes' : 'Save combination'}</Button>
        <Link href="/combinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
