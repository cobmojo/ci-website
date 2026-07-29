import Link from 'next/link'
import { formatLongDate } from '@/lib/format'
import { FOOTER_NAV } from '@/lib/navigation'
import { siteConfig } from '@/lib/site-config'

export function SiteFooter() {
  return (
    <footer className="site-footer mt-16 border-t border-border bg-panel/60">
      <div className="mx-auto max-w-[80rem] px-4 py-10 sm:px-6">
        <nav aria-label="Footer navigation">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER_NAV.map(group => (
              <li key={group.title}>
                <h2 className="mb-3 font-sans text-[0.82rem] font-semibold tracking-wider text-ink-subtle uppercase">
                  {group.title}
                </h2>
                <ul className="space-y-1.5">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="font-sans text-[0.92rem] text-ink-muted hover:text-navy"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 border-t border-border pt-6 font-sans text-[0.86rem] text-ink-subtle">
          <p className="m-0">
            {siteConfig.name}. A biblical case presented by {siteConfig.author.name}. Corrections
            and counterarguments are welcome through the{' '}
            <Link href="/corrections/">corrections form</Link>.
          </p>
          <p className="m-0 mt-2">
            Last substantively updated{' '}
            <time dateTime={siteConfig.lastSubstantivelyUpdated}>
              {formatLongDate(siteConfig.lastSubstantivelyUpdated)}
            </time>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
