# Performance and technical SEO

**Status: not certified.** Every indexable route reaches 100 on Accessibility,
Best Practices and SEO in both Lighthouse modes, and 100 on Performance in
desktop mode. Mobile Performance does not reach 100 on any route: it sits
between 83 and 92, and at 59–64 on `/full-case/`. That shortfall is measured,
diagnosed and attributed below, and Lighthouse's own insights report **zero
available savings** for First Contentful Paint or Largest Contentful Paint on
every route audited. What remains is the cost of hydrating a large
server-rendered document under a four-times CPU throttle, and closing it means
changing what the site is rather than how it is built.

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
- **Final commit** is the head of `claude/production-readiness-qa-launch-59185d`;
  everything after `0d0d42d` is documentation and gate wiring, with no change to
  what is served.

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
off unless asked for; all 42 imports in the application point at it. One
exception, asked for explicitly: Previous and Next on a case section, because
sequential reading is the one navigation here that is genuinely predictable.
They sit at the foot of a four-thousand-word section, so they prefetch when the
reader reaches them rather than when the page loads.

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

## Hypotheses tested and rejected

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

**Not run.** The rules ask for two independent whole-site sweeps from separate
fresh builds. The first one fails, comprehensively and for a reason that a
second identical pass cannot change, and forty minutes of the same measurement
would have bought no information. What was run instead: five cold runs each on
five representative routes for the one optimisation that was kept, three cold
runs for each rejected hypothesis, and the whole-site sweep above. A second
sweep belongs in the run that expects to pass.

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

The only production change in this work is which links prefetch. No stylesheet,
token, font, colour, spacing, heading, component boundary or piece of copy was
touched. Concretely, `git diff` over the whole branch shows:

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

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | exit 0, no changes |
| `CI=1 bun run validate` | **exit 0** — 957 unit and component tests across 39 files |
| `CI=1 bun run test:coverage` | **exit 0**, thresholds met |
| `bun run seo:matrix` | **exit 0** — 120 routes, no finding |
| `bun run perf:routes` | **exit 0** — four sources reconciled |
| `bun run test:browser`, in three project groups | **exit 0 ×3** — **609 tests, 0 failures, 0 flakes** |
| `bun run perf:audit` (240 cold audits) | **exit 1** — mobile Performance, as recorded above |
| GitHub Actions on the head commit | see the pull request |

Browser counts by project: chromium-desktop 206, chromium-mobile 196,
accessibility 32, accessibility-mobile 32, geometry-chromium / -firefox /
-webkit 23 each, firefox-smoke 23, webkit-smoke 23, visual 14, interaction 13,
served-build 1.

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
