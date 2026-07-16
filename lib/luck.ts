// Deterministic "luck" engine.
// Given the same name + province + day, the reveal stays the same for that day,
// so a visitor's luck feels personal and consistent throughout the day.
//
// This is purely for fun/entertainment. Numbers are randomly generated and do
// NOT predict lottery results or improve any chance of winning.

// --- tiny seeded PRNG (xmur3 + mulberry32) ---
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeRng(seed: string): () => number {
  const seedFn = xmur3(seed)
  return mulberry32(seedFn())
}

export const LUCKY_COLOURS = [
  { name: 'Blue', hex: '#2f6fed' },
  { name: 'Green', hex: '#2e9e5b' },
  { name: 'Red', hex: '#d63b3b' },
  { name: 'Sunshine Yellow', hex: '#e8b93b' },
  { name: 'Teal', hex: '#189a9a' },
  { name: 'Coral', hex: '#f2734d' },
  { name: 'Warm Orange', hex: '#e2782b' },
  { name: 'Rose Pink', hex: '#e05b8a' },
  { name: 'Forest Green', hex: '#2f7d4f' },
  { name: 'Sky Blue', hex: '#4aa3e0' },
  { name: 'Maple Brown', hex: '#9a5b34' },
  { name: 'Charcoal', hex: '#3f4650' },
]

export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const MESSAGES = [
  'Carry a little luck with you today!',
  'Good things are heading your way. Keep your eyes open!',
  'Today is a great day to try something new.',
  'A little luck goes a long way. Share some with a friend!',
  'Smile big today — luck loves a happy heart.',
  'Keep going. Your lucky moment might be just around the corner.',
  'The stars lined up just for you today. Make it count!',
  'Luck is on your side. Take the leap!',
  'Something wonderful is brewing. Stay hopeful!',
  'You bring your own luck — and today it is shining bright.',
]

export type PickCount = 6 | 7

// Lottery-style pools the visitor can choose from.
// 6 numbers drawn from 1-49, or 7 numbers drawn from 1-50.
export const PICK_POOLS: Record<PickCount, { count: PickCount; max: number }> = {
  6: { count: 6, max: 49 },
  7: { count: 7, max: 50 },
}

export type LuckResult = {
  numbers: number[]
  count: PickCount
  max: number
  colour: { name: string; hex: string }
  day: string
  message: string
}

// Draw `count` unique numbers from 1..max, returned in ascending order.
export function drawNumbers(rng: () => number, count: number, max: number): number[] {
  const set = new Set<number>()
  while (set.size < count) {
    set.add(Math.floor(rng() * max) + 1)
  }
  return Array.from(set).sort((a, b) => a - b)
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function generateLuck(
  name: string,
  province: string,
  seedExtra = todayKey(),
  pick: PickCount = 6,
): LuckResult {
  const cleanName = name.trim().toLowerCase() || 'friend'
  const pool = PICK_POOLS[pick] ?? PICK_POOLS[6]
  const rng = makeRng(`${cleanName}|${province}|${seedExtra}|${pool.count}`)

  const numbers = drawNumbers(rng, pool.count, pool.max)
  const colour = LUCKY_COLOURS[Math.floor(rng() * LUCKY_COLOURS.length)]
  const day = DAYS[Math.floor(rng() * DAYS.length)]
  const message = MESSAGES[Math.floor(rng() * MESSAGES.length)]

  return { numbers, count: pool.count, max: pool.max, colour, day, message }
}
