/**
 * The close control shared by the site's two overlays.
 *
 * The search dialog and the navigation sheet previously carried two
 * byte-identical copies of this button; one component keeps the glyph, the
 * target size and the Tier 1/2 feedback from drifting apart again.
 */
export function DialogCloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable inline-flex min-h-11 min-w-11 items-center justify-center rounded-md font-sans text-ink-muted hover:bg-panel"
    >
      <span className="sr-only">{label}</span>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <path
          d="M4 4l10 10M14 4L4 14"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
