import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { AdminLogin } from '@/components/admin-login'
import { AdminDashboard } from '@/components/admin-dashboard'
import { isAdmin } from '@/lib/admin'
import { getPendingStories, getSuggestions } from '@/app/actions/admin'

export const metadata: Metadata = {
  title: 'Admin — LuckyPickCanada.ca',
  robots: { index: false, follow: false },
}

// Always render fresh; moderation data must never be cached.
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const authed = await isAdmin()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} aria-hidden="true" />
            <span className="font-display text-lg font-bold text-primary">
              LuckyPick Admin
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
        {authed ? (
          <AdminDashboard
            pendingStories={await getPendingStories()}
            suggestions={await getSuggestions()}
          />
        ) : (
          <AdminLogin />
        )}
      </main>
    </div>
  )
}
