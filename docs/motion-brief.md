# Motion brief

Binding rules for animation on this site. Read this before adding any
transition, keyframe animation or scroll behaviour.

The short version: **motion here serves comprehension, never decoration.** This
is a 129-page, 54,000-word reference site. The reader came for the text. Every
animation on the site has to justify itself by making something easier to
understand, and nothing may delay reading by a single frame.

## The audit this replaces

Before this brief, the site had four pieces of motion in total.

| Where | What | Verdict |
|---|---|---|
| `globals.css` `.skip-link` | `transition: top 0.15s ease-in-out` | Wrong property (`top` triggers layout), wrong easing (an element entering the screen takes `ease-out`) |
| `packages/ui/src/button.tsx` | `transition-colors` | Right instinct, untokenised, and the only surface on the site that had it |
| `mdx-content.tsx` heading anchor | `opacity-0 … group-hover:opacity-100 transition-opacity` | Hover-only reveal, so on a touch device the anchor was permanently invisible |
| `globals.css` reduced-motion block | `animation-duration: 0.001ms !important` on `*` | Blanket kill. Removes meaning along with movement, and `!important` on `*` is unoverridable |

Against that, roughly forty `hover:` states across the site had **no transition
at all**: every card, every navigation item, every call to action built from raw
utility classes rather than the shared `Button`. Two controls with identical
appearance behaved differently depending on which one you happened to touch.
That inconsistency, not the absence of animation, was the real defect.

Also absent: any enter or exit for the two `<dialog>` overlays (site search and
the mobile navigation sheet), any transition on the `<details>` disclosures, any
press feedback anywhere, and any smooth scrolling for in-page anchors — on a
site whose every article page carries an "On this page" list that jumps the
reader thousands of words down the document.

## The five tiers

Every animation on the site belongs to exactly one tier. If a proposed
animation fits none of them, it does not ship.

### Tier 0 — Never animated

Prose. Headings. Tables. Scripture blocks. Badges. Article metadata. Search
results. Filter status lines. Page content of any kind.

No entrance animations, no scroll-triggered reveals, no staggering, no parallax,
no counters, no decorative loops. A paragraph that fades in as you scroll is a
paragraph you cannot read yet.

Search results and filter counters are named explicitly because they are the
tempting cases: both change on every keystroke, so animating them would fire
dozens of times per interaction. The frequency principle rules them out.

### Tier 1 — Feedback · 130ms · `ease`

The response to a pointer or a key landing on something interactive: colour,
background, border, underline thickness, opacity.

Applied in `@layer base` to `a`, `button`, `summary`, `select`, `input`,
`textarea` and `[role="button"]`, so it reaches all 129 pages without a single
markup change and cannot be forgotten on a new one. This is what makes the site
uniform: there is one definition of how an interactive surface responds.

`ease` rather than a stronger curve, per the easing blueprint: gentle
asymmetric curves suit hover and colour changes.

### Tier 2 — Press · 100ms · `--ease-out-quad`

`scale(0.97)` on `:active`, for genuine buttons and button-shaped calls to
action only. Opt in with the `pressable` class.

Never on a prose link — a word that shrinks inside a sentence is grotesque —
and never on a card. A 300px card scaling by three per cent reads as a glitch,
so cards get Tier 1 only.

### Tier 3 — Overlay and disclosure · 150–200ms · `--ease-out-quad`

Enter and exit for things that appear over or inside the page:

- **Search dialog.** Fades and drops 8px from the top with a 0.98 → 1 scale,
  origin at the top. 200ms in, 150ms out.
- **Mobile navigation sheet.** Slides in from the right edge it is anchored to,
  on the same shared tokens: 200ms in, 150ms out.
- **Backdrops.** Same duration and easing as the panel they belong to. Paired
  elements move as a unit or they do not look like a unit.
- **Status messages.** The correction form's success, error and sending states.
- **Post-hydration UI.** Controls that cannot exist until scripting has run —
  the reading progress panel, the two index filters, the print button — fade in
  over 180ms instead of popping.

Exits are faster than entrances throughout, and every duration is under 300ms.

### Tier 4 — Orientation · smooth anchor scrolling

In-page anchor navigation only.

This is the one piece of motion on the site that earns its place by aiding
comprehension rather than by softening an edge. Jumping from an "On this page"
link to a heading four thousand words down a document, with no transition,
destroys the reader's sense of where they are. `scroll-padding-top` already
clears the sticky header.

It is **not** `scroll-behavior: smooth` in the stylesheet. That rule also
captures the App Router's scroll-to-top on client navigation, and measured in
Chromium 148 the scroll position then survives a route change untouched:
following "Next section" from two thousand pixels down an article landed two
thousand pixels down the next one. Verified by attribution — the same navigation
with the behaviour forced to `auto` returned to the top correctly.

So [`smooth-anchor-scroll.tsx`](../apps/conditional-immortality/src/components/navigation/smooth-anchor-scroll.tsx)
switches the behaviour on for the duration of one fragment navigation and hands
it back on `scrollend`, with a one-second timer for engines that do not fire it.
It never prevents the navigation, pushes a hash, or scrolls an element by hand,
which is what preserves the platform's focus semantics: the browser sets the
sequential focus navigation starting point at the target, so the next Tab press
continues from the heading the reader jumped to. Without scripting, anchors jump
instantly, exactly as before.

The reduced-motion preference is read at the moment of the click, so this tier
needs no CSS variant and honours a preference changed mid-session.

## Reduced motion

Two variants ship for everything. The rule is **remove the movement, keep the
meaning.**

| Tier | Under `reduce` |
|---|---|
| 0 | Unchanged. There was nothing to remove. |
| 1 | **Kept.** Colour is not movement; it is how the state change is legible. |
| 2 | Removed. The scale is the whole animation. |
| 3 | Becomes a crossfade. Opacity survives, every transform goes. |
| 4 | Removed. |

The old blanket `0.001ms !important` rule is gone. It was wrong in three ways:
it removed meaning along with movement, `!important` on `*` cannot be
overridden by a component that needs to keep an opacity fade, and reducing a
duration to a thousandth of a millisecond is not the same as choosing a
gentler animation.

In its place, every animation is authored with its variant beside it: movement
lives inside `no-preference` blocks, and keyframe animations that translate have
a `reduce` counterpart that only fades.

Three test files hold the line, all in the fast suites:

- `src/lib/__tests__/motion-contract.test.ts` reads `globals.css` as source and
  fails if a movement transition escapes a `no-preference` block, if a duration
  or curve is not tokenised, if `transition: all` or `ease-in` appears, if
  `!important` shows up inside a reduced-motion query, or if any rule collapses
  `::details-content`.
- `src/components/navigation/__tests__/smooth-anchor-scroll.test.tsx` covers the
  Tier 4 scoping, including every case that must *not* smooth.
- `tests/e2e/motion.spec.ts` checks what a browser computes with the preference
  set both ways, and ends with a sweep over eight representative pages asserting
  that under `reduce` no rendered element animates a movement property.

## Performance

Only `transform`, `opacity` and colour are animated, with one exception:

- **`text-decoration-thickness`** on prose link hover. Paint-only, and the
  alternative is the underline jumping.

Nothing animates a size. Nothing triggers layout on a frame boundary. This is
stricter than the tiers strictly require, and it is the state the site ended up
in after the disclosure animation was withdrawn.

No `will-change` anywhere: nothing on the site animates continuously, and a
permanent compositing layer for a 130ms colour change is a worse trade than the
frame it saves.

## Deliberately excluded

Naming what was rejected matters as much as naming what shipped, because the
brief has to answer "why not add X" for the next person.

| Excluded | Why |
|---|---|
| `<details>` height animation | Built, measured, withdrawn. See below |
| Scroll-triggered reveals | Tier 0. Hides text behind a scroll position, and breaks with scripting disabled |
| Scroll-driven header shadow | Decorative, needs `animation-timeline` support, and the header already carries a border |
| Page transitions between routes | Would delay first paint of the text on every navigation |
| Animated search results | Fires on every keystroke |
| Animated filter counters | Same |
| Staggered list entrances | Tier 0, and the case index has 40 rows |
| View Transitions API | Cross-document transitions on a 129-page static site buy spatial continuity the reader does not need and cost a paint delay on every navigation |
| Springs, Framer Motion | The site ships no third-party script, and nothing here is interruptible or gesture-driven. CSS is sufficient and runs off the main thread |
| Custom disclosure markers | A design change dressed as an animation change |
| Loading spinners | Search index load and form submission both report state in words, which a screen reader can also read |

### The disclosure animation, and why it is not here

It was the strongest Tier 3 candidate on the site: two `<details>` disclosures
carry the narrow-screen case contents and supplementary notes, and opening one
halfway down an article teleports everything below it. It was built with the
canonical recipe — `block-size: 0` and `overflow: hidden` on
`::details-content`, `interpolate-size: allow-keywords` on the root, and a
discrete `content-visibility` step — and then measured in the browser.

On Chromium 148 it does not work. Opening the disclosure lays the content out
correctly, but `::details-content` stays at zero height and clips all of it, so
the disclosure appears open and is empty. The same failure reproduces with the
recipe in complete isolation on a synthetic element, with `content-visibility`
dropped from the transition list, and with an ID-specificity `block-size: auto`
on the open state. The only configuration that opens correctly is the one where
no rule targets `::details-content` at all.

The failure mode is hiding argument behind a disclosure that looks open. That is
not worth 200ms of polish on a site whose entire purpose is the argument, so the
disclosure snaps open as it always did, and print needs no pseudo-element
override because nothing collapses one. Two tests hold the line: the contract
test fails if any rule collapses `::details-content`, and an end-to-end test
opens the disclosure and asserts it actually grew.

If a later engine fixes this, reinstating it means restoring the print override
in the same commit.

## Adding motion later

1. Name the tier. If it is Tier 0, stop.
2. Use a token. Never a raw duration or a bare `cubic-bezier`.
3. Write the `reduce` variant in the same commit.
4. Confirm `bun run test` still passes — the motion contract test is in the unit
   suite, so a violation shows up in seconds rather than in a review.
5. If it is movement, it goes inside `@media (prefers-reduced-motion:
   no-preference)`. Not the other way round.
