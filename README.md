# The Case for Conditional Immortality

A calm, careful, searchable, source-driven biblical argument that can be
understood in three minutes, watched in 28 minutes, studied section by section,
researched passage by passage, challenged openly, and read in full without
losing any substantive part of the original case.

The site presents a cumulative evangelical case that final judgment is real,
conscious, just, and permanent, and that it culminates in the second death
rather than endless conscious torment.

## Quick start

```bash
bun install
bun run dev
```

The site runs at `http://localhost:3210`. No environment variables are required.

## The validation gate

```bash
bun run validate
```

Formatting, lint, typecheck, content validation, the content audit, unit tests,
the production build, the PII scan and the link check.

```bash
bun run ci
```

`validate`, then every browser suite: end-to-end on desktop and mobile,
accessibility, and the text-geometry contract in Chromium, Firefox and WebKit.
Each is also available on its own as `test:e2e`, `test:a11y` and
`test:text-geometry`.

## What is here

| Path | Contents |
|---|---|
| `apps/conditional-immortality/` | The Next.js application |
| `packages/ci-content-schema/` | Zod content models and the Bible reference parser |
| `packages/ci-content/` | Content registries, MDX bodies, the Scripture corpus |
| `packages/ci-search/` | Search index builder and ranker |
| `packages/ui/` | Shared UI primitives |
| `scripts/conditional-immortality/` | Import, validation and audit tooling |
| `docs/` | Reports and working briefs |
| `private/source/` | Redacted source archive. Not published |

## Documentation

Read these before changing anything substantive.

- [Authoring brief](docs/authoring-brief.md). Binding rules for writing content:
  style, citation, quotation and the things that will fail the build.
- [Routing brief](docs/routing-brief.md). Binding rules for adding a route.
- [Motion brief](docs/motion-brief.md). Binding rules for animation: the five
  tiers, what is deliberately not animated, and the two variants everything
  ships in.
- [Maintenance guide](docs/maintenance-guide.md). Every routine task and the
  command that does it.
- [Implementation report](docs/implementation-report.md). Architecture, testing,
  accessibility status, known limitations.
- [Content migration report](docs/content-migration-report.md). What came across
  from the source document and what did not.
- [Source verification report](docs/source-verification-report.md). Claims
  withdrawn, narrowed, corrected, and awaiting specialist review.
- [Rights audit](docs/rights-audit.md). Every category of third-party material
  and the basis on which it is used.

## Two things that are load-bearing

**Permanent section identifiers.** `P00`, `RB1`-`RB3`, `S01`-`S34`, `APP1`,
`APP2` never change. Titles, slugs and routes may be revised freely. The
changelog, reading progress, search and every cross-reference key off the id.

**Nobody types Scripture.** Write `<Scripture reference="Mark 9:42-48" />`. The
component renders verified public-domain text from a generated corpus. An
unknown reference fails the build. Do not work around this by typing the verse.

## Scale

129 static pages. 40 case sections with roughly 54,000 words of authored prose,
18 key passage pages, 27 topics, 20 glossary terms, 8 original-language notes,
33 sources, 208 Scripture index entries, a 279-cue video transcript, and a
1,034-entry migration ledger with nothing unmapped.

1,293 tests: 834 unit, 314 end-to-end across desktop and mobile, 76
accessibility across desktop and mobile viewports, and 69 text-geometry
across Chromium, Firefox and WebKit.
They run on every push; see `.github/workflows/ci.yml`.

## Conventions

Bun, not npm or pnpm. Server components by default. No third-party-hosted
script, font or stylesheet: everything is served from this origin, including the
one runtime dependency the search dialog loads lazily after a reader shows
search intent. YouTube is not contacted until a reader presses play. Search runs
in the browser and no query is transmitted. The author's personal contact
details from the source document are never published, and a build-time scanner
enforces it.

## One more thing that is load-bearing

**The search dialog fits its excerpts, and is allowed to give up.** A text
layout engine predicts where lines will break so a result's excerpt lands on a
whole number of lines. It is an optional refinement over an excerpt that is
already complete and correct, and it switches itself off — silently, for the
reader — whenever the font, the browser or the text is not one it can be trusted
with. See [Pretext and text geometry](docs/pretext-text-geometry.md).
