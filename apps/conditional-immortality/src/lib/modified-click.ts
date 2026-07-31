/**
 * Is this click a request for the browser's own link behaviour?
 *
 * A middle click, or a click with a platform modifier held, means "open this
 * somewhere else": a new tab, a new window, a download. Any handler that
 * intercepts a real link has to let those through, or the reader loses a
 * navigation the markup promised them.
 */
export function isModifiedClick(event: {
  readonly button?: number
  readonly metaKey: boolean
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
}): boolean {
  if (typeof event.button === 'number' && event.button !== 0) return true
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}
