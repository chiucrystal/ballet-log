import { getTerminology } from '@/lib/data'
import TerminologyClient from './TerminologyClient'

export default async function TerminologyPage() {
  const data = await getTerminology()
  return <TerminologyClient terms={data.terms} grades={data.meta.grades} />
}
