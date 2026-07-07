'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function TagStep({
  seedTags,
  personalTags,
  selected,
  onSelectedChange,
  onAddPersonalTag,
}: {
  seedTags: string[]
  personalTags: string[]
  selected: string[]
  onSelectedChange: (tags: string[]) => void
  onAddPersonalTag: (tag: string) => void
}) {
  const [draft, setDraft] = useState('')

  function toggle(tag: string) {
    onSelectedChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
  }

  function addCustomTag() {
    const tag = draft.trim()
    if (!tag) return
    if (!personalTags.includes(tag) && !seedTags.includes(tag)) onAddPersonalTag(tag)
    if (!selected.includes(tag)) onSelectedChange([...selected, tag])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Selected</p>
        <div className="flex flex-wrap gap-1.5 min-h-6">
          {selected.length === 0 && <span className="text-xs text-muted-foreground/60">No tags yet</span>}
          {selected.map((tag) => (
            <Badge key={tag} className="cursor-pointer hover:bg-primary/80" onClick={() => toggle(tag)}>
              {tag}
              <button
                type="button"
                className="ml-1.5 text-primary-foreground/70 hover:text-primary-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(tag)
                }}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Seeded vocabulary <span className="text-muted-foreground/50">(free enchaînement only, for now)</span>
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {seedTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggle(tag)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                  selected.includes(tag)
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-input/20 text-foreground hover:bg-muted',
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Your custom tags</p>
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-6">
            {personalTags.length === 0 && <span className="text-xs text-muted-foreground/60">None saved yet</span>}
            {personalTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggle(tag)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                  selected.includes(tag)
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-input/20 text-foreground hover:bg-muted',
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomTag()
                }
              }}
              placeholder="Add a custom tag…"
            />
            <Button type="button" size="sm" onClick={addCustomTag}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
