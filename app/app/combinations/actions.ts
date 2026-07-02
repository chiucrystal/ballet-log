'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createCombination,
  updateCombination,
  deleteCombination,
  type CombinationInput,
  type StepInput,
  type TargetInput,
} from '@/lib/db/combinations'

function parseInput(formData: FormData): CombinationInput {
  const counts = formData.getAll('step_counts') as string[]
  const stepText = formData.getAll('step_text') as string[]
  const armsHead = formData.getAll('step_arms_head') as string[]

  const steps: StepInput[] = stepText
    .map((text, i) => ({ counts: counts[i] ?? '', step: text, armsHead: armsHead[i] ?? '' }))
    .filter((s) => s.step.trim().length > 0)

  const targets: TargetInput[] = formData
    .getAll('targets')
    .map((raw) => {
      const [type, ...rest] = String(raw).split(':')
      return { type: type as TargetInput['type'], value: rest.join(':') }
    })
    .filter((t) => (t.type === 'theme' || t.type === 'exercise') && t.value)

  return {
    name: String(formData.get('name') ?? '').trim(),
    section: String(formData.get('section') ?? '').trim(),
    timeSignature: String(formData.get('timeSignature') ?? '').trim(),
    tempoStyle: String(formData.get('tempoStyle') ?? '').trim(),
    commence: String(formData.get('commence') ?? '').trim(),
    intro: String(formData.get('intro') ?? '').trim(),
    notes: String(formData.get('notes') ?? '').trim(),
    steps,
    targets,
  }
}

export async function createCombinationAction(formData: FormData) {
  const input = parseInput(formData)
  if (!input.name || !input.section) {
    throw new Error('Name and section are required')
  }
  await createCombination(input)
  revalidatePath('/combinations')
  redirect('/combinations')
}

export async function updateCombinationAction(id: string, formData: FormData) {
  const input = parseInput(formData)
  if (!input.name || !input.section) {
    throw new Error('Name and section are required')
  }
  await updateCombination(id, input)
  revalidatePath('/combinations')
  revalidatePath(`/combinations/${id}`)
  redirect('/combinations')
}

export async function deleteCombinationAction(id: string) {
  await deleteCombination(id)
  revalidatePath('/combinations')
}
