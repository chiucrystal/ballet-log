import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const combinations = pgTable('combinations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  section: text('section').notNull(),
  timeSignature: text('time_signature'),
  tempoStyle: text('tempo_style'),
  commence: text('commence'),
  intro: text('intro'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const combinationSteps = pgTable('combination_steps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  combinationId: text('combination_id')
    .notNull()
    .references(() => combinations.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  counts: text('counts'),
  step: text('step').notNull(),
  armsHead: text('arms_head'),
})

// type is 'theme' (root-cause category from corrections.json) or 'exercise' (AF/DR syllabus code)
export const combinationTargets = pgTable('combination_targets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  combinationId: text('combination_id')
    .notNull()
    .references(() => combinations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  value: text('value').notNull(),
})
