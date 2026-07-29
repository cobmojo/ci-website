/**
 * Helpers for the generated downloads.
 *
 * The plain-text files are meant to be read in a terminal, a mail client or a
 * text editor with no reflow, so they are hard wrapped. The standalone HTML
 * handout is assembled as a string rather than rendered by React, so it needs
 * its own escaping.
 */

export const TEXT_WIDTH = 78

/** Greedy hard wrap. Words longer than the width are left intact, not broken. */
export function wrapText(text: string, width = TEXT_WIDTH, indent = ''): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines: string[] = []
  let line = indent
  for (const word of words) {
    if (line.trim().length === 0) {
      line = indent + word
      continue
    }
    if (line.length + 1 + word.length > width) {
      lines.push(line)
      line = indent + word
      continue
    }
    line = `${line} ${word}`
  }
  if (line.trim().length > 0) lines.push(line)
  return lines
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
