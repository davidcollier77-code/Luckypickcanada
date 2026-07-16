import type { Metadata } from 'next'
import { AlertCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Disclaimer — LuckyPickCanada.ca',
  description:
    'LuckyPickCanada.ca is an entertainment website only. It is not affiliated with any lottery organization, and lucky numbers are randomly generated for fun.',
}

const POINTS = [
  'LuckyPickCanada.ca is an entertainment website only.',
  'LuckyPickCanada.ca is not affiliated with, connected to, or operated by any Canadian lottery organization or government lottery corporation.',
  'Lucky numbers are randomly generated for fun and personal entertainment purposes only. They do not predict winning numbers and do not improve chances of winning any lottery or contest.',
  'The LuckyPick reveal is a paid entertainment experience costing $1.00 CAD per pick. Payments are for fun only and are non-refundable.',
]

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <AlertCircle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              Disclaimer
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              Please read this important information about how LuckyPickCanada.ca works.
            </p>
          </div>

          <ul className="mt-10 space-y-4">
            {POINTS.map((p) => (
              <li
                key={p}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  !
                </span>
                <p className="text-base leading-relaxed text-foreground">{p}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            LuckyPickCanada.ca is designed to be a positive, family-friendly source of fun.
            If you or someone you know is affected by problem gambling, free, confidential
            help is available across Canada through your provincial support services.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
