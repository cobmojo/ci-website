'use client'

import { cn } from '@ci/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { isActiveRoute } from '@/lib/navigation'

/**
 * Primary nav item that marks itself with `aria-current="page"` when the
 * current route sits inside its section.
 */
export function NavLinkItem({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  const pathname = usePathname() ?? '/'
  const isActive = isActiveRoute(pathname, href)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 items-center rounded-md px-2.5 font-sans text-[0.9rem] font-medium no-underline',
        isActive ? 'bg-panel text-navy' : 'text-ink-muted hover:bg-panel hover:text-navy',
        className,
      )}
    >
      {children}
    </Link>
  )
}
