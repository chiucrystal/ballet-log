'use client'

import { deleteCombinationAction } from './actions'

export function DeleteCombinationButton({ id, name }: { id: string; name: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (confirm(`Delete "${name}"? This can't be undone.`)) {
          await deleteCombinationAction(id)
        }
      }}
      className="text-muted-foreground hover:text-destructive transition-colors"
    >
      Delete
    </button>
  )
}
