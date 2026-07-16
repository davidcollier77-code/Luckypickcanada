'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Send, CheckCircle2 } from 'lucide-react'
import { PROVINCES } from '@/lib/provinces'
import { submitStory, type StoryFormState } from '@/app/actions/stories'

const initialState: StoryFormState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      <Send className="h-4 w-4" aria-hidden="true" />
      {pending ? 'Submitting…' : 'Submit for Review'}
    </button>
  )
}

export function StoryForm() {
  const [state, formAction] = useActionState(submitStory, initialState)
  const [storyLength, setStoryLength] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (state.ok) setDone(true)
  }, [state.ok])

  if (done) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mt-3 font-display text-xl font-bold text-foreground">
          Thank you for sharing!
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Every submission is reviewed before appearing publicly. Once approved, your
          lucky moment will join the wall of stories.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-5 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          Share another story
        </button>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      <h3 className="font-display text-xl font-bold text-foreground">
        Share your lucky moment
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about a fun, positive, or lucky experience. Reviewed before posting.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="story-name"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            First name
          </label>
          <input
            id="story-name"
            name="name"
            type="text"
            maxLength={40}
            required
            placeholder="e.g. Priya"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label
            htmlFor="story-province"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Province (optional)
          </label>
          <select
            id="story-province"
            name="province"
            className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Prefer not to say</option>
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label
          htmlFor="story-text"
          className="mb-1.5 block text-sm font-semibold text-foreground"
        >
          Your lucky story
        </label>
        <textarea
          id="story-text"
          name="message"
          maxLength={500}
          rows={4}
          required
          onChange={(e) => setStoryLength(e.target.value.length)}
          placeholder="What made your day feel a little lucky?"
          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <span className="mt-1 block text-right text-xs text-muted-foreground">
          {storyLength}/500
        </span>
      </div>
      {state.error && (
        <p className="mt-3 text-sm font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
