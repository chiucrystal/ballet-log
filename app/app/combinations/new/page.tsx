import { getCorrections } from '@/lib/data'
import { CombinationBuilder } from '../CombinationBuilder'
import { createCombinationAction } from '../actions'

export default async function NewCombinationPage() {
  const corrections = await getCorrections()
  const themes = corrections.themes.map((t) => t.name)
  const exercises = corrections.exercises.map((e) => ({ code: e.code, name: e.name }))

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[28px] leading-[1.2]">New Combination</h1>
      <CombinationBuilder themes={themes} exercises={exercises} action={createCombinationAction} />
    </div>
  )
}
