# Performance and technical SEO

**Status: not certified.** Every indexable route reaches 100 on Accessibility,
Best Practices and SEO in both Lighthouse modes, and 100 on Performance in
desktop mode. Mobile Performance does not reach 100 on any route: it sits
between 83 and 92, and at 59–64 on `/full-case/`. That shortfall is measured,
diagnosed and attributed below, and Lighthouse's own insights report **zero
available savings** for First Contentful Paint or Largest Contentful Paint on
every route audited.

The most consequential thing found in this round was not a score. The prefetch
policy recorded below as site-wide was not site-wide: three files still reached
`next/link` directly, and the transcript on `/watch/` was speculatively
downloading **the page the reader was already on**, once per timestamp — 33
requests and 142 kB, measured. `/corrections/` was starting another 74 kB. Both
are now zero, and the guard that was supposed to prevent this has been extended
to the two routes it never covered. Details in
[Three links the policy never reached](#three-links-the-policy-never-reached).

The reason a mobile 100 is out of reach is now stated in bytes rather than in
adjectives. Under simulated
throttling on a local origin the whole page finishes loading before the observed
paint, so Lantern's LCP graph contains all of it and the simulated LCP is the
simulated fully-loaded time. A mobile Performance score of 100 on this page
requires the entire transfer to fit in about **306 kB**; the fonts and the
framework alone are **342 kB**. With every byte of this repository's own
JavaScript deleted, the score would still not be 100. The derivation, from the
engine's own scoring function and its own graph code, is under
[Why mobile 100 is out of reach, in bytes](#why-mobile-100-is-out-of-reach-in-bytes).

Nothing here was obtained by weakening a test, a throttle, a viewport or a
budget. The reduced-motion preference was `no-preference` for every
certification run, asserted rather than assumed.

## Scope

The whole site: 120 HTML routes across 13 template families, 21 redirect
aliases, 7 generated assets, 2 route handlers, and the two framework error
documents. Both Lighthouse modes. Local production builds throughout; there is
no deployed origin (see [External limitations](#external-limitations)).

- **Baseline commit** `20e0e0b`, the head of the production-readiness branch
  before this work, with the full-site SEO branch merged in at `e020539`. Every
  baseline number below was taken on `e020539`.
- **Whole-site sweep and every "after" number** were taken on `0d0d42d`, which
  is `e020539` plus the one production change described here.
- **Final commit** is the head of `claude/production-readiness-qa-launch-59185d`.
  Everything after `0d0d42d` is documentation, gate wiring, and the merge of
  `main` once PR #6 landed on it. That merge changed what is served — it brought
  in thirty-four commits of gap-sweep work — so the numbers above describe the
  tree they were taken on and were **not** re-measured afterwards. The one
  change with a plausible effect is `scrollbar-gutter: stable` on the root; the
  route inventory, the indexability matrix and the interaction latencies were
  all re-run on the final tree and are unchanged.

## The instrument

| | |
|---|---|
| Lighthouse | **13.4.1**, pinned exactly in the root `devDependencies` |
| Chrome | 150.0.7871.187, headless, launched by `chrome-launcher` 1.2.0 |
| Next.js | 16.2.12, production build, Turbopack |
| Bun / Node | 1.3.14 / 24.11.1 |
| Machine | 13th Gen Intel Core i9-13900H, 20 cores, Windows 11 |
| Throttling | Lighthouse defaults — simulated, mobile preset and desktop preset, unmodified |
| Storage | reset on every run, cold navigation |
| Motion | `prefers-reduced-motion: no-preference`, **asserted before the first audit** |
| Server | `next start`, on a port of its own, proved to be serving the build in `.next` |

`lighthouseVersion` is read out of every generated result rather than assumed
from the package version, and the version was not changed at any point during
the loop.

Three refusals are built into the harness, each because of a failure that has
already happened in this repository:

- it will not run against `next dev`;
- it will not run against a server whose served HTML does not contain the
  `BUILD_ID` on disk — this fired once during the work, catching an orphaned
  `next start` from a killed run that had been holding the benchmark port for
  two hours and would otherwise have produced numbers about a stale build;
- it will not certify under `prefers-reduced-motion: reduce`, because that
  would measure a site with motion Tiers 2, 3 and 4 removed.

### Commands

| Command | What it does |
|---|---|
| `bun run perf:routes` | Discovers the route inventory and reconciles the four sources |
| `bun run perf:smoke` | One cold audit of every family's worst route, both modes |
| `bun run perf:audit` | One cold audit of **every** HTML route, both modes, gated |
| `bun run perf:certify` | Five cold audits of every family's worst route, both modes, gated |
| `bun run perf:deployed` | The same, against `--base-url <origin>` |
| `bun run seo:matrix` | The indexability matrix, on the wire, gated |
| `bun run test:interaction` | Interaction latency, measured as INP is defined |

Reports are written to `reports/`, which is git-ignored. Nothing large is
committed.

## The route inventory

Discovered, not listed. `scripts/conditional-immortality/lib/route-manifest.ts`
reads the prerendered HTML in `.next/server/app`, the framework's own
`app-path-routes-manifest.json`, the redirect table in `routes-manifest.json`,
and `STATIC_ROUTES` / `NOINDEX_ROUTES` from `lib/navigation.ts`, then
reconciles them and exits non-zero on disagreement.

| Kind | Count |
|---|---|
| Indexable HTML | 118 |
| Deliberately non-indexable HTML | 2 (`/full-case/`, `/search/`) |
| Redirect sources | 21 |
| Generated assets | 7 (sitemap, robots, search index, three downloads, icon) |
| Route handlers | 2 (`/api/feedback`, `/og`) |
| Framework error documents | 2 |
| Sitemap `<loc>` entries | 118 |

`/search/` is the one page with no prerendered file: it reads `searchParams`
and is rendered on demand. That is correct, and it is why the route list cannot
be a directory listing — the single page whose cost includes a server render
would have been the single page missing from the sweep.

### Template families and the route each is certified on

The certification route is the heaviest member of its family by document size,
DOM size and link count together. Auditing a family's smallest page and calling
the family green is the evasion the rules forbid.

| Family | n | Certified on |
|---|---|---|
| appendix | 2 | `/appendix/net-outcome-of-humanity/` |
| article | 38 | `/case/key-texts/weeping-and-gnashing/` |
| changelog-entry | 12 | `/changelog/rb1/` |
| corrections | 1 | `/corrections/` |
| full-case | 1 | `/full-case/` |
| home | 1 | `/` |
| informational | 5 | `/method/` |
| listing | 9 | `/scripture/` |
| orientation | 4 | `/start/case-map/` |
| passage | 18 | `/passages/first-corinthians-15/` |
| search | 1 | `/search/` |
| topic | 27 | `/topics/eternal-conscious-torment/` |
| watch | 1 | `/watch/` |

Largest document `/full-case/` at 1.86 MB of HTML; largest after it
`/scripture/` at 561 kB. Most client JavaScript `/corrections/` at 683 kB
uncompressed first load; every other route shares a 605 kB baseline.

## Baseline

One cold audit per family representative, both modes, commit `e020539`.

| Route | Mode | P | A | BP | SEO | LCP | TBT | CLS | FCP | SI |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | **91** | 100 | 100 | 100 | 3459 | 49 | 0.001 | 985 | 985 |
| `/` | desktop | 100 | 100 | 100 | 100 | 689 | 0 | 0.000 | 271 | 271 |
| `/appendix/net-outcome-of-humanity/` | mobile | **83** | 100 | 100 | 100 | 4213 | 167 | 0.001 | 1663 | 1663 |
| `/case/key-texts/weeping-and-gnashing/` | mobile | **83** | 100 | 100 | 100 | 4212 | 162 | 0.001 | 1662 | 1662 |
| `/changelog/rb1/` | mobile | **92** | 100 | 100 | 100 | 3309 | 62 | 0.001 | 759 | 759 |
| `/corrections/` | mobile | **87** | 100 | 100 | 100 | 3610 | 212 | 0.001 | 910 | 910 |
| `/full-case/` | mobile | **59** | 100 | 100 | 66¹ | 5865 | 500 | 0.000 | 3315 | 3315 |
| `/full-case/` | desktop | **98** | 100 | 100 | 66¹ | 1093 | 82 | 0.000 | 679 | 699 |
| `/method/` | mobile | **90** | 100 | 100 | 100 | 3460 | 118 | 0.001 | 928 | 928 |
| `/passages/first-corinthians-15/` | mobile | **91** | 100 | 100 | 100 | 3459 | 46 | 0.001 | 955 | 955 |
| `/scripture/` | mobile | **89** | 100 | 100 | 100 | 3461 | 157 | 0.001 | 1008 | 1008 |
| `/search/` | mobile | **90** | 100 | 100 | 66¹ | 3610 | 53 | 0.001 | 910 | 910 |
| `/start/case-map/` | mobile | **91** | 100 | 100 | 100 | 3460 | 62 | 0.001 | 910 | 910 |
| `/topics/eternal-conscious-torment/` | mobile | **92** | 100 | 100 | 100 | 3310 | 69 | 0.001 | 761 | 761 |
| `/watch/` | mobile | **88** | 100 | 100 | 100 | 3608 | 172 | 0.001 | 1090 | 1090 |

¹ `/full-case/` and `/search/` are deliberately `noindex, follow`, which
correctly fails Lighthouse's crawlability audit. Their indexing behaviour is
verified directly instead; see [Technical SEO](#technical-seo).

Every desktop run scored 100 on Performance, Accessibility and Best Practices
except `/full-case/`, which scored 98 on Performance, and 100 on SEO except the
two deliberately non-indexable routes.

### What the baseline says

Two things stand out, and only one of them is what it looks like.

**Mobile LCP is a near-constant offset above FCP.** The gap is 2,450–2,700ms on
every route, whatever the page weighs. That is not page weight; it is a fixed
dependency in the simulation.

#### The simulation, read off its own source

The account below replaces an earlier, vaguer one. It was derived by reading
the Lantern metric code in the pinned engine
(`@paulirish/trace_engine/models/trace/lantern/metrics/`) rather than inferred
from the numbers, and it predicts them.

`LargestContentfulPaint.getOptimisticGraph` and `getPessimisticGraph` both call
`FirstContentfulPaint.getFirstPaintBasedGraph` with `cutoffTimestamp` set to the
**observed** LCP, and the optimistic filter is `isNotLowPriorityImageNode` —
which excludes only low-priority *images*. Every other request that finished
before the observed paint is in both graphs. The estimate is then
`Math.max(...nodeTimings.endTime)`: not the time to paint, but the time for that
whole set of requests to finish on the throttled link.

On this site, on a local origin, the observed LCP is 498ms and **every request
has finished by then** — nothing is left outside the cut. So the simulated LCP
is the simulated fully-loaded time, and the model is arithmetic:

> simulated LCP ≈ simulated TTFB + (bytes in the graph ÷ 204.8 kB/s) + CPU tail

Measured on `/`, mobile: TTFB 474ms, 411.8 kB in the graph → 2,010ms of
download, and a 476ms observed element-render delay against a 4× CPU
multiplier. That predicts ≈3,650ms. Lighthouse reported **3,647ms**.

The composition of those 411.8 kB is the finding:

| | wire bytes | share |
|---|---|---|
| Fonts (two latin faces, `High`) | 197,051 | 47.9% |
| Scripts (all twelve, `Low`) | 192,698 | 46.8% |
| Document | 19,416 | 4.7% |
| Stylesheet | 10,329 | 2.5% |
| Icon | 2,215 | 0.5% |

The LCP element is **text** — the lede paragraph, `section.border-b > … > p.m-0`
— and its breakdown is TTFB 22ms plus 476ms of element render delay, with no
resource load delay or duration at all. There is no image to discover sooner,
no font blocking the paint, and no render-blocking chain to shorten: the
longest network chain on the page is two links long, document → stylesheet.

**Observed and simulated disagree by an order of magnitude.** On the home page
the observed FCP and observed LCP are the *same paint*, at 245ms, and the
observed main-thread total is 1.0s: Style & Layout 380ms, Script Evaluation
311ms, other 145ms, Script Parse & Compile 61ms, Rendering 56ms. Lighthouse's
simulation then places FCP at 965ms and LCP at 3,464ms — and `interactive` at
3,464ms too, exactly equal to LCP.

That equality is the diagnosis. Because the benchmark origin is local and has
no latency, every script finishes downloading and executing *before* the
observed largest paint, so Lantern treats the whole script graph as a
dependency of LCP and re-times it on the throttled link. The simulated LCP is
therefore the simulated time-to-interactive.

Cross-checked with Lighthouse's *applied* throttling, which throttles the
network and the CPU during the trace instead of modelling it afterwards:

| Route | Throttling | P | FCP | LCP | TBT | SI |
|---|---|---|---|---|---|---|
| `/` | simulated | 91 | 981 | 3468 | 87 | 981 |
| `/` | applied | 78 | 2181 | **2181** | **745** | 2246 |
| `/case/key-texts/weeping-and-gnashing/` | simulated | 85 | 1668 | 4218 | 83 | 1668 |
| `/case/key-texts/weeping-and-gnashing/` | applied | 79 | 2295 | **2295** | **652** | 2336 |

Under applied throttling the LCP is *under* the 2,500ms ceiling and the Total
Blocking Time is 4–5× over its 150ms ceiling. The two configurations disagree
about which metric fails and agree about the cause: **main-thread work at
load**. Certification uses the simulated numbers, because those are the
standard; the applied numbers are recorded because they are what a reader on a
mid-tier phone actually experiences, and because they rule out the two
hypotheses below far more cheaply than a code change would.

## Optimisations kept

### Prefetching becomes opt-in — kept

**Cause.** `<Link>` prefetches a static route in full as soon as it enters the
viewport. Measured on the wire, uncompressed:

| Route | RSC payload |
|---|---|
| `/full-case/` | 975 kB |
| `/scripture/` | 303 kB |
| `/sources/` | 183 kB |
| `/case/` | 139 kB |
| `/watch/` | 129 kB |
| a long case section | ~110 kB |

A case section carries a header naming six of those routes, a footer naming
sixteen, a breadcrumb trail, a contents list and sixty-odd cross-references.
Opening one article started **2.26 MB across 95 requests** before the reader
pressed anything. The home page started **1.82 MB**, of which 959 kB was
`/full-case/`. `/scripture/` prefetched *itself*, from its own header.

**Change.** `components/navigation/link.tsx` wraps `next/link` with prefetching
off unless asked for. One exception, asked for explicitly: Previous and Next on
a case section, because sequential reading is the one navigation here that is
genuinely predictable. They sit at the foot of a four-thousand-word section, so
they prefetch when the reader reaches them rather than when the page loads.

> This paragraph used to end "all 42 imports in the application point at it."
> **That was false when it was written**, and it is corrected in
> [Three links the policy never reached](#three-links-the-policy-never-reached)
> below. Three files still imported `next/link` directly, and between them they
> were starting about 217 kB of speculative payload that this section claimed
> had been removed.

**Guard.** `tests/e2e/prefetch-budget.spec.ts` — a budget per route family on
the wire, plus an assertion that the one permitted prefetch really does happen
once it scrolls into view. Proven red at 1.82 MB, green at zero.

**Measured effect.** Speculative payload per page load: **1.82 MB → 0** on the
home page, **2.26 MB → 0** on an article. Lighthouse mobile LCP: **3,459 → 3,463
ms** on the home page over five cold runs — *unchanged*. `/full-case/` improved
from LCP 5,865 → 5,569ms and TBT 500 → 338ms, which is inside its own run-to-run
spread and is not claimed as a result.

**Kept on the third decision rule, not the first.** It deterministically
removes 1.8–2.3 MB of production network traffic per page view with no measured
or experiential regression. It is **not** the LCP fix, and it is not reported as
one. Lantern models request priority, and route prefetches are `Low`, so they
never competed with the resources the paint waits on.

### The search engine leaves the shared chunk — kept

**Cause.** `SearchDialogTrigger` is rendered by the root layout, so whatever it
imports is in the chunk all 119 routes load. It statically imported `search`
from `@ci/search`, which reaches the query parser, the excerpt builder, the
matcher, the synonym table and — through `parseReference` — the entire
book-and-alias table and verse-count table of `@ci/content-schema/bible`. Its
result list reached the label tables, the excerpt fitter and the text-layout
contract on top of that. Measured in the built chunk: **42.7 kB of a 51.2 kB
layout chunk**, on every page, for one control in the header.

None of it can do anything until the 610 kB search index has arrived, and that
index was *already* fetched lazily on search intent. The code was eager; the
data it needs was not.

**Change.** `lib/search-engine-client.ts` loads `search` through a cached
dynamic import, and the result list is a `lazy` component whose import is also
started from `prewarm`. Both ride the trigger that already existed —
`pointerenter` and `focus` on the trigger, and `openDialog` itself. The engine
is awaited *beside* the index inside `loadIndex` rather than after it, so
`loading` and `failed` still describe the whole of "search is not usable yet"
and every state the pane can show still turns on `index` alone. No new render
state was introduced and no message changed.

**Guard.** `ABSOLUTE_CEILING_BYTES` in `bundle-budget.ts` lowered 700,000 →
666,000, keeping the 15.4 kB of headroom over the heaviest route that the
ceiling was originally given. The win cannot now be handed back silently.

**Measured effect.** First-load JavaScript, uncompressed, from the build's own
`route-bundle-stats.json`: median **606,381 → 572,901 bytes**, a reduction of
**33,480 bytes on every one of the 30 route groups** — the largest and smallest
per-route deltas are both exactly −33,480, which is what a shared-chunk change
should look like. On the wire, gzipped, the home page's JavaScript falls
**180,850 → 168,470 bytes** and its total transfer **409,411 → 396,968**.

**Kept on the third decision rule.** It deterministically removes 33.5 kB of
parse-and-compile and 12.4 kB of transfer from every page view with no measured
or experiential regression. Its predicted effect on simulated LCP is ~60ms
against a 3,647ms number, which is inside the run-to-run spread, and it is
**not** claimed as an LCP fix.

**No behavioural change.** Search still opens instantly — the dialog shell, its
focus handling, Escape, the backdrop and `Ctrl+K` were never part of the
deferred code. The 14-test interaction suite re-measured every search
interaction and all remain far under the 200ms target; the fallback for
scripting-disabled readers is still the same real `<a href="/search/">`; nothing
is fetched before a reader shows an interest in searching, so the privacy
contract is untouched.

### Three links the policy never reached — kept

**Cause.** The prefetch policy above was enforced by a wrapper, and a wrapper
only governs the files that import it. Three did not:

| File | What it links to |
|---|---|
| `components/navigation/focus-on-arrival-link.tsx` | the transcript's 39 timestamps, and search paging |
| `app/corrections/page.tsx` | `/changelog/`, `/method/`, `/accessibility/`, `/privacy/` |
| `components/feedback/feedback-form.tsx` | the success state's one link |

The transcript case is the sharper one. Every timestamp is a query-only link
back to `/watch/`, and the App Router keys its prefetch cache on
`{pathname, search}` — so each distinct `?t=` is a distinct target, and the page
speculatively downloaded **itself**, once per timestamp. Measured on the wire,
scrolling through the transcript: **33 requests, 142,487 bytes**, the first of
them a full copy of a document the reader was already holding. `/corrections/`
started **5 requests, 74,267 bytes** on load, the largest a 54,732-byte copy of
`/changelog/`.

None of it could ever be useful: on `/watch/` the destination is the current
page, and on `/corrections/` it is four pages a reader of a correction form is
unlikely to want.

**Change.** All three now import the repository's own `Link`. Nothing else about
them moved.

**Why removing it costs the reader nothing, measured rather than argued.** The
click path was A/B'd on `/watch/` by aborting only requests carrying
`next-router-prefetch`, leaving real navigation fetches alive. As shipped, the
router committed the URL at 46ms; with prefetching suppressed, 77ms; with
prefetching suppressed *and* the navigation payload delayed a full two seconds,
2,094ms. In all three the immediate state was identical — focus on
`video-player`, the element in the viewport, and the player's `src` already
carrying `&start=107`. Nothing a reader sees or hears waits on the router
commit, because `focus-on-arrival-link.tsx` moves focus and the video facade
seeks synchronously on the click. Prefetching was buying a faster commit of
something invisible.

**Guard.** `tests/e2e/prefetch-budget.spec.ts` gained `/watch/` and
`/corrections/` — neither was in its route list, which is why a policy this
file existed to enforce had been broken since it was written — plus a new test
that scrolls the whole transcript past the viewport and holds it at zero.
Scrolling is deliberately *not* folded into the shared helper, because
`/case/…` is supposed to prefetch Previous and Next once they come into view,
and the existing test for that exception still passes.

**Measured effect.** Proven red before the fix and green after, on the wire:

| Route | before | after |
|---|---|---|
| `/corrections/` (on load) | 5 requests, 74,267 B | **0** |
| `/watch/` (scrolled through) | 33 requests, 142,487 B | **0** |

Every other audited route measured zero both before and after, which is the
evidence that the wrapper was working everywhere it was actually used.

### The text-layout loader follows the engine — kept

**Cause.** `loadTextLayoutEngine` fetched the pretext runtime lazily, but the
module *containing* it — the font contract, the prepared-text cache and the
loader itself — was reached by a static import from the search dialog, which
put **3,586 bytes** of it in the chunk every route loads. Its only caller on
that path is `prewarm`; the excerpt fitter reaches it again from inside the
result list, which is already lazy.

**Change.** The import is now dynamic, with its own `.catch` — it is called
without being awaited, so the chunk fetch becoming a new failure mode had to be
swallowed like the engine's.

**Measured effect.** Median first-load JavaScript **572,901 → 569,313 bytes**,
uniform across all 30 route groups. Predicted 3,586; measured 3,588.

**Hardening shipped with it.** `lazy` throws to the nearest error boundary if
its import rejects, and the nearest one is the route's — so a dropped result
chunk would have replaced the page with the error document instead of the
"search could not load" line. The result list is now awaited inside `loadIndex`
alongside the index and the engine, so that failure lands in the same `catch`
as the other two.

## Hypotheses tested and rejected

### Splitting the `@ci/ui` barrel — rejected on the budget it would break

The largest remaining application-side chunk is 28,994 bytes shipped to 119
routes, and it is there so that `cn` — `twMerge(clsx(…))` — can be called.
About 26,798 bytes of it is tailwind-merge's class-group table.

The mechanism is real and was verified twice: only two first-load modules call
`cn` (`NavLinkItem`, `MobileNavigation`), and running the repository's own
tailwind-merge 3.6.0 and clsx 2.1.1 over **every live call site** shows
`twMerge(clsx(x)) === clsx(x)` in all nine — so a non-merging joiner would
produce byte-identical class attributes. The same probe found the two places
that genuinely do depend on conflict resolution, `Button` at `size="sm"` and
`size="lg"`, which is how we know the equivalence was measured and not assumed.

It was rejected anyway, on three grounds:

1. **It breaks the bundle budget.** `bundle-budget.ts` is deliberately
   *relative* — 3% over the median. Removing 27 kB from the shared chunk drops
   the median to ~545,899 and the ceiling with it, while the seven routes that
   still legitimately use `@ci/ui` keep their copy. Seven routes then fail, and
   shipping would mean adding six new allowance entries to a table whose own
   comment says such edits are "indistinguishable from quietly widening the
   budget". The optimistic variant still leaves five.
2. **It erodes a documented contract.** `scroll-region.tsx:21-24` records that
   the component owns className composition precisely because an earlier helper
   let callers compose wrong. A non-merging joiner silently returns that hazard
   for any future caller, and `NavLinkItem` takes a `className` too.
3. **No test would catch a mistake.** `button-contract.test.ts` calls
   `buttonVariants` directly, which has never passed through twMerge, so it
   passes identically either way. The change would be safe because the strings
   happen to be identical today, not because anything holds them there.

The honest summary is that this is 27 kB — about 7 kB on the wire, worth
roughly 34ms of simulated LCP — in exchange for a weakened deterministic gate
and a re-opened composition hazard. Recorded rather than taken.

### The two preloaded faces are the LCP determinant — rejected

The site preloads `SourceSerif4-latin-normal.woff2` (122 kB) and
`Inter-latin-normal.woff2` (73 kB): 195 kB at high priority, ahead of a 43 kB
stylesheet, on a 1.6 Mbps simulated link. With `font-display: swap` the real
faces arrive after first paint and force a re-layout of every line, which
matched the constant LCP-minus-FCP offset and matched Style & Layout being the
largest main-thread item (380ms on the home page, 1,587ms on `/full-case/`).

Tested by setting all six faces to `font-display: optional`, which removes the
swap and its re-layout entirely, then rebuilding and measuring three cold
mobile runs:

| Route | swap | optional |
|---|---|---|
| `/` | LCP 3463 | LCP 3315 |
| `/case/key-texts/weeping-and-gnashing/` | LCP 4214 | LCP 4222 |

No meaningful change on either. Reverted. Worth adding that the Source Serif 4
file is byte-identical to Google's own `latin` subset for
`opsz,wght@8..60,400..700` — 122,360 bytes, verified by fetching it — so it is
not an unsubsetted font, and shrinking it would mean dropping an axis, which
is a typography change.

### The framework bundle can be trimmed — rejected on the evidence

Every route shares a 605 kB uncompressed first-load baseline, in two chunks of
233 kB and 151 kB. Both are minified production Turbopack output; the larger
contains React DOM, the other the App Router client runtime. Lighthouse's
`unused-javascript` offers 50 KiB across those two framework chunks, and its
`legacy-javascript-insight` offers 14 KiB of polyfills — with **LCP savings of
zero** attached to both. `duplicated-javascript-insight` is clean. The twelve
client components on the site are small and already leaf-level; the search
index and the text-layout runtime are both already loaded only on search
intent.

There is no bundle-shaped fix here that does not mean leaving the framework,
which is out of scope and would not be a performance change but a rewrite.

### `content-visibility: auto` on the continuous edition — considered, not attempted

`/full-case/` is the worst route on the site by a wide margin: 1.86 MB of HTML,
40 sections, and 1,587ms of Style & Layout, which is four times the home page's
for seventeen times the document. Skipping the rendering of off-screen sections
is the one technique that would address that, and it is explicitly allowed
here — after proving that it preserves server-rendered HTML, crawlability,
anchor navigation, deep links, find-in-page, copy and selection, printing,
screen-reader reading order, heading structure, text geometry, search indexing,
cross-browser behaviour, and introduces no new layout shift.

Thirteen of those fourteen are provable with suites this repository already
has. The fourteenth is the problem, and it is the one that decides it.
`contain-intrinsic-size` is a guess at a section's height, and every guess that
is wrong moves the scrollbar under the reader as they scroll into it. The
current CLS on this page is 0.000 — and **Lighthouse would not see the
regression**, because its audit never scrolls. That is a trade of an invisible
regression for a visible score, on the one page a reader spends four hours in
and the one page the site recommends printing.

So it was not attempted. If it is ever revisited, the thing to build first is a
scroll-driven layout-shift measurement, because without one there is no way to
tell the improvement from the damage.

## Why mobile 100 is out of reach, in bytes

The scoring curves are not folklore and do not need to be guessed at. Feeding
the pinned engine's own `Util.computeLogNormalScore` with its own control points
(LCP `p10` 2500 / median 4000, and the published weights — TBT 30, LCP 25,
CLS 25, FCP 10, SI 10) reproduces the measured category scores exactly: the home
page's metrics return **91**, and `/full-case/`'s return **64**. The model is
therefore trustworthy enough to invert.

Holding FCP, TBT, CLS and Speed Index at their measured values, the home page
reaches a category score of 100 when **simulated LCP ≤ 1,935ms**.

Turn that back into bytes with the model above. Simulated TTFB is 474ms and is
not a function of page weight, so the download budget is 1,461ms, which at the
mobile preset's 204.8 kB/s is **≈306 kB for the entire page**. That figure is
generous: it ignores connection setup, TCP slow start and the CPU tail, all of
which Lantern also charges.

The page, after the optimisation above, transfers 397 kB. Now subtract
everything that cannot honestly be removed:

| | wire bytes | why it stays |
|---|---|---|
| Fonts, two latin faces | 200,842 | Typography is preserved by instruction. The faces are already `unicode-range`-split four ways, already `woff2`, and the Source Serif file is byte-identical to Google's own `latin` subset — 122,360 bytes, verified. Narrowing the axes or the glyph set is a typography change. |
| React 19 + the Next 16 app-router client | 113,389 | Framework. `unused-javascript` offers 49 KiB across exactly these two chunks and `duplicated-javascript-insight` is clean; removing them means leaving the framework, which is a rewrite. |
| Document | 18,294 | Prose, in the initial HTML, where it belongs. |
| Stylesheet | 9,362 | One 43 kB sheet, the only render-blocking resource on the page. |
| **Irreducible total** | **341,887** | |

**341,887 > 306,383.** With *every byte of application JavaScript deleted* —
the search dialog, the navigation sheet, the reading progress, the whole of
`@ci/ui`, all of it — the home page would still transfer more than the budget a
mobile Performance score of 100 allows. The gap is not in this repository's
code. It is the fonts and the framework, and the only ways to close it are the
two the instructions rule out.

This is offered as a measurement, not as an excuse: it is falsifiable, and the
way to falsify it is to show the page transferring under ~306 kB.

## What Lighthouse itself says is left

On the home page, mobile, every insight audit reports **zero** metric savings
for FCP and LCP:

```
cache-insight                    {"FCP":0,"LCP":0}
document-latency-insight         {"FCP":0,"LCP":0}
duplicated-javascript-insight    {"FCP":0,"LCP":0}
image-delivery-insight           {"FCP":0,"LCP":0}
legacy-javascript-insight        {"FCP":0,"LCP":0}   14 KiB
modern-http-insight              {"FCP":0,"LCP":0}
render-blocking-insight          {"FCP":0,"LCP":0}
lcp-breakdown-insight            {"LCP":0}
cls-culprits-insight             {"CLS":0}
forced-reflow-insight            clean
third-parties-insight            clean
bf-cache                         eligible
```

The single render-blocking resource is the 43 kB stylesheet, at 155ms, and
Lighthouse attributes no LCP saving to removing it. There are four long tasks,
worth 50ms of TBT between them.

## Whole-site sweep

One cold audit of every one of the 120 HTML routes, in both modes: **240 audits**,
from a fresh production build, on a server proved to be serving it.

### Desktop

| Performance | Routes |
|---|---|
| 100 | 116 |
| 99 | 3 |
| 98 | 1 (`/full-case/`) |

The three 99s (`/case/biblical-language/body-and-soul/`,
`/case/biblical-patterns/physical-and-final-death/`, `/objections/evangelism/`)
sit at LCP 823–826ms, a few milliseconds above their neighbours at 100. That is
inside the run-to-run spread; they are reported as measured rather than
re-rolled.

Accessibility **100 on all 120**. Best Practices **100 on all 120**. SEO **100 on
all 118 indexable routes**, 66 on the two deliberately non-indexable ones.

### Mobile

| Performance | Routes |
|---|---|
| 98 | 1 (`/changelog/s10/`) |
| 90–92 | 63 |
| 84–89 | 47 |
| 78–80 | 3 |
| 63 | 1 (`/full-case/`) |

**No route reaches 100.** Best `/changelog/s10/` at 98 (LCP 2,297ms — the only
route under the 2,500ms ceiling). Worst `/full-case/` at 63 (LCP 5,862ms, FCP
3,312ms). The three at 78–80 are long case sections whose TBT reached 259–316ms.

Accessibility **100 on all 120**. Best Practices **100 on all 120**. SEO as above.

`bun run perf:audit` gates on all of this and exits non-zero. It is meant to.

### Five audits that measured nothing

Five of the 240 came back with a Lighthouse runtime error, which the harness at
the time recorded as a performance score of zero — indistinguishable in a
summary table from a page that is catastrophically slow. All four affected
routes were re-audited immediately and measured normally (mobile 85–92, desktop
100), so they are transient tooling failures rather than page defects. The exact
error code is not recoverable, because the run had not been asked to keep
reports.

That is a harness defect and it is fixed: a runtime error is now carried
through as its own field, printed as `LIGHTHOUSE COULD NOT MEASURE THIS PAGE`,
excluded from every median, failed separately in the gate, and its report is
written to disk **whether or not** reports were requested — since the run that
did not ask for them is exactly the run that will need one.

### The second sweep

**Run**, on a separate fresh build, a restarted server and a cold browser
profile — it is the next section. It was not run at the time this paragraph
first said "not run": the argument then was that a second identical pass could
not change a failure whose cause was already understood. That was true about the
outcome and wrong about the value. Running it on a machine in a different state
is what produced the noise figures below, and those turn out to be the most
useful thing in this document about how far a single-run category score can be
trusted.

## The second whole-site sweep, on the tree carrying both optimisations

240 audits from a fresh production build, `--gate`, on build `B4Q3oCaecJ`.

| | mobile | desktop |
|---|---|---|
| Audits | 120 | 120 |
| Accessibility | **100 on all** | **100 on all** |
| Best Practices | **100 on all** | **100 on all** |
| SEO | **100 on all 118 indexable** (66 on the two deliberate `noindex`) | same |
| Performance range | 50–92 | 96–100 |
| Performance distribution | 92:23 91:11 90:12 89:11 88:2 87:7 86:6 84:7 83:6 82:10 81:4 80:6 79:1 78:1 73:2 72:2 68:1 62:1 50:1 | 100:82 99:29 96:1 |
| Unmeasurable (`NO_NAVSTART`) | 6 | 8 |

`bun run perf:audit` exits non-zero on this, and is meant to.

**This sweep is noisier than the baseline one and is not directly comparable to
it.** It ran on a laptop in a different state, and single-run category scores at
this noise level move by ten points or more. Two things prove the noise rather
than assert it: 14 audits returned `NO_NAVSTART` — a Lighthouse tooling failure
with no navigation start in the trace, which the harness now reports as
unmeasurable rather than scoring zero — and the worst number in the whole sweep,
a Total Blocking Time of 1,087ms on `/corrections/`, did not reproduce.

Re-measured immediately afterwards, three cold mobile runs each, on a quiet
machine:

| Route | P (median [min–max]) | LCP (MAD) | TBT (median [min–max]) | FCP | transfer |
|---|---|---|---|---|---|
| `/` | 91 [90–91] | 3,486 (8) | **107** [84–144] | 1,002 | 408 kB |
| `/corrections/` | 89 [85–92] | 3,624 (6) | **137** [72–272] | 931 | 463 kB |
| `/full-case/` | 71 [71–72] | 5,296 (16) | **129** [95–163] | 3,331 | 884 kB |

So the 1,087ms was an artefact: the real median is 137ms, **inside** the 150ms
ceiling. The sweep's single-run TBT numbers should be read as an upper bound
with a wide error bar, and the sweep's single-run Performance scores with it.

### What this measurement is good for

The metric that does *not* move is the one that decides the score. LCP's median
absolute deviation across those runs is 8ms, 6ms and 16ms — under half a percent
— while TBT's spread is 60ms to 200ms. **Simulated LCP on this site is
essentially deterministic, because it is a function of bytes rather than of
timing**, exactly as the model above says. That is what makes the byte argument
falsifiable, and it is confirmed on the two extremes of the site:

| Route | transfer | predicted LCP | measured LCP |
|---|---|---|---|
| `/` | 408 kB | ~2,470ms + CPU | 3,486ms |
| `/full-case/` | 884 kB | ~4,790ms + CPU | 5,296ms |

`/full-case/` is the same site with more bytes: 367 kB of document, and 328 kB
of fonts rather than 197 kB because the continuous edition puts italic Source
Serif above the fold. Its script bytes are *lower* than the home page's. Nothing
about it is slower except its size, which is the argument of the whole page.

## Interaction and INP

Navigation-only audits never touch any of this. `tests/e2e/interaction.spec.ts`
records the `event` timing entry for each interaction — the same measurement
INP is defined over — split into input delay, handler time and presentation
delay, and exercises each interaction both while hydration is still running and
once the page has settled.

| Interaction | Latency | delay / handler / paint |
|---|---|---|
| Open search by pointer, hydration still running | 40ms | 4 / 1 / 36 |
| Open search by pointer, page settled | 32ms | 3 / 1 / 28 |
| Open search with `Control+k` | 48ms | 2 / 0 / 46 |
| Type into search, index loaded | 32ms | 0 / 0 / 32 |
| Close search | 24ms | 1 / 1 / 23 |
| Open search under `prefers-reduced-motion: reduce` | 40ms | 4 / 0 / 36 |
| Open the navigation sheet, busy thread | 24ms | 1 / 1 / 22 |
| Close the navigation sheet | 16ms | 2 / 0 / 15 |
| Filter the Scripture index by typing | 32ms | 1 / 1 / 30 |
| Filter the Scripture index by book | under 16ms | below the observer's floor |
| Narrow the source library by kind | under 16ms | below the observer's floor |
| Follow an on-this-page anchor | 40ms | 2 / 0 / 38 |
| Activate the video facade | 32ms | 1 / 1 / 30 |
| Press a Next-section link | 40ms | 2 / 0 / 38 |
| Submit an incomplete correction | 32ms | 1 / 1 / 30 |

Every interaction is between 16 and 48ms against Google's 200ms ceiling, and
two fall below the 16ms floor Chrome will report at all. Presentation delay
dominates every measurement, which is to say the site is waiting for a frame
rather than for itself. The threshold in the test is Google's 200ms, not a
number derived from these results, so it cannot drift upward with a regression.

TBT is reported separately above and is **not** treated as evidence about INP.

## Technical SEO

`bun run seo:matrix` walks all 120 HTML routes on the wire and records what
each says about itself. Result, on the final tree:

```
routes           120
indexable        118
deliberately not   2
sitemap entries  118
redirect sources  21
distinct titles  118
distinct descs   118
breadcrumbs      119 of 120 pages
```

Exit 0: every route agrees with itself across the markup, the response headers,
the sitemap and the link graph. Specifically —

- exactly one canonical per page, absolute, on the resolved origin, with the
  repository's trailing-slash convention;
- 118 distinct titles and 118 distinct descriptions across 118 indexable
  routes: no duplication anywhere;
- exactly one `h1` per page;
- no unintended `noindex`, and no page whose meta robots disagrees with its
  `X-Robots-Tag`;
- the two deliberate `noindex` routes carry `follow`, are absent from the
  sitemap, and remain reachable from navigation;
- no internal link points at a redirect source;
- no `<img>` without an `alt` attribute anywhere on the site;
- every sitemap URL answers 200, exactly once each.

The full matrix is written to `reports/seo/indexability-matrix.tsv`, which is
not committed.

### One finding, recorded rather than fixed

`trailingSlash: true` makes Next emit a normalisation redirect, and
`routes-manifest.json` lists that rule *before* the site's own aliases. So a
shared link without a trailing slash takes two hops:

```
/annihilationism  →308→  /annihilationism/  →308→  /topics/annihilationism/
```

Both hops are permanent, the destination answers 200, and no link equity is
lost. Removing the first hop means putting an edge function in front of a
static site for the sake of twenty-one vanity URLs, which is a worse trade than
one extra round trip on a courtesy URL. The check therefore follows the whole
chain and holds it to two permanent hops ending where the redirect table says —
which is the requirement that actually matters.

### Structured data, robots, sitemap

Unchanged from the full-site SEO work merged in at `e020539`, and re-verified
here: `articleJsonLd` claims no publisher organisation and emits no date it does
not have; `websiteJsonLd` carries no sitelinks search box; `videoJsonLd` does
not pass the watch page off as the media file and every clip URL really starts
the video there; breadcrumbs are numbered from one, consecutively, with
absolute URLs. Nothing was added to qualify for a rich result.

No `llms.txt`, no WebMCP, no AI-specific schema. Lighthouse 13.4.1 exposes no
stable Agentic Browsing category; nothing was changed to chase an experimental
one.

## Design, motion and content: how preservation was verified

There are two production changes in this work: which links prefetch, and when
the search engine is fetched. Neither renders anything. No stylesheet, token,
font, colour, spacing, heading, or piece of copy was touched, and the only
component boundary that moved is the one between the search dialog's shell and
its engine — which is not a rendered boundary: the shell, its focus handling,
its Escape key, its backdrop and `Ctrl+K` are all exactly where they were.

The search change was additionally verified by re-running the suites that own
its behaviour on the changed tree: 567 unit and component tests (including the
31 in `quick-search-results.test.tsx`), 441 Chromium desktop and mobile e2e
tests, 77 accessibility tests at both viewports, 15 visual regression tests
against the committed baselines, and the 14-test interaction suite, which
re-measured every search interaction and found them all far under the 200ms
target. **Visual regression passing is the direct evidence that nothing about
the design moved.**

Concretely, `git diff` over the whole branch shows:

- `globals.css` unchanged by this work (the `font-display` experiment was
  reverted in full and the file is byte-identical to its pre-experiment state);
- no change to any design token, `buttonVariants`, or Tailwind `@theme` block;
- no change to any MDX body, Scripture reference, citation, source record,
  permanent section identifier, route or fragment target;
- 42 files changed only in the module their `Link` import resolves to.

Verified by the existing suites rather than by inspection: the motion contract
test, the three-engine text-geometry contract, visual regression against the
committed baselines, accessibility at both viewports, the rendered route sweep
over all 120 routes at five widths, and the print suite. The interaction suite
above additionally measures the dialog and sheet transitions in both motion
variants and finds them unchanged in feel and under 50ms.

## External limitations

**There is no deployed origin.** No Vercel project or other deployment exists
for this repository, so the following are *not verified* and are not claimed to
be:

- real TTFB, CDN caching, HTTP/2 or /3, and on-the-wire compression;
- PageSpeed Insights;
- CrUX field data at any level. The site has never been served publicly, so
  there is no 75th-percentile LCP, INP or CLS to report. This is an absence of
  data, not a passing result;
- Search Console Core Web Vitals.

`bun run perf:deployed --base-url <origin>` and
`PLAYWRIGHT_BASE_URL=<origin> bun run test:preview` run the same audits against
a real origin the moment one exists.

None of that excuses the local mobile Performance shortfall, and it is not
offered as an excuse for it.

## Verification

Every command run for this work, and what it returned.

Re-measured on the final tree, after main — carrying PR #6 — was merged in.

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | exit 0, no changes |
| `CI=1 bun run validate` | **exit 0** — 1,041 unit and component tests across 46 files |
| `CI=1 bun run test:coverage` | **exit 0**, every threshold met without moving one |
| `bun run seo:matrix` | **exit 0** — 120 routes, no finding |
| `bun run perf:routes` | **exit 0** — four sources reconciled |
| `bun run test:browser`, in four project groups | **exit 0 ×4** — **651 tests, 0 failures, 0 flakes** |
| `bun run perf:audit` (240 cold audits) | **exit 1** — mobile Performance, as recorded above |
| **GitHub Actions on the head commit** | **all green** — the whole browser suite in one invocation, on Linux |

Browser counts by project: chromium-desktop 218, chromium-mobile 208,
accessibility 38, accessibility-mobile 38, geometry-chromium / -firefox /
-webkit 23 each, firefox-smoke 23, webkit-smoke 23, visual 14, interaction 13,
print-chromium / -firefox / -webkit 2 each, served-build 1.

### Re-run for the search-engine change

Run on the tree carrying the deferral, on the same instrument.

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | exit 0 — 290 packages, no lockfile change |
| `bun run lint` | **exit 0** — 4 warnings, the same 4 the clean tree has |
| `bun run typecheck` | **exit 0** — 5 packages |
| `bun run test` | **exit 0** — **567 tests across 36 files** |
| `bun run build` | exit 0 |
| `bun run content:bundle` | **exit 0** against the *lowered* ceiling |
| `bun run content:docs` | exit 0 — 165 path mentions resolve |
| `bun run test:e2e` | **exit 0** — **441 tests** |
| `bun run test:a11y` | **exit 0** — **77 tests** |
| `bun run test:visual` | **exit 0** — **15 tests**, no baseline rewritten |
| `bun run test:interaction` | **exit 0** — **14 tests**, every interaction under 200ms |
| `bun run perf:routes` | **exit 0** — four sources reconciled, 120 HTML routes |
| `bun run seo:matrix` | **exit 0** — 120 routes, 118 distinct titles and descriptions, no finding |
| `bun run perf:audit` (240 cold audits) | **exit 1** — mobile Performance, as recorded above |
| 3 cold mobile runs on `/`, `/corrections/`, `/full-case/` | medians recorded above; the sweep's worst TBT did not reproduce |

### Re-run again for the prefetch and text-layout changes

| Command | Result |
|---|---|
| `bun run lint` / `typecheck` / `format:check` | **exit 0** — the same 4 warnings the clean tree has |
| `bun run test` | **exit 0** — **1,063 tests** (567 app + 336 `@ci/search` + 87 `@ci/content` + 73 `@ci/content-schema`) |
| `bun run test:e2e` | **exit 0** — **447 tests** (441 + the 6 new prefetch assertions) |
| `bun run test:a11y` | **exit 0** — **77 tests** |
| `bun run test:visual` | **exit 0** — **15 tests**, no baseline rewritten |
| `bun run test:interaction` | **exit 0** — **14 tests**, 24–72ms against a 200ms target |
| `bun run test:text-geometry` | **exit 0** — **70 tests** across Chromium, Firefox and WebKit |
| `bun run test:smoke` | **exit 0** — **47 tests** across Firefox and WebKit |
| `bun run test:print` | **exit 0** — **19 tests** across three engines |
| `bun run content:bundle` | **exit 0** — median 556.0 kB, every route within budget |

**689 browser tests, no failures and no flakes.** The prefetch budget was proven
red first — `/corrections/` at 74,267 bytes and `/watch/` at 142,487 — and green
after.

### One flake, root-caused rather than re-run

A CI run reported three uncaught `ReferenceError: window is not defined` from
React's scheduler, attributed to `quick-search-results.test.tsx`, with all 505
tests passing — so the run exited non-zero with no failing test. It did not
reproduce locally in ten attempts.

The search-excerpt fitter applies its result inside `startTransition`, so the
render is a scheduler task rather than a synchronous commit. A test that
asserts and ends can leave one queued; vitest then tears the jsdom environment
down at the end of the file and the task runs against a deleted `window`. The
component is not at fault — its cancellation already prevents an update after
unmount. What was missing was somewhere for an update that is still legitimate
to land, so `afterEach` now drains the scheduler inside `act` before anything
is torn down. A transition that throws now throws inside the test that
scheduled it.

### The local browser suite

The browser suite was run locally as three sequential invocations on three
different ports rather than as one. On this Windows machine a single
`next start` serving all eleven projects intermittently stops accepting
connections part-way through, producing `ERR_CONNECTION_REFUSED` on whatever
test happens to be running — which reads exactly like a product defect and is
not one. It is the same class of failure as the shared-port collision recorded
in `docs/production-readiness-qa.md`, and it is why every number here is quoted
with the connection failures separated out rather than counted. The suite, the
projects and the assertions are identical either way; CI runs all eleven in one
invocation on Linux, and that run is the authoritative one.

## Regression protection

`tests/e2e/prefetch-budget.spec.ts` (in `chromium-desktop`) and the
`interaction` Playwright project both run inside `bun run test:browser`, and so
inside `bun run qa:production` and CI. `bun run perf:routes` and
`bun run seo:matrix` are deterministic and exit non-zero on a finding.

The Lighthouse audits themselves are deliberately **not** in the pull-request
gate. A category score measured on a shared CI runner is noise, and a flaky
performance gate teaches people to re-run the build. What is gated instead is
the deterministic cause of each thing measured here: the prefetch budget, the
bundle budget, the interaction latencies, the indexability matrix, and the
route inventory reconciliation.
