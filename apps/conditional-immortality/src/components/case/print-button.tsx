'use client'

import { Button } from '@ci/ui'
import { useEffect, useState } from 'react'

/**
 * Print control for the case index.
 *
 * Printing is a browser capability, so the control only exists once scripting
 * has run. Without JavaScript nothing is rendered and no dead button is left
 * behind: the printable routes beside it are ordinary links.
 */
export function PrintButton({ label = 'Print this page' }: { label?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
      {label}
    </Button>
  )
}
