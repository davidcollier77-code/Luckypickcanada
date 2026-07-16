'use server'

import { db } from '@/lib/db'
import { stories, suggestions } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { provinceName } from '@/lib/provinces'
import { revalidatePath } from 'next/cache'
import {
  clearAdminCookie,
  isAdmin,
  setAdminCookie,
  verifyPassword,
} from '@/lib/admin'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'Incorrect password. Please try again.' }
  }
  await setAdminCookie()
  revalidatePath('/admin')
  return {}
}

export async function logout(): Promise<void> {
  await clearAdminCookie()
  revalidatePath('/admin')
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}

export type AdminStory = {
  id: number
  name: string
  province: string | null
  message: string
  status: string
  createdAt: Date
}

export type AdminSuggestion = {
  id: number
  category: string
  email: string | null
  message: string
  createdAt: Date
}

// Pending stories awaiting review, oldest first (fairest queue).
export async function getPendingStories(): Promise<AdminStory[]> {
  await requireAdmin()
  const rows = await db
    .select()
    .from(stories)
    .where(eq(stories.status, 'pending'))
    .orderBy(stories.createdAt)
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    province: s.province ? provinceName(s.province) : null,
    message: s.message,
    status: s.status,
    createdAt: s.createdAt,
  }))
}

export async function getSuggestions(): Promise<AdminSuggestion[]> {
  await requireAdmin()
  const rows = await db.select().from(suggestions).orderBy(desc(suggestions.createdAt))
  return rows.map((s) => ({
    id: s.id,
    category: s.category,
    email: s.email,
    message: s.message,
    createdAt: s.createdAt,
  }))
}

export async function approveStory(id: number): Promise<void> {
  await requireAdmin()
  await db.update(stories).set({ status: 'approved' }).where(eq(stories.id, id))
  revalidatePath('/admin')
  revalidatePath('/stories')
}

export async function rejectStory(id: number): Promise<void> {
  await requireAdmin()
  await db.delete(stories).where(eq(stories.id, id))
  revalidatePath('/admin')
}

export async function deleteSuggestion(id: number): Promise<void> {
  await requireAdmin()
  await db.delete(suggestions).where(eq(suggestions.id, id))
  revalidatePath('/admin')
}
