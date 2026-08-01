# The Case for Conditional Immortality

[![CI](https://github.com/cobmojo/ci-website/actions/workflows/ci.yml/badge.svg)](https://github.com/cobmojo/ci-website/actions/workflows/ci.yml)

A calm, careful, searchable, source-driven biblical argument that can be
understood in three minutes, watched in 28 minutes, studied section by section,
researched passage by passage, challenged openly, and read in full without
losing any substantive part of the original case.

The site presents a cumulative evangelical case that final judgment is real,
conscious, just, and permanent, and that it culminates in the second death
rather than endless conscious torment.

## Requirements

| | |
|---|---|
| Bun | `1.3.14` — pinned in `packageManager`; `engines` allows `>=1.3.0` |
| Node | `>=22.0.0`, used by some tooling |

Bun, not npm, pnpm or Yarn. There is one lockfile and it is `bun.lock`.

## Quick start

```bash
bun install
bun run dev
```

The site runs at <http://localhost:3210>. No environment variables are
required: `dev` supplies the localhost origin opt-out itself.

### Running the production build locally

Worth doing before trusting anything about performance, prefetching or bundle
size — `next dev` answers none of those questions the way a real build does.

```bash
bun run build:local
```

```bash
NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL=1 bun run start
```

That serves on <http://localhost:3000>.

Both halves of this matter. `bun run build` — without `:local` — fails on
purpose, because a release build must be told its canonical origin and must
never bake in a localhost one by accident. And `next start` reads
`next.config.ts` on every boot, so the variable has to be set for the *running*
process as well as for the build: without it the server prints `Ready` and then
serves nothing but a config error. To avoid repeating it, copy `.env.example`
to `.env.local` inside the app directory — that file is git-ignored, and the
example documents every variable the site reads.

## The gates

```bash
bun run validate
```

Formatting, lint, typecheck, content validation, the content audit, the
documentation path check, unit tests, the production build, the PII scan, the
internal link check, the canonical-origin check, the bundle budget and the
route-inventory reconciliation.

```bash
bun run qa:production
```

`validate`, then coverage with its thresholds, then the indexability matrix,
then every browser suite: end-to-end on desktop and mobile, accessibility at
both viewports, cross-engine smoke in Firefox and WebKit, printed output in
three engines, the text-geometry contract in three engines, interaction
latency, and visual regression. `bun run ci` is the same thing.

Each suite also runs on its own:

| Command | What it runs |
|---|---|
| `bun run test` | Unit and component tests, all four workspaces |
| `bun run test:coverage` | The same, against the coverage thresholds |
| `bun run test:e2e` | `chromium-desktop`, `chromium-mobile` |
| `bun run test:a11y` | `accessibility`, `accessibility-mobile` |
| `bun run test:smoke` | `firefox-smoke`, `webkit-smoke` |
| `bun run test:print` | `print-chromium`, `print-firefox`, `print-webkit` |
| `bun run test:text-geometry` | `geometry-chromium`, `geometry-firefox`, `geometry-webkit` |
| `bun run test:interaction` | `interaction` — latency, measured as INP is defined |
| `bun run test:visual` | `visual` — screenshots against the committed Linux baselines |
| `bun run test:browser` | All fourteen of the above browser projects at once |

Lighthouse is deliberately outside the gate: a category score taken on a shared
runner is noise, and a flaky performance gate teaches people to re-run the
build. What the gate holds instead is the deterministic *cause* of each thing
it measures — the prefetch budget, the bundle budget, the interaction
latencies, the indexability matrix and the route-inventory reconciliation.

```bash
bun run build:local && bun run perf:audit
```

Every auditable route, both Lighthouse modes, gated. It needs a build to exist
first, and it **exits non-zero by design** on the mobile shortfall recorded in
[Performance and technical SEO](docs/performance-and-technical-seo-report.md).
`perf:smoke` is the same thing on one route per family, and `perf:certify` runs
five cold audits on the worst route in each.

Two commands are outside every gate, because they depend on machines this
repository does not control:

```bash
bun run content:links:external
```

```bash
PLAYWRIGHT_BASE_URL=https://preview.example bun run test:preview
```

The first fetches every published citation; it runs on the first of each month
and before a release. The second runs the origin-agnostic suite against a real
deployment and starts no local server.

## What is here

| Path | Contents |
|---|---|
| `apps/conditional-immortality/` | The Next.js application |
| `packages/ci-content-schema/` | `@ci/content-schema` — Zod content models and the Bible reference parser |
| `packages/ci-content/` | `@ci/content` — content registries, MDX bodies, the Scripture corpus |
| `packages/ci-search/` | `@ci/search` — search index builder and ranker |
| `packages/ui/` | `@ci/ui` — shared UI primitives |
| `scripts/conditional-immortality/` | Import, validation, audit and Lighthouse tooling |
| `docs/` | Reports and working briefs |
| `private/source/` | Source artefacts: the import report and the eight embedded images. Committed, but never served by the site |

## Documentation

Read these before changing anything substantive.

**Binding rules**

- [Authoring brief](docs/authoring-brief.md). Writing content: style, citation,
  quotation and the things that will fail the build.
- [Routing brief](docs/routing-brief.md). Adding a route.
- [Motion brief](docs/motion-brief.md). Animation: the five tiers, what is
  deliberately not animated, and the two variants everything ships in.

**How it works**

- [Maintenance guide](docs/maintenance-guide.md). Every routine task and the
  command that does it.
- [Implementation report](docs/implementation-report.md). Architecture, testing,
  accessibility status, known limitations.
- [Pretext and text geometry](docs/pretext-text-geometry.md). The line-breaking
  engine behind search excerpts, and the conditions under which it refuses.

**Audits and reports**

- [Performance and technical SEO](docs/performance-and-technical-seo-report.md).
  What Lighthouse measures here, what was optimised, what was tried and
  reverted, and why a mobile score of 100 is out of reach in bytes.
- [Front-end UI audit](docs/frontend-ui-audit-and-refinement.md). The interface
  review, its findings, and the candidates that were rejected.
- [SEO](docs/seo/). The full audit, the implementation report, the action plan
  and the search-operations runbook.
- [Content migration report](docs/content-migration-report.md). What came across
  from the source document and what did not.
- [Source verification report](docs/source-verification-report.md). Claims
  withdrawn, narrowed, corrected, and awaiting specialist review.
- [Rights audit](docs/rights-audit.md). Every category of third-party material
  and the basis on which it is used.

**Before a launch**

- [Production-readiness QA](docs/production-readiness-qa.md)
- [Launch runbook](docs/launch-runbook.md)

## Three things that are load-bearing

**Permanent section identifiers.** `P00`, `RB1`–`RB3`, `S01`–`S34`, `APP1`,
`APP2` never change. Titles, slugs and routes may be revised freely. The
changelog, reading progress, search and every cross-reference key off the id.

**Nobody types Scripture.** Write `<Scripture reference="Mark 9:42-48" />`. The
component renders verified public-domain text from a generated corpus. An
unknown reference fails the build. Do not work around this by typing the verse.

**The search dialog fits its excerpts, and is allowed to give up.** A text
layout engine predicts where lines will break so a result's excerpt lands on a
whole number of lines. It is an optional refinement over an excerpt that is
already complete and correct, and it switches itself off — silently, for the
reader — whenever the font, the browser or the text is not one it can be trusted
with. See [Pretext and text geometry](docs/pretext-text-geometry.md).

## Conventions

Server components by default; nineteen client components, all leaf-level.

**Nothing is fetched from a third party.** No hosted script, font or
stylesheet — everything is served from this origin, and the Content Security
Policy in `next.config.ts` enforces it. YouTube is not contacted until a reader
presses play.

**Search is four lazy loads and no service.** Nothing is fetched until a reader
shows search intent — hovering or focusing the trigger, or opening the dialog.
Then four things arrive together: the index, the search engine, the result list
with its excerpt fitter, and the text-layout runtime. The quick panel scores
the index in the reader's browser and transmits nothing. `/search/` scores the
same index on this origin's own server, so that it works without scripting and
a page of results can be linked — at the cost of the term travelling in the URL.
There is no hosted search service behind either.

**The author's personal contact details are never published**, and a build-time
scanner (`bun run content:pii`) enforces it.

**The site does not build without a canonical origin, on purpose.**

## Scale

Routes, from `bun run perf:routes`, which reconciles the build output, the
sitemap and the navigation registries and fails if they disagree:

| Kind | n |
|---|---|
| Indexable HTML | 118 |
| Deliberately non-indexable HTML | 2 (`/full-case/`, `/search/`) |
| Redirect aliases | 21 |
| Generated assets | 6 |
| Route handlers | 2 |
| Framework error documents | 2 |

Thirteen template families. The largest are 38 case sections and objections,
27 topics, 18 key passages, 12 changelog entries and 9 index pages.

Content: 40 permanent sections with roughly 54,000 words of authored prose, 20
glossary terms, 8 original-language notes, 33 sources, 208 Scripture index
entries, a 279-cue video transcript, and a 1,034-entry migration ledger with
nothing unmapped.

**1,748 tests** in `bun run qa:production`:

- **1,065** unit and component tests across 50 files — 569 in the app, 336 in
  `@ci/search`, 87 in `@ci/content`, 73 in `@ci/content-schema`.
- **683** browser tests across fifteen Playwright projects, plus a sixteenth,
  `preview`, whose 33 origin-agnostic tests run against a deployed origin
  instead. Every project waits on a `served-build` guard that proves the server
  is serving the build just made.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main`, on every pull request, and
on manual dispatch — not on a push to an arbitrary branch with no PR open. It
runs `validate`, coverage, a generated-file drift check, and fourteen of the
fifteen browser projects.

Two things in `qa:production` are **not** in CI and are run locally: the
`interaction` project and `seo:matrix`. Two further workflows sit outside it —
`external-links.yml` on the first of each month, and `visual-baselines.yml`,
which is manual on purpose because a screenshot baseline is an approval and
someone has to look at the images first.

## Licence

**Not yet chosen.** There is no `LICENSE` file, and no licence is stated here or
anywhere else in the repository, so no permission to use, copy, modify or
redistribute this work has been granted. That is a decision the owner needs to
make before launch, not an oversight to be filled in casually: the content is a
theological argument with quoted third-party material, and the code and the
prose may not warrant the same terms.

[Rights audit](docs/rights-audit.md) covers the separate question of the
third-party material *used here* — every category of it, and the basis on which
it is used.
