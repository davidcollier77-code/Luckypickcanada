import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Gift, MessageCircleHeart, Lightbulb, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { LuckyPick } from '@/components/lucky-pick'

const FEATURES = [
  {
    href: '/map',
    icon: MapPin,
    title: 'Canada Luck Map',
    desc: 'See where fellow Canadians are discovering their luck, province by province.',
  },
  {
    href: '/send-luck',
    icon: Gift,
    title: 'Send a Little Luck',
    desc: 'Surprise someone with a personalized digital luck gift for any occasion.',
  },
  {
    href: '/stories',
    icon: MessageCircleHeart,
    title: 'Did Luck Find You?',
    desc: 'Read and share feel-good lucky moments from across the country.',
  },
  {
    href: '/suggestions',
    icon: Lightbulb,
    title: 'LuckyPick Suggestions',
    desc: 'Have a fun idea? Drop it in our suggestion box and help shape the site.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                A little luck for every Canadian
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground text-balance sm:text-5xl md:text-6xl">
                Everybody Could Use a Little Luck
              </h1>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
                A fun place where Canadians can discover their personal lucky numbers,
                lucky colour, and lucky day. Just $1 a pick, friendly, and all for the joy of it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#luckypick"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-105"
                >
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Get My LuckyPick
                </Link>
                <Link
                  href="/send-luck"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-base font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <Gift className="h-5 w-5" aria-hidden="true" />
                  Send a Little Luck
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 -z-10 rounded-full bg-accent/10 blur-2xl" />
              <Image
                src="/images/lucky-hero.png"
                alt="A cheerful bouquet of four-leaf clovers, maple leaves, and a lucky horseshoe"
                width={1024}
                height={1024}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* LuckyPick experience */}
        <section id="luckypick" className="scroll-mt-20 bg-secondary/30 py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground text-balance sm:text-4xl">
                Discover your LuckyPick
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">
                Enter your first name and province, and we&apos;ll create a personalized
                lucky reveal just for you — your lucky numbers, a wearable lucky colour,
                your lucky day, and a little message to brighten your day.
              </p>
              <ul className="mt-6 space-y-3 text-foreground">
                {[
                  'Your choice of 6 or 7 lucky numbers',
                  'An everyday wearable lucky colour',
                  'Your lucky day of the week',
                  'A positive luck message',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <LuckyPick />
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground text-balance sm:text-4xl">
                More ways to enjoy a little luck
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">
                LuckyPickCanada.ca is all about bringing a small moment of positivity into
                your day — and sharing it with others.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* About teaser */}
        <section className="pb-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-3xl border border-border bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-balance sm:text-4xl">
                Built around one simple idea
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary-foreground/90 text-pretty">
                &ldquo;Everybody could use a little luck.&rdquo; We made this site to bring
                positivity, fun, and a small moment of excitement into your day.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-card px-6 py-3 text-base font-bold text-primary transition-transform hover:scale-105"
              >
                Learn more about us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
