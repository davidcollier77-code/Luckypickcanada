import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SuggestionForm } from '@/components/suggestion-form'

export const metadata: Metadata = {
  title: 'LuckyPick Suggestions — LuckyPickCanada.ca',
  description:
    'Submit new ideas, website improvements, and feature requests to help shape the future of LuckyPickCanada.ca.',
}

export default function SuggestionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              LuckyPick Suggestions
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              Got a fun idea or something we could do better? We would love to hear it.
              Your suggestions help make the site a little luckier for everyone.
            </p>
          </div>
          <div className="mt-10">
            <SuggestionForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
