import type { Metadata } from 'next'
import { Quote } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { StoryForm } from '@/components/story-form'
import { getApprovedStories } from '@/app/actions/stories'

export const metadata: Metadata = {
  title: 'Did Luck Find You? — LuckyPickCanada.ca',
  description:
    'Read and share feel-good lucky moments and positive experiences from Canadians across the country. All submissions are reviewed before appearing publicly.',
}

export default async function StoriesPage() {
  const stories = await getApprovedStories()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground text-balance sm:text-5xl">
              Did Luck Find You?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              A wall of feel-good moments shared by Canadians. Read a few, then add your
              own lucky story to the mix.
            </p>
          </div>

          {stories.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((s) => (
                <figure
                  key={s.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6"
                >
                  <Quote className="h-6 w-6 text-accent" aria-hidden="true" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                    {s.message}
                  </blockquote>
                  <figcaption className="mt-4 text-sm font-semibold text-muted-foreground">
                    {s.name}
                    {s.province ? ` \u00b7 ${s.province}` : ''}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No stories yet — be the first to share a lucky moment below!
            </div>
          )}

          <div className="mx-auto mt-12 max-w-2xl">
            <StoryForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
