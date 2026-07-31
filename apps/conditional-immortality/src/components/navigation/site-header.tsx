import { buttonVariants, cn } from '@ci/ui'
import Link from 'next/link'
import { Wordmark } from '@/components/brand/wordmark'
import { MobileNavigation } from '@/components/navigation/mobile-navigation'
import { NavLinkItem } from '@/components/navigation/nav-link-item'
import { SearchDialogTrigger } from '@/components/search/search-dialog'
import { PRIMARY_NAV, WATCH_CTA } from '@/lib/navigation'
import { siteConfig } from '@/lib/site-config'

/**
 * Global header.
 *
 * Renders as plain, working markup with JavaScript disabled: the search
 * trigger degrades to a link to `/search/`, and the mobile menu button is
 * simply not rendered, leaving the footer, which carries the same
 * information architecture, as the navigation path.
 */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur-sm">
      <div className="site-header__inner mx-auto flex h-[var(--header-height)] max-w-[80rem] items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={`${siteConfig.name}, home`}
          // Allowed to shrink, so the wordmark wraps rather than pushing the
          // controls past the right edge at 320 CSS pixels.
          className="site-brand min-w-0 no-underline"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {PRIMARY_NAV.map(item => (
              <li key={item.href}>
                <NavLinkItem href={item.href}>{item.label}</NavLinkItem>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-2">
          <SearchDialogTrigger />
          <Link
            href={WATCH_CTA.href}
            // The shared copperSoft surface, kept at the header's compact text
            // size. The height floor comes from the variant, so this control
            // matches the 44px targets beside it.
            className={cn(
              buttonVariants({ variant: 'copperSoft' }),
              'hidden px-3 text-[0.88rem] sm:inline-flex',
            )}
          >
            {WATCH_CTA.label}
          </Link>
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
