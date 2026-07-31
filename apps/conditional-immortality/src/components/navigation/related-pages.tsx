import type { ReactNode } from 'react'

/**
 * The "Related pages" footer nav that closes most supporting pages.
 *
 * Eight routes render this identical block; owning the chrome here means the
 * divider, the type and the print behaviour cannot drift between them. Pages
 * supply their own `<li>` children, because which pages are related is the
 * one thing that legitimately differs.
 */
export function RelatedPages({ children }: { children: ReactNode }) {
  return (
    <nav
      aria-label="Related pages"
      className="mt-12 border-t border-border pt-6 font-sans text-[0.95rem] print:hidden"
    >
      <ul className="m-0 list-none space-y-2 p-0">{children}</ul>
    </nav>
  )
}
