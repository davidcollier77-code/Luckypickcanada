'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Lightbulb, CheckCircle2 } from 'lucide-react'
import { submitSuggestion, type SuggestionFormState } from '@/app/actions/suggestions'

const CATEGORIES = [
  'New idea',
  'Website improvement',
  'Feature request',
  'Something else',
]

const initialState: SuggestionFormState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      <Lightbulb className="h-4 w-4" aria-hidden="true" />
      {pending ? 'Sending…' : 'Send Suggestion'}
    </button>
  )
}

export function SuggestionForm() {
  const [state, formAction] = useActionState(submitSuggestion, initialState)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [ideaLength, setIdeaLength] = useState(0)
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
          Idea received — thank you!
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We read every suggestion. Thanks for helping make LuckyPickCanada.ca even more
          fun.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false)
            setCategory(CATEGORIES[0])
            setIdeaLength(0)
          }}
          className="mt-5 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          Suggest something else
        </button>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      <input type="hidden" name="category" value={category} />
      <div className="flex items-center gap-2 text-accent">
        <Lightbulb className="h-5 w-5" aria-hidden="true" />
        <span className="font-display text-sm font-semibold uppercase tracking-wide">
          Suggestion Box
        </span>
      </div>
      <h3 className="mt-2 font-display text-xl font-bold text-foreground">
        Share your idea
      </h3>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-semibold text-foreground">Type</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="idea"
          className="mb-1.5 block text-sm font-semibold text-foreground"
        >
          Your suggestion
        </label>
        <textarea
          id="idea"
          name="message"
          onChange={(e) => setIdeaLength(e.target.value.length)}
          maxLength={500}
          rows={4}
          required
          placeholder="What would make LuckyPickCanada.ca better?"
          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <span className="mt-1 block text-right text-xs text-muted-foreground">
          {ideaLength}/500
        </span>
      </div>

      <div className="mt-2">
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-semibold text-foreground"
        >
          Email (optional)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="If you would like a reply"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
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
