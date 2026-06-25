import { getCorrections } from '@/lib/data'
import ExercisesClient from './ExercisesClient'

export default async function ExercisesPage() {
  const corrections = await getCorrections()
  return <ExercisesClient exercises={corrections.exercises} />
}
