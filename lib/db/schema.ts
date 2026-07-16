import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

// Anonymous, per-province tally of LuckyPick reveals.
// Only a province code and a running count are stored — no personal data.
export const luckTallies = pgTable('luck_tallies', {
  province: text('province').primaryKey(),
  count: integer('count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Community "Did Luck Find You?" stories.
// status: 'pending' until an admin approves; only 'approved' show publicly.
export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  province: text('province'),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// LuckyPick suggestion box submissions.
export const suggestions = pgTable('suggestions', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  category: text('category').notNull().default('idea'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Story = typeof stories.$inferSelect
export type LuckTally = typeof luckTallies.$inferSelect
export type Suggestion = typeof suggestions.$inferSelect
