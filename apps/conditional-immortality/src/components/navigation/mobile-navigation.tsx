'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { FOOTER_NAV, PRIMARY_NAV } from '@/lib/navigation'

/**
 * Primary navigation for narrow viewports.
 *
 * Uses the native `<dialog>` element, so focus trapping, Escape-to-close and
 * inertness of the background are handled by the platform rather than by
 * hand-rolled key handling. Focus is explicitly returned to the trigger on
 * close, which `<dialog>` does not guarantee across engines.
 *
 * Without JavaScript the button is not rendered at all and the footer, which
 * carries the same information architecture, remains the navigation path.
 */
export function MobileNavigation() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const dialogId = useId()

  useEffect(() => setMounted(true), [])

  const close = useCallback(() => {
    dialogRef.current?.close()
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Close on route change, otherwise the sheet survives client navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reacting to pathname is the point
  useEffect(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
      setOpen(false)
    }
  }, [pathname])

  if (!mounted) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          dialogRef.current?.showModal()
          setOpen(true)
        }}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong bg-paper-raised px-2 font-sans text-[0.88rem] font-medium text-navy sm:px-3 xl:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
          <path
            d="M2 4.5h14M2 9h14M2 13.5h14"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {/* The word is dropped on the narrowest screens, where the header has
            no room for it, but never from the accessible name. */}
        <span className="sr-only sm:not-sr-only">Menu</span>
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-label="Site navigation"
        onClose={() => {
          setOpen(false)
          triggerRef.current?.focus()
        }}
        onClick={event => {
          // Clicking the backdrop (the dialog element itself) closes the sheet.
          if (event.target === dialogRef.current) close()
        }}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-[24rem] border-l border-border bg-paper p-0 backdrop:bg-ink/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="m-0 font-sans text-[0.95rem] font-semibold text-navy">Navigation</h2>
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md font-sans text-[0.88rem] text-ink-muted hover:bg-panel"
            >
              <span className="sr-only">Close navigation</span>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav aria-label="Primary" className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-1">
              {PRIMARY_NAV.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2.5 font-sans text-[1rem] font-medium text-navy no-underline hover:bg-panel"
                  >
                    {item.label}
                    {item.description ? (
                      <span className="mt-0.5 block text-[0.84rem] font-normal text-ink-subtle">
                        {item.description}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/watch/"
                  className="block rounded-md px-3 py-2.5 font-sans text-[1rem] font-medium text-copper-deep no-underline hover:bg-panel"
                >
                  Watch the Overview
                  <span className="mt-0.5 block text-[0.84rem] font-normal text-ink-subtle">
                    28 minutes, with chapters and a full transcript
                  </span>
                </Link>
              </li>
            </ul>

            <div className="mt-6 space-y-5 border-t border-border pt-5">
              {FOOTER_NAV.map(group => (
                <div key={group.title}>
                  <h3 className="mb-1.5 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
                    {group.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {group.links.map(link => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block rounded px-3 py-2 font-sans text-[0.92rem] text-ink-muted no-underline hover:bg-panel"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </dialog>
    </>
  )
}
