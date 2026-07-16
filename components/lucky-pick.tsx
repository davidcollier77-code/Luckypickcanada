'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Clover,
  Sparkles,
  Palette,
  CalendarDays,
  RefreshCw,
  Gift,
} from 'lucide-react'
import { PROVINCES } from '@/lib/provinces'
import { generateLuck, PICK_POOLS, type LuckResult, type PickCount } from '@/lib/luck'
import { AuroraReveal } from '@/components/aurora-reveal'
import { LuckyPickCheckout } from '@/components/lucky-pick-checkout'

type Step = 'form' | 'paying' | 'revealed'

export function LuckyPick() {
  const [name, setName] = useState('')
  const [province, setProvince] = useState('')
  const [pick, setPick] = useState<PickCount>(6)
  const [step, setStep] = useState<Step>('form')
  const [result, setResult] = useState<LuckResult | null>(null)
  const [revealName, setRevealName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !province) return
    setRevealName(name.trim())
    setStep('paying')
  }

  function handlePaid() {
    // Payment confirmed by Stripe — now generate and reveal the luck.
    setResult(generateLuck(name, province, undefined, pick))
    setStep('revealed')
  }

  function reset() {
    setResult(null)
    setStep('form')
    setName('')
    setProvince('')
    setPick(6)
  }

  if (step === 'revealed' && result) {
    return <LuckReveal name={revealName} result={result} onReset={reset} />
  }

  if (step === 'paying') {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex flex-col gap-1 text-center">
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Clover className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            One dollar for a little luck
          </h3>
          <p className="text-sm text-muted-foreground text-balance">
            {revealName}, your {pick} lucky numbers from 1 to {PICK_POOLS[pick].max} are ready.
            Complete your $1 LuckyPick below to reveal them.
          </p>
        </div>
        <LuckyPickCheckout onComplete={handlePaid} />
        <button
          type="button"
          onClick={() => setStep('form')}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-2 text-accent">
            <Clover className="h-5 w-5" aria-hidden="true" />
            <span className="font-display text-sm font-semibold uppercase tracking-wide">
              The LuckyPick Experience
            </span>
          </div>
          <div>
            <label
              htmlFor="lp-name"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              First name
            </label>
            <input
              id="lp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. David"
              autoComplete="given-name"
              maxLength={40}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label
              htmlFor="lp-province"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Province or territory
            </label>
            <select
              id="lp-province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                Choose your province…
              </option>
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold text-foreground">
              How many lucky numbers?
            </legend>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="How many lucky numbers">
              {([6, 7] as const).map((count) => {
                const active = pick === count
                return (
                  <button
                    key={count}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPick(count)}
                    className={
                      'flex flex-col items-center gap-0.5 rounded-xl border px-4 py-3 text-center transition-colors ' +
                      (active
                        ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                        : 'border-input bg-background text-muted-foreground hover:border-primary/40')
                    }
                  >
                    <span className="font-display text-lg font-bold text-foreground">
                      {count} numbers
                    </span>
                    <span className="text-xs">
                      {`from 1 to ${PICK_POOLS[count].max}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={!name.trim() || !province}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Get My LuckyPick — $1
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Just $1 for fun. Secure checkout by Stripe. No account needed and no personal
            details are stored.
          </p>
        </form>
      }
    </div>
  )
}

function LuckReveal({
  name,
  result,
  onReset,
}: {
  name: string
  result: LuckResult
  onReset: () => void
}) {
  return (
    <AuroraReveal>
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="animate-reveal-rise text-center" style={{ animationDelay: '0.05s' }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
            <Clover className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="mt-3 font-display text-2xl font-bold text-white text-balance">
            {name}, here is your luck!
          </h3>
          <p className="text-sm text-white/70">Your personal lucky reveal for today</p>
        </div>

        <div
          className="animate-reveal-rise rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="mb-3 flex items-center justify-between gap-2 text-white/80">
            <div className="flex items-center gap-2">
              <Clover className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Your {result.count} Lucky Numbers
              </span>
            </div>
            <span className="text-xs font-medium text-white/60">from 1 to {result.max}</span>
          </div>
          <div
            className="flex flex-wrap justify-center gap-2 sm:gap-2.5"
            aria-label={`Lucky numbers: ${result.numbers.join(', ')}`}
          >
            {result.numbers.map((n, i) => (
              <span
                key={n}
                className="animate-reveal-rise flex h-12 w-12 items-center justify-center rounded-full bg-white font-display text-xl font-bold text-primary shadow-lg sm:h-14 sm:w-14"
                style={{ animationDelay: `${0.25 + i * 0.08}s` }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="animate-reveal-rise rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm"
            style={{ animationDelay: '0.35s' }}
          >
            <div className="mb-2 flex items-center gap-2 text-white/70">
              <Palette className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-bold uppercase tracking-wide">Lucky Colour</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full ring-2 ring-white/40"
                style={{ backgroundColor: result.colour.hex }}
                aria-hidden="true"
              />
              <span className="text-lg font-bold text-white">{result.colour.name}</span>
            </div>
            <p className="mt-1 text-xs text-white/60">A great colour to wear today.</p>
          </div>

          <div
            className="animate-reveal-rise rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm"
            style={{ animationDelay: '0.45s' }}
          >
            <div className="mb-2 flex items-center gap-2 text-white/70">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-bold uppercase tracking-wide">Lucky Day</span>
            </div>
            <span className="text-lg font-bold text-white">{result.day}</span>
            <p className="mt-1 text-xs text-white/60">Your luckiest day this week.</p>
          </div>
        </div>

        <div
          className="animate-reveal-rise rounded-2xl bg-white/10 p-5 text-center ring-1 ring-white/15 backdrop-blur-sm"
          style={{ animationDelay: '0.55s' }}
        >
          <p className="font-display text-lg font-semibold text-white text-balance">
            <Sparkles className="mr-1.5 inline h-4 w-4 text-white/80" aria-hidden="true" />
            {result.message}
          </p>
        </div>

        <div
          className="animate-reveal-rise flex flex-col gap-3 sm:flex-row"
          style={{ animationDelay: '0.65s' }}
        >
          <button
            type="button"
            onClick={onReset}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Another Name
          </button>
          <Link
            href="/send-luck"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary transition-transform hover:scale-[1.02]"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            Send Luck to a Friend
          </Link>
        </div>
      </div>
    </AuroraReveal>
  )
}
