import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GiftBuilder } from '@/components/gift-builder'

export const metadata: Metadata = {
  title: 'Send a Little Luck — LuckyPickCanada.ca',
  description:
    'Surprise someone with a personalized digital luck gift. Add their name, a message, and a shareable lucky reveal for any occasion.',
}

export default function SendLuckPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              Send a Little Luck
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              Brighten someone&apos;s day with a personalized digital luck gift — complete
              with their own lucky numbers, colour, day, and a heartfelt message.
            </p>
          </div>
          <div className="mt-10">
            <GiftBuilder />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
