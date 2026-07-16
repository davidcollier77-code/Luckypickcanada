import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Sparkles, Users, ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'About — LuckyPickCanada.ca',
  description:
    'LuckyPickCanada.ca was created around a simple idea: everybody could use a little luck. Learn about our positive, friendly, family-friendly mission.',
}

const VALUES = [
  {
    icon: Sparkles,
    title: 'Positive',
    desc: 'Every visit is designed to leave you feeling a little brighter.',
  },
  {
    icon: Heart,
    title: 'Friendly & family-friendly',
    desc: 'Wholesome fun that everyone can enjoy, no matter their age.',
  },
  {
    icon: Users,
    title: 'Proudly Canadian',
    desc: 'Made for Canadians, celebrating a little luck from coast to coast to coast.',
  },
  {
    icon: ShieldCheck,
    title: 'Just for fun',
    desc: 'Entertainment only — no gambling, no predictions, no pressure.',
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              About LuckyPickCanada.ca
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              LuckyPickCanada.ca was created around a simple idea:
            </p>
            <p className="mt-4 font-display text-2xl font-bold text-primary text-balance">
              &ldquo;Everybody could use a little luck.&rdquo;
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <p className="text-base leading-relaxed text-foreground">
              This website is designed to bring positivity, fun, and a small moment of
              excitement into people&apos;s day. Whether you are discovering your lucky
              numbers with your morning coffee, sending a cheerful gift to a friend, or
              sharing a feel-good story, our goal is the same: to make every visitor leave
              feeling like they received a little bit of luck.
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground">
              We are not a lottery, a gambling service, or a prediction tool. We are simply
              a friendly little corner of the internet built to spread good vibes across
              Canada.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <v.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3 font-display text-lg font-bold text-foreground">
                  {v.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/#luckypick"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Get My LuckyPick
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
