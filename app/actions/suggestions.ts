'use server'

import { db } from '@/lib/db'
import { suggestions } from '@/lib/db/schema'

export type SuggestionFormState = { ok: boolean; error?: string }

// Stores a suggestion-box submission. Email is optional (for a reply).
export async function submitSuggestion(
  _prev: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const category = String(formData.get('category') ?? 'Something else').trim()
  const message = String(formData.get('message') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()

  if (!message) {
    return { ok: false, error: 'Please share your idea before sending.' }
  }
  if (message.length > 500) {
    return { ok: false, error: 'That suggestion is a little too long.' }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'That email address looks invalid.' }
  }

  await db.insert(suggestions).values({
    category: category || 'Something else',
    message,
    email: email || null,
  })

  return { ok: true }
}
