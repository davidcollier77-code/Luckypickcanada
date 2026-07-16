import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { LuckMap } from '@/components/luck-map'
import { getTallies } from '@/app/actions/map'
import { provinceName } from '@/lib/provinces'

export const metadata: Metadata = {
  title: 'Canada Luck Map — LuckyPickCanada.ca',
  description:
    'See where fellow Canadians are discovering their luck, province by province. General province totals only — no exact locations or personal information.',
}

export default async function MapPage() {
  // Fetch live tallies (keyed by province code) and convert to the
  // province-name keys the map geography and ranking use.
  const tallies = await getTallies()
  const initialCounts: Record<string, number> = {}
  for (const [code, count] of Object.entries(tallies)) {
    initialCounts[provinceName(code)] = count
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              Canada Luck Map
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              A community view of where Canadians are finding a little luck. Explore the
              map, then add your own province to the fun.
            </p>
          </div>
          <div className="mt-10">
            <LuckMap initialCounts={initialCounts} />
          </div>
          <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
            <strong className="text-foreground">Privacy first:</strong> the map only shows
            general province information. No exact locations or personal details are ever
            displayed or stored.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
