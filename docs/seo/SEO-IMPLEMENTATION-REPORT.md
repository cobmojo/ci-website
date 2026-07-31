# SEO implementation report

What changed, why, and what was deliberately left alone. The findings ledger is
in `FULL-AUDIT-REPORT.md`; this is the engineering account.

## Architecture

The site had most of an SEO system already. The canonical origin was resolved
once and validated hard, metadata came from a shared helper, the sitemap was
built from the same registries as the pages, and the route sweep rendered every
public page. What it did not have was a way to tell whether any of that was
*true*, and three of its structured-data claims were not.

So the shape of this work is narrow: the production code changes are small and
sit almost entirely in four files, and most of the diff is the tests that hold
them.

### Structured data moved into one module

`websiteJsonLd()` and `videoJsonLd()` used to be object literals inside
`page.tsx` and `watch/page.tsx`. They now live in `src/lib/metadata.tsx`
alongside `articleJsonLd` and `breadcrumbJsonLd`, and share one `authorPerson()`
helper. That is what makes them unit-testable at all — a claim inside a page
component can only be checked by rendering the page — and it means the author
identity cannot drift between the three places that assert it.

### What the site now says about itself

| Block | Where | Change |
| --- | --- | --- |
| `WebSite` | `/` | `potentialAction` removed; name, URL, language, author kept |
| `Article` | 39 section routes | `publisher` removed; `author.url` added |
| `VideoObject` | `/watch/` | `contentUrl` removed; `embedUrl` kept; `creator` gains a URL |
| `Clip` × chapters | `/watch/` | `url` moved from a page fragment to `?t=<seconds>` |
| `BreadcrumbList` | everywhere with visible breadcrumbs | unchanged, and now tested |

### Indexing

`robots.txt` on a preview no longer disallows crawling, because the
`X-Robots-Tag: noindex, nofollow` that actually removes a preview URL can only
be obeyed by a crawler allowed to fetch the response. It still names no sitemap
and no host. The sitemap dropped `priority` and `changeFrequency`, which Google
ignores by name and nothing here reads.

### Page experience

Two font preloads in the root layout, which took lab CLS on the homepage from
0.126 to 0.000 and on `/scripture/` from 0.160 to 0.029. No typography changed:
same files, same faces, same metrics, so the text-geometry contract is
untouched.

## Tests added

| File | Tests | What it holds |
| --- | --- | --- |
| `src/lib/__tests__/structured-data.test.ts` | 10 | The *truth* of every JSON-LD claim, not its syntax |
| `src/lib/__tests__/indexing-contract.test.ts` | 9 | `robots.txt` per environment; sitemap parity, absolute URLs, no future `lastmod`, no ignored fields |
| `tests/e2e/seo.spec.ts` | 10 | Rendered output over every sitemap route: canonicals, unique titles and descriptions, robots agreement, Open Graph, JSON-LD parsing, font preloads |

Plus one existing gate strengthened: `link-check.ts` now *fails* on an orphan
page instead of printing one and exiting zero.

### Why `seo.spec.ts` reads HTTP rather than driving a browser

It is the crawler's view — the markup as delivered, before hydration could add
to it — and it is origin-agnostic, so the same file runs against a deployed
preview through the existing `preview` project with no changes. It is
deliberately *not* in `SMOKE_SPECS`: it uses Playwright's `request` fixture,
which is a Node HTTP client, so running it on `firefox-smoke` and `webkit-smoke`
would re-fetch the same bytes and reach the same conclusion twice more.

### Why the CLS fix is gated as markup

A layout-shift number measured on a shared CI machine is noise, and a flaky
performance gate teaches people to re-run the build until it passes. The preload
tags are the cause of the improvement, they are deterministic, and losing them
is the regression — so those are what the test asserts.

## Commands run

```
bun install --frozen-lockfile
CI=1 bun run validate          # format, lint, typecheck, content validate/audit/docs,
                               # unit tests, build, PII scan, link check, bundle budget
bun run test:e2e               # chromium-desktop + chromium-mobile
bun run test:a11y              # accessibility + accessibility-mobile
bun run content:links          # orphan gate
bun run content:docs           # documentation path drift
```

## Performance

Lab only. Median of five cold runs per route, Chromium at 1440×900, against
`next start` on this machine. **Not field data** — no CrUX or Search Console
data exists, because nothing is deployed.

| Route | LCP | CLS |
| --- | --- | --- |
| `/` | 332 ms | 0.0000 |
| `/case/key-texts/eternal-punishment/` | 400 ms | 0.0000 |
| `/full-case/` | 660 ms | 0.0000 |
| `/search/?q=second+death` | 416 ms | 0.0000 |
| `/watch/` (poster, before activation) | 324 ms | 0.0000 |
| `/scripture/` | 348 ms | 0.0294 |

INP is not reported. It cannot be measured meaningfully without real
interactions from real users, and a Lighthouse or Playwright number would not be
INP. The existing bundle-budget gate is unchanged and still passes; no SEO change
added client JavaScript.

## Content integrity

The only prose edited anywhere on the site is two sentences on `/privacy/`,
rewritten to remove em dashes with every claim word-for-word intact. No
Scripture, quotation, citation, footnote, revision record, review label, route,
permanent identifier or fragment was touched. No page was created, merged or
deleted. No design token, font, colour or motion value changed. No third-party
script was added.

One accessibility improvement fell out of reading the citation code: a `<Cite>`
whose `locator` matched the source record's own locator made a screen reader say
it three times for one footnote. It no longer does.

## Deprecated guidance deliberately rejected

The Agentic SEO Skill's own output recommended restoring the retired sitelinks
`SearchAction`, restoring `VideoObject.contentUrl`, and adding a `publisher` to
both `Article` and `VideoObject`. All four are refused, with the primary
documentation that contradicts them recorded in the audit report. Six further
warnings it raised are false positives in its own heuristics — three because it
checks `ListItem` properties on the parent `BreadcrumbList`, and three because
its placeholder detector treats the character `[` as a placeholder marker, so
every JSON array trips it.

Also rejected, and not implemented: `llms.txt`, FAQ/HowTo/Speakable schema,
`ProfilePage`, `Organization`, `Article.image`, fixed title and description
character limits, IndexNow, image and video sitemap extensions, `crawl-delay`,
and rewriting the cumulative case into short answer blocks.

## Search Console status

None. No property exists, because no domain exists. The build refuses to invent
a canonical origin, which is the correct behaviour for a site that has not been
given a name. `SEARCH-OPERATIONS.md` is the checklist for the person who
registers it.

## Known external limitations

Rankings, indexing, rich results and AI citations cannot be guaranteed by
anything in this repository, and nothing here should be read as promising them.
Valid structured data is a precondition for a rich result, never a cause of one.
The preview `X-Robots-Tag` behaviour is unit-tested but has never been observed
on a real deployment. Field Core Web Vitals do not exist yet. Sections carrying
a specialist-review-pending label still carry it.
