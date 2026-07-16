'use server'

import { db } from '@/lib/db'
import { luckTallies } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { PROVINCES } from '@/lib/provinces'
import { revalidatePath } from 'next/cache'

const VALID_CODES = new Set(PROVINCES.map((p) => p.code))

// Returns a { [provinceCode]: count } map of all province tallies.
export async function getTallies(): Promise<Record<string, number>> {
  const rows = await db
    .select({ province: luckTallies.province, count: luckTallies.count })
    .from(luckTallies)

  const result: Record<string, number> = {}
  for (const row of rows) {
    result[row.province] = row.count
  }
  return result
}

// Increments a province's tally by one and returns the new count.
// Only a validated province code is accepted — no personal data is stored.
export async function addLuck(code: string): Promise<number> {
  if (!VALID_CODES.has(code)) {
    throw new Error('Invalid province')
  }

  const [row] = await db
    .insert(luckTallies)
    .values({ province: code, count: 1 })
    .onConflictDoUpdate({
      target: luckTallies.province,
      set: {
        count: sql`${luckTallies.count} + 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ count: luckTallies.count })

  revalidatePath('/map')
  return row.count
}
