'use client'

import { useState, useTransition } from 'react'
import { Check, X, Trash2, Inbox, LogOut, Clover } from 'lucide-react'
import {
  approveStory,
  deleteSuggestion,
  logout,
  rejectStory,
  type AdminStory,
  type AdminSuggestion,
} from '@/app/actions/admin'

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AdminDashboard({
  pendingStories,
  suggestions,
}: {
  pendingStories: AdminStory[]
  suggestions: AdminSuggestion[]
}) {
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function run(key: string, fn: () => Promise<void>) {
    setBusyId(key)
    startTransition(async () => {
      try {
        await fn()
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clover className="h-4 w-4 text-accent" aria-hidden="true" />
          Signed in as admin
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>

      <section aria-labelledby="pending-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="pending-heading" className="font-display text-xl font-bold text-foreground">
            Pending Stories
          </h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
            {pendingStories.length}
          </span>
        </div>

        {pendingStories.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            <Inbox className="h-5 w-5" aria-hidden="true" />
            No stories waiting for review. All caught up!
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {pendingStories.map((s) => {
              const approveKey = `approve-${s.id}`
              const rejectKey = `reject-${s.id}`
              return (
                <li key={s.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{s.name}</span>
                    {s.province && <span>&middot; {s.province}</span>}
                    <span>&middot; {formatDate(s.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{s.message}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(approveKey, () => approveStory(s.id))}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {busyId === approveKey ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(rejectKey, () => rejectStory(s.id))}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      {busyId === rejectKey ? 'Removing…' : 'Reject'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="suggestions-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="suggestions-heading" className="font-display text-xl font-bold text-foreground">
            Suggestions
          </h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
            {suggestions.length}
          </span>
        </div>

        {suggestions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            <Inbox className="h-5 w-5" aria-hidden="true" />
            No suggestions yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {suggestions.map((s) => {
              const key = `sug-${s.id}`
              return (
                <li key={s.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                      {s.category}
                    </span>
                    <span>&middot; {formatDate(s.createdAt)}</span>
                    {s.email && (
                      <a
                        href={`mailto:${s.email}`}
                        className="font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {s.email}
                      </a>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{s.message}</p>
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(key, () => deleteSuggestion(s.id))}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {busyId === key ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
