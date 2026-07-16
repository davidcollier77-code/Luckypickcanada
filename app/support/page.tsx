import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TipJar } from '@/components/tip-jar'

export const metadata: Metadata = {
  title: 'Support the Site — LuckyPickCanada.ca',
  description:
    'Love a little luck? Chip in any amount to the Lucky Tip Jar to help keep LuckyPickCanada.ca friendly and running for everyone.',
}

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              Keep the Luck Flowing
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              LuckyPickCanada.ca is a feel-good little corner of the internet. Each LuckyPick is
              just $1, and if you would like to give a little extra to help cover the costs of
              keeping it online, you can leave a tip of any size below. There is never any pressure.
            </p>
          </div>
          <div className="mt-10">
            <TipJar />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
