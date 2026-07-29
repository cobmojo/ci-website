/**
 * Typographic wordmark.
 *
 * Deliberately not a flame, not an infinity symbol, and not an illustration.
 * The mark is a small open bracket suggesting a text under examination, drawn
 * as inline SVG so it costs no network request and scales with the type.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <svg
        width="22"
        height="26"
        viewBox="0 0 22 26"
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        <path
          d="M8.5 2.5H4.5a2 2 0 0 0-2 2v17a2 2 0 0 0 2 2h4"
          fill="none"
          stroke="var(--color-navy)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M13.5 2.5h4a2 2 0 0 1 2 2v17a2 2 0 0 1-2 2h-4"
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M11 8v10"
          fill="none"
          stroke="var(--color-copper)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      <span className="min-w-0 font-sans text-[0.94rem] leading-tight font-semibold tracking-tight text-navy">
        <span className="block sm:inline">The Case for</span>{' '}
        <span className="block sm:inline">Conditional Immortality</span>
      </span>
    </span>
  )
}
