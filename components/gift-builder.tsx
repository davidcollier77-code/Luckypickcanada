'use client'

import { useMemo, useState } from 'react'
import {
  Cake,
  HeartHandshake,
  Heart,
  Gem,
  Clover,
  Sparkles,
  CalendarDays,
  Palette,
  Lock,
} from 'lucide-react'
import { generateLuck } from '@/lib/luck'

const THEMES = [
  { id: 'birthday', label: 'Birthday Luck', icon: Cake },
  { id: 'encouragement', label: 'Encouragement Luck', icon: HeartHandshake },
  { id: 'friendship', label: 'Friendship Luck', icon: Heart },
  { id: 'anniversary', label: 'Anniversary Luck', icon: Gem },
  { id: 'justbecause', label: 'Just Because Luck', icon: Clover },
]

const PRICE = '$4.99'

export function GiftBuilder() {
  const [theme, setTheme] = useState('birthday')
  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'need-setup'>('idle')

  const preview = useMemo(
    () => generateLuck(recipient || 'friend', theme, 'gift'),
    [recipient, theme],
  )

  const activeTheme = THEMES.find((t) => t.id === theme)!

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Builder */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Create your luck gift
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize a digital luck reveal and send it to someone special.
        </p>

        <div className="mt-6">
          <span className="mb-2 block text-sm font-semibold text-foreground">
            Choose a theme
          </span>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const active = t.id === theme
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <t.icon className="h-4 w-4" aria-hidden="true" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="gift-recipient"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Recipient&apos;s name
            </label>
            <input
              id="gift-recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              maxLength={40}
              placeholder="e.g. Sarah"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label
              htmlFor="gift-sender"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Your name
            </label>
            <input
              id="gift-sender"
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              maxLength={40}
              placeholder="e.g. David"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="gift-message"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Personal message
          </label>
          <textarea
            id="gift-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={240}
            rows={3}
            placeholder="Add a warm note to go with the luck…"
            className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">
            {message.length}/240
          </span>
        </div>

        <button
          type="button"
          onClick={() => setStatus('need-setup')}
          disabled={!recipient.trim() || !sender.trim()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Send Luck — {PRICE}
        </button>
        {status === 'need-setup' && (
          <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-center text-sm text-secondary-foreground">
            Secure checkout is almost ready! Connect a payment provider to start sending
            paid luck gifts.
          </p>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Secure one-time payment. Your gift is created instantly after checkout.
        </p>
      </div>

      {/* Live preview */}
      <div>
        <div className="sticky top-20">
          <span className="mb-2 block text-sm font-semibold text-muted-foreground">
            Live preview
          </span>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-center gap-2 bg-primary px-6 py-4 text-primary-foreground">
              <activeTheme.icon className="h-5 w-5" aria-hidden="true" />
              <span className="font-display font-bold">{activeTheme.label}</span>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                {sender.trim() ? `${sender.trim()} sent you a little luck` : 'A little luck for you'}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-foreground">
                {recipient.trim() ? `Dear ${recipient.trim()},` : 'Dear friend,'}
              </h3>
              {message.trim() && (
                <p className="mt-3 rounded-2xl bg-secondary/50 p-4 text-sm italic leading-relaxed text-secondary-foreground">
                  &ldquo;{message.trim()}&rdquo;
                </p>
              )}

              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Clover className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Lucky Numbers
                  </span>
                </div>
                <div
                  className="flex flex-wrap gap-1.5"
                  aria-label={`Lucky numbers: ${preview.numbers.join(', ')}`}
                >
                  {preview.numbers.map((n) => (
                    <span
                      key={n}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
                    <Palette className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wide">Colour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full border border-border"
                      style={{ backgroundColor: preview.colour.hex }}
                      aria-hidden="true"
                    />
                    <span className="font-bold text-foreground">{preview.colour.name}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wide">Day</span>
                  </div>
                  <span className="font-bold text-foreground">{preview.day}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-accent/10 p-3 text-center text-sm font-semibold text-accent-foreground">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                {preview.message}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
