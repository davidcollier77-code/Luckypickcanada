import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export type LegalSection = {
  heading: string
  paragraphs: string[]
}

export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            {intro}
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-display text-xl font-bold text-foreground">{s.heading}</h2>
                <div className="mt-2 space-y-3">
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="text-base leading-relaxed text-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            This page is provided for general information about how LuckyPickCanada.ca works
            and is not legal advice. Questions? Reach us at{' '}
            <a
              href="mailto:hello@luckypickcanada.ca"
              className="font-semibold text-primary underline underline-offset-2"
            >
              hello@luckypickcanada.ca
            </a>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
