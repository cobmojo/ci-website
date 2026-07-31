'use client'

import { cn } from '@ci/ui'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { DialogCloseButton } from '@/components/navigation/dialog-close-button'
import { Link } from '@/components/navigation/link'
import { FOOTER_NAV, isActiveRoute, PRIMARY_NAV, WATCH_CTA } from '@/lib/navigation'

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
  const backdropPressRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const dialogId = useId()

  useEffect(() => setMounted(true), [])

  /**
   * Give focus back to the trigger, or to the main region if the trigger is
   * not there to take it.
   *
   * The trigger is `xl:hidden` and the sheet is not, so a viewport that grows
   * past `xl` while the sheet is open leaves a hidden trigger behind; focusing
   * it does nothing and the reader is dropped on `<body>`, at the top of the
   * document with no position. `main` carries `tabIndex={-1}` for the skip
   * link and is the same landing the skip link uses.
   */
  const restoreFocus = useCallback(() => {
    const trigger = triggerRef.current
    if (trigger?.offsetParent) {
      trigger.focus()
      return
    }
    document.getElementById('main-content')?.focus()
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
    setOpen(false)
    restoreFocus()
  }, [restoreFocus])

  // Close on route change, otherwise the sheet survives client navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reacting to pathname is the point
  useEffect(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
      setOpen(false)
    }
  }, [pathname])

  if (!mounted) return null

  const currentPath = pathname ?? '/'
  const watchActive = isActiveRoute(currentPath, WATCH_CTA.href)

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
        className="pressable inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong bg-paper-raised px-2 font-sans text-[0.88rem] font-medium text-navy hover:border-navy sm:px-3 xl:hidden"
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
        aria-labelledby={`${dialogId}-title`}
        onClose={() => {
          setOpen(false)
          restoreFocus()
        }}
        onPointerDown={event => {
          // A click whose press and release land on different elements is
          // retargeted to their common ancestor, so either half of a drag
          // between the sheet and the backdrop would otherwise read as a
          // backdrop click. Dismissal requires both ends on the backdrop.
          backdropPressRef.current = event.target === dialogRef.current
        }}
        onPointerUp={event => {
          if (event.target !== dialogRef.current) backdropPressRef.current = false
        }}
        onClick={event => {
          // Clicking the backdrop (the dialog element itself) closes the sheet.
          if (event.target === dialogRef.current && backdropPressRef.current) close()
        }}
        // `overlay-sheet` slides in from the right edge the sheet is anchored
        // to, and carries the backdrop wash on the panel's own clock. Under
        // reduced motion it crossfades in place instead.
        className="overlay-sheet m-0 ml-auto h-dvh max-h-none w-full max-w-[24rem] border-l border-border bg-paper p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2
              id={`${dialogId}-title`}
              className="m-0 font-sans text-[0.95rem] font-semibold text-navy"
            >
              Site navigation
            </h2>
            <DialogCloseButton label="Close navigation" onClick={close} />
          </div>

          <nav aria-label="Primary" className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-1">
              {PRIMARY_NAV.map(item => {
                const isActive = isActiveRoute(currentPath, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'block rounded-md px-3 py-2.5 font-sans text-[1rem] font-medium no-underline',
                        isActive ? 'bg-panel text-navy' : 'text-navy hover:bg-panel',
                      )}
                    >
                      {item.label}
                      {item.description ? (
                        <span className="mt-0.5 block text-[0.84rem] font-normal text-ink-subtle">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
              <li>
                <Link
                  href={WATCH_CTA.href}
                  aria-current={watchActive ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-2.5 font-sans text-[1rem] font-medium no-underline',
                    watchActive ? 'bg-panel text-copper-deep' : 'text-copper-deep hover:bg-panel',
                  )}
                >
                  {WATCH_CTA.label}
                  <span className="mt-0.5 block text-[0.84rem] font-normal text-ink-subtle">
                    {WATCH_CTA.description}
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
                  {/* No `aria-current` here. This secondary list repeats
                      routes the primary list above already owns (/case/,
                      /watch/, /start/...), and marking both would announce two
                      current pages in one navigation region. The footer, which
                      renders this same model, marks none either. */}
                  <ul className="space-y-0.5">
                    {group.links.map(link => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block rounded px-3 py-2.5 font-sans text-[0.92rem] text-ink-muted no-underline hover:bg-panel"
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
