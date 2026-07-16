'use client'

import { useState } from 'react'
import { Heart, Coffee, Clover, Sparkles, ArrowLeft } from 'lucide-react'
import { TipCheckout } from '@/components/tip-checkout'

const PRESETS = [
  { cents: 300, label: '$3', caption: 'A little luck', icon: Clover },
  { cents: 500, label: '$5', caption: 'Buy a coffee', icon: Coffee },
  { cents: 1000, label: '$10', caption: 'Big supporter', icon: Heart },
  { cents: 2000, label: '$20', caption: 'Lucky legend', icon: Sparkles },
]

const MIN_CENTS = 100
const MAX_CENTS = 50000

type Stage = 'choose' | 'pay' | 'done'

export function TipJar() {
  const [stage, setStage] = useState<Stage>('choose')
  const [selectedCents, setSelectedCents] = useState<number>(500)
  const [custom, setCustom] = useState('')
  const [error, setError] = useState('')

  function choosePreset(cents: number) {
    setSelectedCents(cents)
    setCustom('')
    setError('')
  }

  function onCustomChange(value: string) {
    // Allow only digits and a single decimal point.
    const cleaned = value.replace(/[^0-9.]/g, '')
    setCustom(cleaned)
    const dollars = Number.parseFloat(cleaned)
    if (!Number.isNaN(dollars)) {
      setSelectedCents(Math.round(dollars * 100))
    }
    setError('')
  }

  function proceed() {
    if (!Number.isInteger(selectedCents) || selectedCents < MIN_CENTS) {
      setError('Please enter at least $1.00.')
      return
    }
    if (selectedCents > MAX_CENTS) {
      setError('The maximum tip is $500.00.')
      return
    }
    setError('')
    setStage('pay')
  }

  const amountLabel = `$${(selectedCents / 100).toFixed(2)}`

  if (stage === 'done') {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Heart className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
          Thank you so much!
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-muted-foreground">
          Your support helps keep LuckyPickCanada.ca friendly and full of luck for everyone.
          You are officially a little bit lucky today.
        </p>
        <button
          type="button"
          onClick={() => {
            setStage('choose')
            setCustom('')
            setSelectedCents(500)
          }}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <Clover className="h-4 w-4" aria-hidden="true" />
          Back to the Tip Jar
        </button>
      </div>
    )
  }

  if (stage === 'pay') {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStage('choose')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Change amount
          </button>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
            Tipping {amountLabel} CAD
          </span>
        </div>
        <TipCheckout amountInCents={selectedCents} onComplete={() => setStage('done')} />
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center gap-2 text-accent">
        <Coffee className="h-5 w-5" aria-hidden="true" />
        <span className="font-display text-sm font-semibold uppercase tracking-wide">
          The Lucky Tip Jar
        </span>
      </div>

      <p className="mb-5 text-pretty text-muted-foreground">
        Tips are completely optional and separate from your $1 LuckyPick. If the site brought a
        smile to your day, you can chip in any amount you like to help keep it running. Every
        little bit means a lot.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const Icon = p.icon
          const active = !custom && selectedCents === p.cents
          return (
            <button
              key={p.cents}
              type="button"
              onClick={() => choosePreset(p.cents)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-center transition-colors ${
                active
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40 hover:bg-muted'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${active ? 'text-primary' : 'text-accent'}`}
                aria-hidden="true"
              />
              <span className="font-display text-lg font-bold text-foreground">{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.caption}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        <label
          htmlFor="tip-custom"
          className="mb-1.5 block text-sm font-semibold text-foreground"
        >
          Or enter your own amount (CAD)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">
            $
          </span>
          <input
            id="tip-custom"
            type="text"
            inputMode="decimal"
            value={custom}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Any amount you like"
            className="w-full rounded-xl border border-input bg-background py-3 pl-8 pr-4 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={proceed}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
      >
        <Heart className="h-5 w-5" aria-hidden="true" />
        Support with {amountLabel}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secure payment powered by Stripe. This is a voluntary tip, not a purchase.
      </p>
    </div>
  )
}
