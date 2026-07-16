import Link from 'next/link'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <Logo size={36} aria-hidden="true" />
              LuckyPickCanada.ca
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A fun, positive place where Canadians can discover a little bit of luck.
              Everybody could use a little luck.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol
              title="Explore"
              links={[
                { href: '/', label: 'Home' },
                { href: '/map', label: 'Canada Luck Map' },
                { href: '/send-luck', label: 'Send a Little Luck' },
              ]}
            />
            <FooterCol
              title="Community"
              links={[
                { href: '/stories', label: 'Did Luck Find You?' },
                { href: '/suggestions', label: 'Suggestions' },
                { href: '/about', label: 'About' },
              ]}
            />
            <FooterCol
              title="Info"
              links={[
                { href: '/support', label: 'Support the Site' },
                { href: '/disclaimer', label: 'Disclaimer' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/refunds', label: 'Refund Policy' },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Entertainment only.</strong>{' '}
          LuckyPickCanada.ca is not affiliated with, connected to, or operated by any
          Canadian lottery organization or government lottery corporation. Lucky numbers
          are randomly generated for fun and do not predict winning numbers or improve
          your chances of winning any lottery or contest.{' '}
          <Link href="/disclaimer" className="font-semibold text-primary underline">
            Read the full disclaimer
          </Link>
          .
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LuckyPickCanada.ca — Made with a little luck in
          Canada.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
