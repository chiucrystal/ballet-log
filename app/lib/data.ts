import { promises as fs } from 'fs'
import path from 'path'
import type { Session, CorrectionsDoc, TerminologyDoc, LibraryExercise } from './types'
export { formatDate, formatShortDate } from './format'

const dataDir = path.join(process.cwd(), 'data')

export async function getSessions(): Promise<Session[]> {
  const sessionsDir = path.join(dataDir, 'sessions')
  const files = await fs.readdir(sessionsDir)
  const sessions = await Promise.all(
    files
      .filter(f => f.endsWith('.json'))
      .map(async (file) => {
        const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8')
        return JSON.parse(content) as Session
      })
  )
  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getCorrections(): Promise<CorrectionsDoc> {
  const content = await fs.readFile(path.join(dataDir, 'corrections.json'), 'utf-8')
  return JSON.parse(content) as CorrectionsDoc
}

export async function getTerminology(): Promise<TerminologyDoc> {
  const content = await fs.readFile(path.join(dataDir, 'terminology.json'), 'utf-8')
  return JSON.parse(content) as TerminologyDoc
}

export async function getHomeExercises(): Promise<LibraryExercise[]> {
  const content = await fs.readFile(path.join(dataDir, 'home-exercises.json'), 'utf-8')
  return JSON.parse(content) as LibraryExercise[]
}import { promises as fs } from 'fs'
import path from 'path'
import type { Session, CorrectionsDoc, TerminologyDoc } from './types'
export { formatDate, formatShortDate } from './format'

const dataDir = path.join(process.cwd(), 'data')

export async function getSessions(): Promise<Session[]> {
  const sessionsDir = path.join(dataDir, 'sessions')
  const files = await fs.readdir(sessionsDir)
  const sessions = await Promise.all(
    files
      .filter(f => f.endsWith('.json'))
      .map(async (file) => {
        const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8')
        return JSON.parse(content) as Session
      })
  )
  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getCorrections(): Promise<CorrectionsDoc> {
  const content = await fs.readFile(path.join(dataDir, 'corrections.json'), 'utf-8')
  return JSON.parse(content) as CorrectionsDoc
}

export async function getTerminology(): Promise<TerminologyDoc> {
  const content = await fs.readFile(path.join(dataDir, 'terminology.json'), 'utf-8')
  return JSON.parse(content) as TerminologyDoc
}

