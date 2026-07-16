'use server'

import { db } from '@/lib/db'
import { stories, type Story } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { provinceName } from '@/lib/provinces'
import { revalidatePath } from 'next/cache'

export type PublicStory = {
  id: number
  name: string
  province: string | null
  message: string
}

// Returns only approved stories for public display, newest first.
export async function getApprovedStories(): Promise<PublicStory[]> {
  const rows = await db
    .select()
    .from(stories)
    .where(eq(stories.status, 'approved'))
    .orderBy(desc(stories.createdAt))

  return rows.map((s: Story) => ({
    id: s.id,
    name: s.name,
    // Stored as a province code; present the friendly name for display.
    province: s.province ? provinceName(s.province) : null,
    message: s.message,
  }))
}

export type StoryFormState = { ok: boolean; error?: string }

// Accepts a community submission and stores it as 'pending' for review.
export async function submitStory(
  _prev: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const name = String(formData.get('name') ?? '').trim()
  const province = String(formData.get('province') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!name || !message) {
    return { ok: false, error: 'Please add your name and a short story.' }
  }
  if (name.length > 40 || message.length > 500) {
    return { ok: false, error: 'That entry is a little too long.' }
  }

  await db.insert(stories).values({
    name,
    province: province || null,
    message,
    status: 'pending',
  })

  revalidatePath('/stories')
  return { ok: true }
}
