'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SelectRoot, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CombinationWithDetails } from '@/lib/db/combinations'

const SECTIONS = ['Barre', 'Centre', 'Adage', 'Allegro', 'Pointe', 'Variation', 'Free Enchaînement', 'Other']

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

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
  const [page, setPage] = useState<1 | 2>(1)
  const formRef = useRef<HTMLFormElement>(null)

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

  function goToStep2() {
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity()
      return
    }
    setPage(2)
  }

  return (
    <form ref={formRef} action={action} className="space-y-8 max-w-3xl">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Step {page} of 2 — {page === 1 ? 'Details' : 'Steps'}
      </p>

      <div className={cn('space-y-8', page !== 1 && 'hidden')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initial?.name}
              placeholder="e.g. Fondu prep for AF-05"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="section">Section</Label>
            <SelectRoot name="section" required defaultValue={initial?.section}>
              <SelectTrigger id="section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div className="space-y-1">
            <Label htmlFor="timeSignature">Time signature</Label>
            <Input
              id="timeSignature"
              name="timeSignature"
              defaultValue={initial?.timeSignature ?? ''}
              placeholder="e.g. 3/4"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tempoStyle">Tempo / style</Label>
            <Input
              id="tempoStyle"
              name="tempoStyle"
              defaultValue={initial?.tempoStyle ?? ''}
              placeholder="e.g. Medium fast rag tempo"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="commence">Commence</Label>
            <Input
              id="commence"
              name="commence"
              defaultValue={initial?.commence ?? ''}
              placeholder="e.g. 5th position, bras bas"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="intro">Intro</Label>
            <Input
              id="intro"
              name="intro"
              defaultValue={initial?.intro ?? ''}
              placeholder="e.g. 4 counts — Hold (1-2)..."
            />
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            What is this drilling?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Root cause themes</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {themes.map((theme) => (
                  <div key={theme} className="flex items-start gap-2">
                    <Checkbox
                      id={`theme-${slug(theme)}`}
                      name="targets"
                      value={`theme:${theme}`}
                      defaultChecked={initialTargetKeys.has(`theme:${theme}`)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`theme-${slug(theme)}`} className="font-normal cursor-pointer">
                      {theme}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Syllabus exercises</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {exercises.map((ex) => (
                  <div key={ex.code} className="flex items-start gap-2">
                    <Checkbox
                      id={`exercise-${slug(ex.code)}`}
                      name="targets"
                      value={`exercise:${ex.code}`}
                      defaultChecked={initialTargetKeys.has(`exercise:${ex.code}`)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`exercise-${slug(ex.code)}`} className="font-normal cursor-pointer">
                      {ex.code} — {ex.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initial?.notes ?? ''}
            placeholder="Anything else worth remembering about this combination"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={goToStep2}>Next: Steps</Button>
          <Link href="/combinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>
      </div>

      <div className={cn('space-y-8', page !== 2 && 'hidden')}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Steps</h2>
            <Button type="button" variant="link" size="sm" onClick={addStep} className="h-auto p-0 text-xs">
              + Add step
            </Button>
          </div>
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.key} className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr_auto] gap-2 items-start">
                <Input
                  name="step_counts"
                  value={step.counts}
                  onChange={(e) => updateStep(step.key, 'counts', e.target.value)}
                  placeholder="1-2"
                />
                <Input
                  name="step_text"
                  value={step.step}
                  onChange={(e) => updateStep(step.key, 'step', e.target.value)}
                  placeholder="Step"
                />
                <Input
                  name="step_arms_head"
                  value={step.armsHead}
                  onChange={(e) => updateStep(step.key, 'armsHead', e.target.value)}
                  placeholder="Arms / head"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(step.key)}
                  disabled={steps.length === 1}
                  className="justify-self-start text-muted-foreground hover:text-destructive sm:justify-self-auto"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setPage(1)}>Back</Button>
          <Button type="submit">{initial ? 'Save changes' : 'Save combination'}</Button>
          <Link href="/combinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  )
}
