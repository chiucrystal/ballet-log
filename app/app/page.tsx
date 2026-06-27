import { getSessions, getCorrections } from '@/lib/data'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [sessions, corrections] = await Promise.all([getSessions(), getCorrections()])
  const exerciseNames = Object.fromEntries(corrections.exercises.map((e) => [e.code, e.name]))

  return (
    <HomeClient
      sessions={sessions}
      priorities={corrections.priorities}
      exerciseNames={exerciseNames}
    />
  )
}
