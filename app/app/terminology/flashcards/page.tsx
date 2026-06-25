import { getTerminology } from '@/lib/data'
import FlashCardsClient from './FlashCardsClient'

export default async function FlashCardsPage() {
  const data = await getTerminology()
  return <FlashCardsClient terms={data.terms} grades={data.meta.grades} />
}
