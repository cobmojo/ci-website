# SEO action plan — closed

This began as a plan and is kept as an execution record. Every code-level item
opened by the audit is closed. Nothing is carried as backlog except the items
that need someone with a domain registrar login or a Search Console account, and
those are listed separately at the bottom so they cannot be mistaken for work
that was skipped.

## Closed

| ID | Item | Owner in the codebase | Acceptance criteria | Test | Status |
| --- | --- | --- | --- | --- | --- |
| SEO-01 | Remove retired sitelinks `SearchAction` | `src/lib/metadata.tsx` → `websiteJsonLd()` | No `potentialAction` anywhere in rendered JSON-LD | `structured-data.test.ts`, `seo.spec.ts` | ✅ Done |
| SEO-02 | Remove invented `Organization` publisher | `src/lib/metadata.tsx` → `articleJsonLd()` | `Article` has no `publisher` | `structured-data.test.ts`, `seo.spec.ts` | ✅ Done |
| SEO-03 | Give the author a resolvable identity | `src/lib/metadata.tsx` → `authorPerson()` | `author.url` is the canonical `/about/` | `structured-data.test.ts` | ✅ Done |
| SEO-04 | Remove invalid `VideoObject.contentUrl` | `src/lib/metadata.tsx` → `videoJsonLd()` | No `contentUrl`; `embedUrl` retained | `structured-data.test.ts`, `seo.spec.ts` | ✅ Done |
| SEO-05 | Make `Clip` URLs real deep links | `src/lib/metadata.tsx` → `videoJsonLd()` | Every clip URL is `/watch/?t=<startOffset>`; no fragment | `structured-data.test.ts` | ✅ Done |
| SEO-06 | Stop a preview blocking its own `noindex` | `src/app/robots.ts` | Preview allows crawling, names no sitemap and no host | `indexing-contract.test.ts` | ✅ Done |
| SEO-07 | Drop sitemap fields Google ignores | `src/app/sitemap.ts` | No `priority`, no `changeFrequency`, no future `lastmod` | `indexing-contract.test.ts` | ✅ Done |
| SEO-08 | Make orphan pages fail the build | `scripts/…/link-check.ts` | 0 orphans excluding Next's error documents | `bun run content:links` | ✅ Done |
| SEO-09 | Gate rendered SEO output | `tests/e2e/seo.spec.ts` | 9 checks over every sitemap route, on every smoke project and the deployed-preview project | itself | ✅ Done |
| SEO-10 | Remove em dashes from `/privacy/` | `src/app/privacy/page.tsx` | Style contract passes | `content.spec.ts` | ✅ Done |
| SEO-11 | Restore real coverage of the correction flow | `playwright.config.ts` | The endpoint accepts a write under test and returns a receipt | `reading.spec.ts` | ✅ Done |
| SEO-12 | Stop repeating a citation locator three times | `src/components/content/cite.tsx` | An identical locator is not appended twice | `reading.spec.ts` | ✅ Done |
| SEO-13 | Correct the stale Irenaeus assertion | `tests/e2e/reading.spec.ts` | Asserts marker-first accessible-name *order* | itself | ✅ Done |
| SEO-14 | Scope the S04 receipt assertion | `tests/e2e/reading.spec.ts` | Targets the live region, not the no-JS twin | itself | ✅ Done |

## Verified as already correct

Recorded so a future audit does not re-open them: the canonical-origin resolver
and its fail-fast behaviour, social-image host resolution, per-route metadata
consistency across all 120 sitemap routes, the deliberate `noindex` strategy for
`/full-case/` and `/search/`, sitemap-to-registry parity in both directions,
trailing-slash agreement, the 20 permanent alias redirects, the absence of
`hreflang` on an English-only site, and server-rendered primary content. Each is
covered in the audit report with the evidence and, where one did not exist
before, a new test.

## Rejected

Ten recommendations were rejected with evidence rather than implemented — the
`Article` image, `llms.txt`, FAQ/HowTo/Speakable, `ProfilePage`, `Organization`,
fixed title and description character limits, IndexNow, image and video sitemap
extensions, `crawl-delay`, and rewriting the case into short answer blocks. The
reasoning for each is in `FULL-AUDIT-REPORT.md`; most are rejected because
primary documentation contradicts them, and the rest because they would damage
the site to satisfy a score.

## Open — and not code work

These need a person with credentials or authority the repository does not have.
Procedures are in `SEARCH-OPERATIONS.md`.

1. Register the domain and decide apex versus `www`, then build with
   `NEXT_PUBLIC_SITE_URL` set. Until then the build refuses to guess.
2. Verify the Search Console property and submit the sitemap.
3. Read field Core Web Vitals once traffic exists.
4. Run `bun run test:preview` against the first real preview deployment to
   confirm the `X-Robots-Tag` and preview `robots.txt` behave as unit-tested.
5. Decide the AI-crawler policy as a rights question.
6. Complete outstanding specialist theological review where sections say so.
