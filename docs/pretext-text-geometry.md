# Pretext and text geometry

How this site uses a JavaScript text-layout engine, where it deliberately does
not, and what has to keep being true for that to stay safe.

## The decision

[Pretext](https://github.com/chenglou/pretext) predicts where a browser will
break a line, using canvas text measurement, without touching the DOM. This site
uses it in exactly two places:

1. **Fitting quick-search excerpts.** The search dialog chooses an excerpt
   window that lands exactly on a two- or three-line budget, so a result list
   has even rows and no ragged half-line.
2. **A CI text-geometry contract.** A browser suite that compares Pretext's
   prediction against real browser layout, in the site's own fonts, at the
   site's own widths, on the site's own content.

The governing rule, which nothing below is allowed to bend:

> Pretext predicts geometry. React renders semantic HTML. CSS owns typography.
> The browser owns accessibility, selection, printing, normal document flow and
> progressive enhancement.

**Why the use is narrow.** Every prediction is a claim about a browser that
Pretext is not. That claim is worth making where being wrong costs a word of
context, and not worth making where being wrong costs a reader the argument. The
quick-search dialog is the first case. Article prose is the second.

**Why semantic DOM stays authoritative.** A fitted excerpt is a *shorter string*
handed to the same React components that render every other excerpt. It is
ordinary text: selectable, copyable, findable with the browser's own find, read
by assistive technology as the words it is, and printed by the browser's own
layout. Nothing is drawn to a canvas. If every line of Pretext were deleted, the
site would render the same excerpts, one line less tidily.

**Why the quick-search dialog is the right runtime use.** It is already the
site's only client-side search surface. It already loads an index lazily on
intent. It already degrades to a server-rendered page. Adding an optional
refinement inside that boundary adds no new failure mode that was not already
handled.

**Why not long-form prose.** `/full-case/`, the case sections and the transcript
are server-rendered with no client JavaScript. Measuring them would mean
shipping a layout engine to every article page to improve nothing a reader
notices.

**Why no virtualization.** The dialog returns twelve rows and the search page
paginates at twenty. There is no list long enough for virtualization to help,
and a virtualized list is a new source of scroll, focus and screen-reader bugs.
TanStack Virtual was considered and rejected on those grounds.

## Runtime data flow

```
reader types
   │
   ├─ @ci/search ranks every document           ← unchanged by this work
   │
   ├─ for the twelve returned rows only:
   │     normalise → map matches back to exact source ranges
   │     build the fallback excerpt (with ellipses)   ← always
   │     build the excerpt candidate (no ellipses)    ← opt-in
   │
   ├─ React renders the fallback excerpt                  ← first paint, always
   │
   └─ the coordinator, once for the whole list:
         is the text eligible?           → no: keep the fallback
         load the runtime chunk          → failed: keep the fallback
         load the Source Serif face      → failed: keep the fallback
         does the engine agree with this browser?  → no: keep the fallback
         fit each candidate to the line budget
         apply the fitted excerpts together, as a transition
```

Each arrow that says "keep the fallback" is a real, tested path. None of them
shows the reader an error, because none of them is one.

### Search ranking is untouched

The ranker's weights, phrase bonus, synonym factor, Scripture handling, filters,
sort order and exact-title and section-id boosts are exactly as they were.
`packages/ci-search/src/__tests__/ranking-baseline.json` is a snapshot of what
thirty real queries returned against the real content index before any of this
work started — totals, order, scores to six decimal places, matched fields and
matched terms. The suite replays it on every run.

### Source-range mapping

Search normalises text (lowercase, NFKD, quote and dash folding, whitespace
collapsing, trimming) and then has to show the reader the *original*. An index
into one is not an index into the other: NFKD turns `ﬁ` into two characters,
lowercasing `İ` into two, whitespace collapsing three into one.

`normalize-with-source-map.ts` returns both the normalised string and a chunk map
back to exact source ranges, with every returned boundary on a grapheme cluster
boundary. `matches.ts` is the only place the two spaces meet. Highlight segments
concatenate to exactly the original string; no surrogate pair, combining
sequence or emoji sequence can be cut.

The one context-sensitive rule in language-independent lowercasing — Greek final
sigma — is implemented explicitly, so the mapped normaliser and the plain
whole-string one agree character for character. The suite checks that across a
Unicode sample and across every field of every indexed document.

### The excerpt candidate

`includeExcerptCandidate: true` is opt-in. The quick dialog asks for it; the
server-rendered `/search/` page does not, and pays nothing. Candidates are built
only for rows that are actually returned, and only from a bounded region of the
quoted field — the whole field can be fifteen thousand characters and the
candidate is at most six hundred.

## The supported contract

| | |
|---|---|
| Pretext version | `@chenglou/pretext` **0.0.8**, pinned exactly |
| Measured font | Source Serif 4, self-hosted, Latin and Latin Extended subsets |
| Scripts | Latin and Latin Extended only, as covered by those subsets |
| White space | `white-space: normal` |
| Word break | `word-break: normal` |
| Overflow wrap | `normal` or `break-word` |
| Text wrap | ordinary wrapping; `pretty` and `balance` are refused |
| Letter spacing | numeric pixels; `normal` is read as exactly `0` |
| Line budget | 2 lines below a 26rem result column, 3 at or above it |
| Cache | an application-owned LRU of 256 prepared handles |
| Browsers | Chromium and WebKit satisfy the geometry contract and are allowed to fit; Firefox does not, and is refused at runtime (see below) |

The typography is stated outright in one CSS class, `.quick-search-excerpt`, and
read back from the rendered element at runtime. Nothing is assumed: if the
cascade, a container query or a user stylesheet changed any of it, the contract
is refused and the fallback stays. The site's global `text-wrap: pretty` on
paragraphs is explicitly overridden for that class alone, because Pretext does
not model pretty wrapping. Article typography is unchanged.

The 26rem container threshold is the width the dialog reaches at a 480px
viewport: `min(42rem, 100vw - 2rem)` less its 2rem of padding. Every phone width
the responsive suite covers falls below it; every tablet and desktop width falls
well above.

### The one-pixel safety margin

The fitter asks Pretext for a column one pixel narrower than it has.

Pretext sums separately measured segment advances; a browser lays a whole line
out at once. In Chromium the two agree to about five thousandths of a pixel —
but a line that ends within a hair of the limit can still be decided by that
difference. The two outcomes are not equally bad: predicting one line too many
costs a word of context, while predicting one too few produces an excerpt taller
than the block reserved for it. The margin makes every prediction land on the
safe side.

## Unsupported input, and what happens to it

`supported-text.ts` is a pure, exhaustively unit-tested gate. It declines, in a
fixed order, with a recorded reason:

- Greek, Hebrew, Arabic, Cyrillic, CJK, Hiragana, Katakana, Hangul, Devanagari
  and anything else outside the self-hosted subsets — including combining marks
  the subsets do not carry, which is all of them except U+0304, U+0308 and
  U+0329
- Emoji and extended pictographs, and zero-width-joiner sequences
- Variation selectors
- Zero-width spaces, joiners, non-joiners and the word joiner — Pretext issue
  [#210](https://github.com/chenglou/pretext/issues/210) reports a leading ZWSP
  being consumed at line start
- Bidirectional control characters and isolates
- Soft hyphens, until specifically validated: a chosen soft-hyphen break
  materialises as a visible trailing `-`, so the fitted text would stop being a
  slice of the source
- Hard line breaks and tabs
- Repeated symbol runs — Pretext issue
  [#206](https://github.com/chenglou/pretext/issues/206) reports these breaking
  differently from browsers
- Unbroken tokens over thirty characters, which would need emergency word
  breaking

Ordinary English punctuation is *not* declined: curly quotation marks and
apostrophes, en and em dashes, the mathematical minus sign, Scripture
references, Latin transliterations such as `aionios`, accented Latin and long
theological words are all eligible, and all covered by tests.

Anything declined renders as the ordinary excerpt, with real `<mark>` elements
and normal browser line breaking. Greek and Hebrew keep their `lang` and `dir`
metadata and are laid out by the browser, exactly as before.

## Firefox: why fitting is refused there

Pretext 0.0.8 measures through an `OffscreenCanvas` when one exists. In Firefox,
an `OffscreenCanvas` does not resolve the document's `@font-face` rules, so it
measures web-font text in a substituted font. Measured on this site's own
typography:

| Engine | DOM canvas | OffscreenCanvas | DOM layout |
|---|---|---|---|
| Chromium | 503.85px | 503.85px | 503.86px |
| Firefox | 503.52px | **472.67px** | 504.02px |
| WebKit | — | — | agrees to 0.01px |

Every input check passes in Firefox — the face is loaded, the contract is
readable, the text is eligible — and only the *answer* is wrong, by about six
per cent. So there is a last gate that checks the answer:
`verify-engine.ts` measures a probe string in the real DOM and brackets the
engine's idea of its width against it. An engine that is out by more than two
pixels does not get to fit anything, and the reader keeps the ordinary excerpt.

This is why that check exists at all, and why it brackets a *width* rather than
comparing line counts: two different fonts frequently wrap the same number of
times, and a line-count comparison lets the disagreement through.

The consequence is that Firefox readers get the ordinary excerpt. It is correct,
highlighted and complete; it is simply not fitted to the line budget. When
Pretext stops preferring `OffscreenCanvas`, or Firefox starts resolving
`@font-face` on one, the self-check will notice and fitting will begin working
there with no code change.

## Content Security Policy

`upgrade-insecure-requests` is now emitted only when `NEXT_PUBLIC_SITE_URL` is
an HTTPS origin.

On an HTTPS deployment the directive is unchanged and does exactly what it did
before. On a plain-HTTP origin there is nothing to upgrade *to*, and the
directive is not harmless: Chromium and Firefox exempt loopback from it, WebKit
does not. Against the local production server the browser suites run, WebKit was
upgrading the site's own scripts and fonts to a port with no TLS and failing
every one of them — no JavaScript, no fonts, no dialog. The site was untestable
in WebKit and nobody knew, because the suite only ran Chromium.

## Testing

| Suite | Command | What it covers |
|---|---|---|
| Unit, `@ci/search` | `bun run test` | normalisation, source mapping, highlighting, excerpts, candidates, the ranking snapshot |
| Unit, application | `bun run test` | eligibility, the font contract, cursor mapping, the fit algorithm, the LRU cache |
| Component | `bun run test` | fallback first, failure paths, one observer, stale results, no announcements |
| End-to-end | `bun run test:e2e` | quick search, responsive fitting, failure paths, no-JavaScript, the bundle boundary, selection |
| Accessibility | `bun run test:a11y` | axe over fifteen routes plus the open dialog |
| Text geometry | `bun run test:text-geometry` | Chromium, Firefox and WebKit against real fonts and content |
| Everything in a browser | `bun run test:browser` | all five of the above browser suites |

`bun run validate` is the non-browser gate. `bun run ci` runs `validate` and then
`test:browser`, which is the complete gate including accessibility and all three
geometry projects.

The geometry suite is **not** a visual regression suite. It captures no
screenshots and says nothing about colour, spacing or appearance. It answers one
question — does Pretext agree with the browser about how many lines this text
occupies at this width — for a corpus built from the site's own interface
labels, permanent section identifiers, Scripture references, real titles and
excerpts pulled from the shipped search index, and explicit Unicode regression
strings.

Where an engine cannot be trusted, the same suite asserts the other half of the
contract: that production declines to enhance, and that the reader still gets a
complete, highlighted, navigable result list.

What each engine's verdict rests on, precisely. Measured against the production
build, searching `unquenchable fire` in a 1280px window:

| Engine | Geometry contract | Rows fitted | Line budget | Excerpt block | Every row marked |
|---|---|---|---|---|---|
| Chromium | passes | 12 of 12 | 3 | 59px | yes |
| WebKit | passes | 12 of 12 | 3 | 59px | yes |
| Firefox | refused | 0 of 12 | 3 | 59px | yes |

The block is the same height in all three. That is the whole point of reserving
it: a Firefox reader and a Chromium reader get rows in the same places, and the
only difference is whether the last line of an excerpt happens to end tidily.

The end-to-end suite additionally asserts real fitted excerpts in the running
dialog at 320, 375, 768 and 1280 pixels — a marked match, inside the line
budget, in a block whose height does not move — in Chromium, which is where the
`chromium-desktop` and `chromium-mobile` projects run. The Firefox refusal is
asserted by the geometry suite, which checks that the live dialog stays on
fallback excerpts there.

### The harness is not shipped

The browser harness lives under `tests/fixtures/`, is bundled for the browser by
Playwright's `globalSetup` into the operating system's temporary directory, and
is injected with `addScriptTag`. Nothing test-only reaches `public/`, a route or
the production bundle. There is no diagnostic page.

### The bundle boundary

`pretext-runtime.ts` is the only module that imports Pretext, and it is reached
only through a dynamic `import()`. The end-to-end suite finds the built chunk by
searching the production output for a stable marker rather than guessing a
hashed filename, then asserts that an article page never requests it, that
search intent does, and that blocking it leaves search working.

### Real Safari

`geometry-webkit` is Playwright's WebKit build. It is not Safari and is not
described as Safari anywhere in this repository or its output.

Real Safari is validated by hand, on a Mac, before any Pretext upgrade and at
least once per release cycle:

1. `bun run build && bun run start` in `apps/conditional-immortality`.
2. Open `http://localhost:3210/` in Safari and open the search dialog.
3. Search for `unquenchable fire`.
4. In the Web Inspector, confirm the excerpt elements carry
   `data-pretext-state="fitted"`. If they carry `fallback`, the runtime
   self-check refused Safari; record the reason and stop.
5. Confirm each fitted excerpt contains a `<mark>`, occupies no more than its
   `--search-excerpt-lines` budget, and does not overflow its block.
6. Repeat at a 375px window and at full width.
7. Record the Safari version and the result in the pull request.

No result from `geometry-webkit` may be reported as a Safari result.

## Upgrading Pretext

Never from `main`, never from a commit, never from a tag that is not a published
release.

1. Read the official changelog and the open issues, in particular anything
   touching `OffscreenCanvas`, font resolution, letter spacing, symbol runs or
   zero-width characters.
2. Pin the new version exactly in
   `apps/conditional-immortality/package.json` — no caret, no tilde.
3. `bun install` and confirm the lockfile change is only that dependency.
4. `bun run test` — all unit and component suites.
5. `bun run test:text-geometry` — Chromium, Firefox and WebKit. If an engine
   changes regime, that is the headline of the pull request, and this document
   must be updated to match.
6. `bun run test:e2e` — the complete search suite.
7. Confirm the bundle boundary tests still pass; a new export shape can move the
   chunk split.
8. Validate real Safari by the procedure above.
9. Update the version in the table at the top of this document.

Widening the supported scripts is a font change first. Add the subset to
`globals.css`, add its range to `COVERED_RANGES` in `supported-text.ts`, add
cases to the approved half of the typography corpus, and only then expect the
geometry suite to have an opinion.
