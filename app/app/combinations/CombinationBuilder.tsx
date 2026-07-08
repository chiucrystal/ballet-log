'use client'

import { Fragment, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ExerciseTimeline } from '@/components/timeline/ExerciseTimeline'
import { cn } from '@/lib/utils'
import type { CombinationWithDetails } from '@/lib/db/combinations'
import type { TimelineBlock } from '@/lib/timeline-types'
import { blocksToStepRows, fitTotalCounts, stepRowsToBlocks } from '@/lib/timeline-steps'

const SECTIONS = ['Barre', 'Centre', 'Adage', 'Allegro', 'Pointe', 'Variation', 'Free Enchaînement', 'Other']
const STEPS_INFO = ['Setup', 'Add steps', 'Preview']

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
  const [{ legTrack, armTrack }, setTracks] = useState(() =>
    initial && initial.steps.length > 0 ? stepRowsToBlocks(initial.steps) : { legTrack: [] as TimelineBlock[], armTrack: [] as TimelineBlock[] }
  )
  const steps = useMemo(() => blocksToStepRows(legTrack, armTrack), [legTrack, armTrack])
  const totalCounts = useMemo(() => fitTotalCounts(legTrack, armTrack), [legTrack, armTrack])
  const [page, setPage] = useState<1 | 2 | 3>(1)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(() => {
    return new Set(initial?.targets.map((t) => `${t.type}:${t.value}`) ?? [])
  })
  const [formValues, setFormValues] = useState({
    name: initial?.name ?? '',
    section: initial?.section ?? '',
    timeSignature: initial?.timeSignature ?? '',
    tempoStyle: initial?.tempoStyle ?? '',
    commence: initial?.commence ?? '',
    intro: initial?.intro ?? '',
    notes: initial?.notes ?? '',
  })

  function setLegTrack(next: TimelineBlock[]) {
    setTracks((prev) => ({ ...prev, legTrack: next }))
  }

  function setArmTrack(next: TimelineBlock[]) {
    setTracks((prev) => ({ ...prev, armTrack: next }))
  }

  function toggleTarget(target: string) {
    setSelectedTargets((prev) => {
      const next = new Set(prev)
      if (next.has(target)) {
        next.delete(target)
      } else {
        next.add(target)
      }
      return next
    })
  }

  function goToStep2() {
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity()
      return
    }
    setPage(2)
  }

  function goToStep3() {
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity()
      return
    }
    setPage(3)
  }

  return (
    <form ref={formRef} action={action} className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        {STEPS_INFO.map((stepLabel, idx) => {
          const stepNum = idx + 1 as 1 | 2 | 3
          const isActive = page === stepNum
          const isComplete = page > stepNum
          return (
            <div key={stepNum} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors',
                  isActive && 'bg-primary text-primary-foreground',
                  isComplete && 'bg-primary/40 text-primary-foreground',
                  !isActive && !isComplete && 'bg-muted text-muted-foreground'
                )}
              >
                {stepNum}
              </div>
              <span className={cn('text-xs font-medium', isActive && 'text-foreground', !isActive && 'text-muted-foreground')}>
                {stepLabel}
              </span>
              {idx < STEPS_INFO.length - 1 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          )
        })}
      </div>

      <div className={cn('space-y-8', page !== 1 && 'hidden')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              value={formValues.name}
              onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Fondu prep for AF-05"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="section">Section</Label>
            <Select name="section" required value={formValues.section} onValueChange={(value) => value && setFormValues((prev) => ({ ...prev, section: value }))}>
              <SelectTrigger id="section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="timeSignature">Time signature</Label>
            <Input
              id="timeSignature"
              name="timeSignature"
              value={formValues.timeSignature}
              onChange={(e) => setFormValues((prev) => ({ ...prev, timeSignature: e.target.value }))}
              placeholder="e.g. 3/4"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tempoStyle">Tempo / style</Label>
            <Input
              id="tempoStyle"
              name="tempoStyle"
              value={formValues.tempoStyle}
              onChange={(e) => setFormValues((prev) => ({ ...prev, tempoStyle: e.target.value }))}
              placeholder="e.g. Medium fast rag tempo"
            />
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            What is this drilling?
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Selected</p>
              <div className="flex flex-wrap gap-2 min-h-6">
                {Array.from(selectedTargets).map((target) => {
                  const [type, value] = target.split(':')
                  const label = type === 'exercise'
                    ? `${value} — ${exercises.find((e) => e.code === value)?.name ?? value}`
                    : value
                  return (
                    <Badge
                      key={target}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleTarget(target)}
                    >
                      {label}
                      <button
                        type="button"
                        className="ml-1.5 text-primary-foreground/70 hover:text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTarget(target)
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Root cause themes</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {themes.map((theme) => {
                    const target = `theme:${theme}`
                    return (
                      <div key={theme} className="flex items-start gap-2">
                        <Checkbox
                          id={`theme-${slug(theme)}`}
                          checked={selectedTargets.has(target)}
                          onCheckedChange={() => toggleTarget(target)}
                          className="mt-0.5"
                        />
                        <Label htmlFor={`theme-${slug(theme)}`} className="font-normal cursor-pointer">
                          {theme}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Syllabus exercises</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {exercises.map((ex) => {
                    const target = `exercise:${ex.code}`
                    return (
                      <div key={ex.code} className="flex items-start gap-2">
                        <Checkbox
                          id={`exercise-${slug(ex.code)}`}
                          checked={selectedTargets.has(target)}
                          onCheckedChange={() => toggleTarget(target)}
                          className="mt-0.5"
                        />
                        <Label htmlFor={`exercise-${slug(ex.code)}`} className="font-normal cursor-pointer">
                          {ex.code} — {ex.name}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={goToStep2}>Next: Add steps</Button>
          <Link href="/combinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>
      </div>

      <div className={cn('space-y-8', page !== 2 && 'hidden')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="commence">Commence</Label>
              <Input
                id="commence"
                name="commence"
                value={formValues.commence}
                onChange={(e) => setFormValues((prev) => ({ ...prev, commence: e.target.value }))}
                placeholder="e.g. 5th position, bras bas"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="intro">Intro</Label>
              <Input
                id="intro"
                name="intro"
                value={formValues.intro}
                onChange={(e) => setFormValues((prev) => ({ ...prev, intro: e.target.value }))}
                placeholder="e.g. 4 counts — Hold (1-2)..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={formValues.notes}
              onChange={(e) => setFormValues((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Anything else worth remembering about this combination"
            />
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">Steps</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-2xl">
            Drag on an empty grid cell to draw a block, release to name it. Drag a block&apos;s body to move it, its
            edges to resize it. Click a block to select it (× appears), long-press to delete, double-click to
            rename. Counts restart at 1 every 8 counts.
          </p>
          <ExerciseTimeline
            mode="author"
            legTrack={legTrack}
            armTrack={armTrack}
            onLegTrackChange={setLegTrack}
            onArmTrackChange={setArmTrack}
            totalCounts={totalCounts}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setPage(1)}>Back</Button>
          <Button type="button" onClick={goToStep3}>Next: Preview</Button>
          <Link href="/combinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>
      </div>

      <div className={cn('space-y-8', page !== 3 && 'hidden')}>
        <div className="space-y-6">
          <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-border">
            <div className="flex items-baseline gap-2">
              <h2 className="font-heading text-xl">{formValues.name || 'Combination'}</h2>
              {formValues.timeSignature && (
                <span className="text-sm text-muted-foreground">{formValues.timeSignature}</span>
              )}
            </div>
          </div>

          {(formValues.tempoStyle || formValues.commence) && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {[formValues.tempoStyle, formValues.commence].filter(Boolean).join(' · ')}
            </p>
          )}

          {formValues.intro && (
            <p className="text-sm text-muted-foreground/80 italic">Intro: {formValues.intro}</p>
          )}

          {steps.length > 0 && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  <th className="font-semibold pb-2 pr-4 w-20">Counts</th>
                  <th className="font-semibold pb-2 pr-4">Step</th>
                  <th className="font-semibold pb-2">Arms / Head</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.key} className="border-t border-border/60 align-top">
                    <td className="py-1.5 pr-4 text-muted-foreground">{step.counts}</td>
                    <td className="py-1.5 pr-4">{step.step}</td>
                    <td className="py-1.5 text-muted-foreground">{step.armsHead}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {formValues.notes && (
            <p className="text-sm text-muted-foreground leading-relaxed">{formValues.notes}</p>
          )}

          {selectedTargets.size > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from(selectedTargets).map((target) => {
                const [type, value] = target.split(':')
                const label = type === 'exercise'
                  ? `${value} — ${exercises.find((e) => e.code === value)?.name ?? value}`
                  : value
                return (
                  <Badge key={target} className="text-muted-foreground">
                    {label}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setPage(2)}>Back</Button>
          <Button type="submit">{initial ? 'Save changes' : 'Save combination'}</Button>
          <Link href="/combinations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </Link>
        </div>
      </div>

      {Array.from(selectedTargets).map((target) => (
        <input key={target} type="hidden" name="targets" value={target} />
      ))}
      {steps.map((step) => (
        <Fragment key={step.key}>
          <input type="hidden" name="step_counts" value={step.counts} />
          <input type="hidden" name="step_text" value={step.step} />
          <input type="hidden" name="step_arms_head" value={step.armsHead} />
        </Fragment>
      ))}
    </form>
  )
}
