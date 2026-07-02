import { eq, asc } from 'drizzle-orm'
import { db } from './index'
import { combinations, combinationSteps, combinationTargets } from './schema'

export interface StepInput {
  counts: string
  step: string
  armsHead: string
}

export interface TargetInput {
  type: 'theme' | 'exercise'
  value: string
}

export interface CombinationInput {
  name: string
  section: string
  timeSignature: string
  tempoStyle: string
  commence: string
  intro: string
  notes: string
  steps: StepInput[]
  targets: TargetInput[]
}

export interface CombinationWithDetails {
  id: string
  name: string
  section: string
  timeSignature: string | null
  tempoStyle: string | null
  commence: string | null
  intro: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  steps: { id: string; position: number; counts: string | null; step: string; armsHead: string | null }[]
  targets: { id: string; type: string; value: string }[]
}

export async function getCombinations(): Promise<CombinationWithDetails[]> {
  const [combos, steps, targets] = await Promise.all([
    db.select().from(combinations).orderBy(asc(combinations.createdAt)),
    db.select().from(combinationSteps).orderBy(asc(combinationSteps.position)),
    db.select().from(combinationTargets),
  ])

  return combos.map((combo) => ({
    ...combo,
    steps: steps.filter((s) => s.combinationId === combo.id),
    targets: targets.filter((t) => t.combinationId === combo.id),
  }))
}

export async function getCombination(id: string): Promise<CombinationWithDetails | null> {
  const [combo] = await db.select().from(combinations).where(eq(combinations.id, id))
  if (!combo) return null

  const [steps, targets] = await Promise.all([
    db
      .select()
      .from(combinationSteps)
      .where(eq(combinationSteps.combinationId, id))
      .orderBy(asc(combinationSteps.position)),
    db.select().from(combinationTargets).where(eq(combinationTargets.combinationId, id)),
  ])

  return { ...combo, steps, targets }
}

export async function createCombination(input: CombinationInput): Promise<string> {
  return db.transaction(async (tx) => {
    const [combo] = await tx
      .insert(combinations)
      .values({
        name: input.name,
        section: input.section,
        timeSignature: input.timeSignature || null,
        tempoStyle: input.tempoStyle || null,
        commence: input.commence || null,
        intro: input.intro || null,
        notes: input.notes || null,
      })
      .returning({ id: combinations.id })

    await insertStepsAndTargets(tx, combo.id, input)
    return combo.id
  })
}

export async function updateCombination(id: string, input: CombinationInput): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(combinations)
      .set({
        name: input.name,
        section: input.section,
        timeSignature: input.timeSignature || null,
        tempoStyle: input.tempoStyle || null,
        commence: input.commence || null,
        intro: input.intro || null,
        notes: input.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(combinations.id, id))

    await tx.delete(combinationSteps).where(eq(combinationSteps.combinationId, id))
    await tx.delete(combinationTargets).where(eq(combinationTargets.combinationId, id))
    await insertStepsAndTargets(tx, id, input)
  })
}

export async function deleteCombination(id: string): Promise<void> {
  await db.delete(combinations).where(eq(combinations.id, id))
}

// shared by create/update — steps/targets are always fully replaced, never patched in place
async function insertStepsAndTargets(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  combinationId: string,
  input: CombinationInput
) {
  if (input.steps.length > 0) {
    await tx.insert(combinationSteps).values(
      input.steps.map((step, i) => ({
        combinationId,
        position: i,
        counts: step.counts || null,
        step: step.step,
        armsHead: step.armsHead || null,
      }))
    )
  }

  if (input.targets.length > 0) {
    await tx.insert(combinationTargets).values(
      input.targets.map((target) => ({
        combinationId,
        type: target.type,
        value: target.value,
      }))
    )
  }
}
