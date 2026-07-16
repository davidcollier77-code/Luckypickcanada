'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Lock } from 'lucide-react'
import { login, type LoginState } from '@/app/actions/admin'

const initialState: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Lock className="h-4 w-4" aria-hidden="true" />
      {pending ? 'Checking…' : 'Sign In'}
    </button>
  )
}

export function AdminLogin() {
  const [state, formAction] = useActionState(login, initialState)

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Sign In</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your password to review submissions.
        </p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {state.error && (
          <p className="text-sm font-semibold text-destructive" role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>
    </div>
  )
}
