'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Luck Map' },
  { href: '/send-luck', label: 'Send Luck' },
  { href: '/stories', label: 'Stories' },
  { href: '/suggestions', label: 'Suggestions' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-primary"
          onClick={() => setOpen(false)}
        >
          <Logo size={36} aria-hidden="true" />
          <span className="leading-none">
            LuckyPick<span className="text-accent">Canada</span>
            <span className="text-muted-foreground">.ca</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/#luckypick"
          className="hidden rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 md:inline-flex"
        >
          Get My LuckyPick
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-2 text-foreground md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-base font-semibold',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/#luckypick"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-primary px-3 py-2 text-center text-base font-bold text-primary-foreground"
            >
              Get My LuckyPick
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
