# Routing brief

Binding rules for anyone adding a route to `apps/conditional-immortality`.

## Read first

- `src/lib/site-config.ts` — site identity, never hardcode the name or URL.
- `src/lib/navigation.ts` — `PRIMARY_NAV`, `FOOTER_NAV`, `STATIC_ROUTES`, `NOINDEX_ROUTES`.
- `src/lib/metadata.ts` — `pageMetadata`, `breadcrumbJsonLd`, `articleJsonLd`, `JsonLd`.
- `src/lib/format.ts` — `formatLongDate`, `formatTimestamp`, `isoDuration`, `readingTimeMinutes`.
- `src/components/article/article-chrome.tsx` — `Breadcrumbs`, `EvidenceRoleBadge`,
  `ReviewStatusBadge`, `OnThisPage`, `PreviousNextNavigation`, `FeedbackCta`.
- `src/components/article/section-page.tsx` — the reference implementation.
- `packages/ci-content/src/index.ts` — every content export.

## Non-negotiables

1. **One `<h1>` per page.** Heading levels never skip. Do not choose a level for its size.
2. **Breadcrumbs on every page except the homepage**, using the `Breadcrumbs` component.
3. **Server components by default.** Add `'use client'` only where interaction genuinely
   requires it, and keep those components small and leaf-level.
4. **Every page exports `metadata` or `generateMetadata`** built with `pageMetadata`, so it
   gets a unique title, unique description and a canonical URL.
5. **No em dashes** in any user-facing copy.
6. **No placeholder text**, no dead links, no disabled controls, no "coming soon".
7. **Nothing conveys meaning by colour alone.** Every status, role and comparison carries a
   text label.
8. **Never print the author's email or phone.** Feedback goes through `/corrections/`.
9. **Tables use real `<table>`** with `<caption>`, `<thead>` and `scope` on header cells.
   Wrap a wide table in `<ScrollRegion label="...">`, which is the one owner of the
   scrolling, the keyboard access and the accessible name. MDX tables get it
   automatically from `rehypeScrollableTables`.
10. **No horizontal page scrolling at 320 CSS pixels.** Test long words and URLs.
11. **Do not add a client-side data library** to a page that only renders static content.
12. Use `<Link>` from `next/link` for internal navigation, plain `<a>` with
    `rel="noopener noreferrer" target="_blank"` for external.

## Route conventions

- Every route ends with a trailing slash in links and in `pageMetadata({ route })`.
- Dynamic routes set `export const dynamicParams = false` and implement
  `generateStaticParams`, so the whole site is statically generated.
- `/full-case/` and `/search/` are `noindex, follow`: pass `noindex: true`.
- Content comes from `@ci/content`. Never re-declare a list of sections, passages or
  sources in a component; import the registry.

## Layout scale

- Page container: `mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10`.
- Reading measure for prose: `max-w-[var(--spacing-measure)]` (about 42rem).
- Index and landing pages may use the full container width.

## Design tokens

Use the semantic Tailwind colours only: `paper`, `paper-raised`, `panel`, `panel-strong`,
`ink`, `ink-muted`, `ink-subtle`, `navy`, `navy-deep`, `copper`, `copper-deep`, `border`,
`border-strong`, `ochre`, `ochre-soft`, `affirm`, `affirm-soft`, `deny`, `deny-soft`.
Never write a raw hex value. Fonts: `font-sans` for UI and headings, the body default
serif for prose.

Tone: calm, serious, editorial. No flames, no glow, no gradients, no giant hero, no
decorative animation, no dashboard chrome.

## Interactive controls

- Minimum target size 44px: `min-h-11`.
- Visible focus is supplied globally; do not remove outlines.
- Dialogs use the native `<dialog>` element, and must return focus to their trigger on
  close. See `src/components/navigation/mobile-navigation.tsx`.
- Anything JavaScript-only must degrade to a working link or a `<details>` disclosure.

## Motion

Read [the motion brief](motion-brief.md) before adding a transition or an animation.
In short:

- Hover, focus and colour feedback is supplied globally in the base layer. Add nothing.
- A button or a button-shaped link takes the `pressable` class and nothing else.
- A dialog takes `overlay-panel` (a centred panel) or `overlay-sheet` (an edge sheet),
  which carry the enter, the exit and the backdrop.
- Anything that only exists once scripting has run takes `mount-reveal`.
- Never a raw duration or curve: use the `--motion-*` and `--ease-*` tokens.
- Anything that moves goes inside `@media (prefers-reduced-motion: no-preference)`.
- Page content is never animated. No scroll-triggered reveals, no staggering.

`bun run test` fails on a violation.

## Print

Add `print:hidden` to navigation and interactive chrome. Core content and citations stay
visible. `src/app/globals.css` already handles the global print rules.
