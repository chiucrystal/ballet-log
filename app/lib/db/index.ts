import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

let _db: Db | undefined

// lazy so importing this module (e.g. during `next build`'s route analysis)
// doesn't require DATABASE_URL to already be set — only querying does
function getDb(): Db {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL (or POSTGRES_URL) env var is not set')
    }
    const client = postgres(connectionString, { max: 1 })
    _db = drizzle(client, { schema })
  }
  return _db
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
