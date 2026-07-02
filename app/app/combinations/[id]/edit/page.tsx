import { notFound } from 'next/navigation'
import { getCombination } from '@/lib/db/combinations'
import { getCorrections } from '@/lib/data'
import { CombinationBuilder } from '../../CombinationBuilder'
import { updateCombinationAction } from '../../actions'

export default async function EditCombinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [combo, corrections] = await Promise.all([getCombination(id), getCorrections()])

  if (!combo) notFound()

  const themes = corrections.themes.map((t) => t.name)
  const exercises = corrections.exercises.map((e) => ({ code: e.code, name: e.name }))
  const action = updateCombinationAction.bind(null, id)

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-[28px] leading-[1.2]">Edit Combination</h1>
      <CombinationBuilder themes={themes} exercises={exercises} action={action} initial={combo} />
    </div>
  )
}
