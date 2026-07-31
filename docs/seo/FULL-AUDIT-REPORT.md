# Full-site SEO audit

**Scope** — every public route, the metadata and structured-data utilities, the
route and content registries, `robots.txt`, the sitemap, the canonical-origin
resolver, the watch page, deployment headers, and the test suites that gate all
of it.

| | |
| --- | --- |
| Audit date | 31 July 2026 |
| Branch | `claude/full-site-seo-audit-8db490` |
| Base | PR #7 (`claude/production-readiness-qa-launch-59185d`), which already contains PR #6 |
| Application | Next.js 16.2.12, React 19.2.8, Bun 1.3.14, Turborepo 2.10.7 |
| Production origin | **Not yet chosen.** No domain is registered or pointed — see *External verification required* |
| Preview origin | None deployed at audit time |
| Agentic SEO Skill | `Bhanunamikaze/Agentic-SEO-Skill` @ `69199160e18372bc5cdf9ddec20ccb9fb1b509f1` |

## Why this branch is based on PR #7 rather than `main`

PR #6 and PR #7 were both open. PR #7 contains PR #6 (merged at `da3b0e1`) and
is the newer tree, and it introduces `src/lib/site-url.ts` — the canonical
origin resolver, which is the single highest-leverage file in an SEO audit.
Branching from `main` would have meant re-deriving that resolver and
guaranteeing a conflict in `site-url.ts`, `robots.ts`, `site-config.ts` and
`next.config.ts`. This branch therefore continues the newest tree, following the
precedent PR #7 itself set, and inherits its six red end-to-end tests as work to
close rather than leaving them for someone else.

## Primary documentation consulted

Authority order used throughout: repository contracts first, then current Google
Search Central documentation, then Next.js documentation for the installed
version, then Schema.org, and only then the Agentic SEO Skill. Where the skill's
generic advice conflicted with primary documentation, the primary documentation
won and the rejection is recorded below.

- Google Search Central — *Video (VideoObject, Clip) structured data*
- Google Search Central — *Article structured data*
- Google Search Central — *Block search indexing with noindex*
- Google Search Central — *Build and submit a sitemap*
- Google Search Central — *Sitelinks search box* (deprecated 21 November 2024)

## Baseline

Established on a clean worktree with `bun install --frozen-lockfile`, a full
production build, and a crawl of the served build rather than of React source.

| Measure | Baseline |
| --- | --- |
| Prerendered HTML documents | 122 |
| — canonical routes in the sitemap | **118** (21 static + 40 case sections + 18 passages + 27 topics + 12 changelog) |
| — deliberately noindex public routes | 2 (`/full-case/`, `/search/`) |
| — framework error documents (`_not-found`, `_global-error`) | 2 |
| Pages walked by the internal link checker | 121 |
| Internal links resolved | 9,543 |
| External links catalogued (not fetched in CI) | 188 |
| Duplicate element ids | 0 |
| Orphan pages (excluding Next's own error documents) | 0 |

## Severity and confidence

**P0** indexing-wide or privacy failure · **P1** major crawlability,
duplicate-content or structured-data defect · **P2** metadata, internal-linking
or maintainability · **P3** polish.

Every finding below is **Confirmed**: reproduced against this tree, either in
the rendered build output or by a test that failed before the change and passes
after it. Nothing in this report rests on a hypothesis.

---

## Implemented and verified

### SEO-01 · Obsolete sitelinks `SearchAction` · P2

**Where** `src/app/page.tsx`, homepage `WebSite` JSON-LD.
**Evidence** The block carried `potentialAction: { '@type': 'SearchAction' }`
targeting `/search/?q={search_term_string}`.
**Root cause** Markup written for Google's sitelinks search box, which Google
retired globally on 21 November 2024, removing the Search Console report, the
Rich Results Test highlight and the documentation with it.
**Correction** `potentialAction` removed. `WebSite` itself is kept — site names
still read from it. The site's own `/search/` page is untouched; it is a reader
feature and never depended on this markup.
**Alternatives** Leaving it costs no Search Console error, but it is a claim
about a feature that no longer exists and has to be maintained by whoever reads
the file next.
**Test** `structured-data.test.ts` — *carries no sitelinks search box markup*;
`seo.spec.ts` guards against reappearance across all routes.

### SEO-02 · `Article` named an organization that does not exist · P1

**Where** `src/lib/metadata.tsx`, `articleJsonLd`.
**Evidence** `publisher: { '@type': 'Organization', name: siteConfig.name }` —
the site's own *title* asserted as a legal entity, on all 39 section pages.
**Root cause** A template default. The visible About page says this site
presents "one person's case"; no organization publishes it.
**Correction** `publisher` removed. It is not a required Article property, and
Google does not require `Organization` for it.
**Content integrity** This is the truthful direction: the change removes an
invented institution rather than inventing a different one.
**Test** `structured-data.test.ts` — *does not claim an organization publishes
the site*.

### SEO-03 · Author name with nothing to resolve it to · P2

**Where** `src/lib/metadata.tsx`.
**Evidence** `author: { '@type': 'Person', name: 'Phil Welch' }` and no `url`.
**Correction** A shared `authorPerson()` helper now carries
`url: absoluteUrl('/about/')`. `/about/` has an `#author` section that
identifies him in his own words, and is the only page that does.
**Restraint** No `sameAs`, no credential, no affiliation — none is verified, and
§23 forbids inventing any.
**Test** `structured-data.test.ts` — *links the author to the page that
identifies him*.

### SEO-04 · `VideoObject.contentUrl` pointed at a watch page · P1

**Where** `src/app/watch/page.tsx`.
**Evidence** `contentUrl: 'https://youtu.be/9fevXbKUKmE'`.
**Primary documentation** contentUrl must be "the URL of the video file's
actual content bytes"; Google states explicitly: "Don't link to the page where
the video lives."
**Correction** Property omitted. There is no media-file URL to give — the video
is hosted on YouTube and reachable only as a watch page or an embed — and
`embedUrl` is the supported way to say where the player is. It is retained.
**Alternatives** Fabricating a media URL was never an option.
**Test** `structured-data.test.ts` — *does not pass a watch page off as the
media file*.

### SEO-05 · Every `Clip` URL was a page fragment, not a deep link · P1

**Where** `src/app/watch/page.tsx`, `hasPart`.
**Evidence** `url: absoluteUrl('/watch/#chapter-id')` for all chapters.
**Primary documentation** A clip URL must deep link into the video: "The video
must have the ability to deep link into some point other than the start point
in the video URL. For example, `https://www.example.com/example?t=30`."
**Root cause** The fragment scrolls the transcript and leaves the player at
zero — a link shaped like a deep link that is not one.
**Correction** Clip URLs now use `?t=<seconds>`. This is not new capability:
`ClickToLoadVideo.resolveStart()` already reads `?t=` at activation and hands
`start=` to the embed, and the transcript timestamps on the same page already
link that way. The markup now describes behaviour the page actually has.
**Privacy** Unchanged — no request reaches YouTube before the reader presses
play.
**Test** `structured-data.test.ts` — *gives every clip a URL that really starts
the video there*, including an explicit guard against the fragment form.

### SEO-06 · A preview blocked the crawler that had to read its `noindex` · P1

**Where** `src/app/robots.ts`.
**Evidence** On `SITE_ENV=preview`, `robots.txt` answered `Disallow: /` while
`next.config.ts` sent `X-Robots-Tag: noindex, nofollow`.
**Primary documentation** "For the `noindex` rule to be effective, the page or
resource must not be blocked by a robots.txt file… the crawler will never see
the `noindex` rule, and the page can still appear in search results."
**Root cause** The two directives read as belt-and-braces and cancel. The
disallow was suppressing the only directive that removes a preview URL somebody
had already shared in a pull-request comment or a chat message.
**Correction** A preview now allows crawling, so the header is read and obeyed.
It still names no `sitemap` and no `host`, so it never advertises itself.
**Test** `indexing-contract.test.ts` — two tests over the preview branch.

### SEO-07 · Sitemap emitted two fields Google ignores · P3

**Where** `src/app/sitemap.ts`.
**Evidence** Every entry carried `priority` and `changeFrequency`.
**Primary documentation** "Google ignores `<priority>` values." "Google ignores
`<changefreq>` values."
**Consumer check** Nothing else in this repository reads either field.
**Correction** Both removed; `lastmod`, which Google does use, is kept and is
sourced per-route from `lastSubstantiveRevision`/`lastReviewed` rather than from
a build timestamp.
**Test** `indexing-contract.test.ts` — *carries no field Google ignores*, plus a
guard that no `lastmod` is in the future.

### SEO-08 · Orphan pages were reported but never failed anything · P2

**Where** `scripts/conditional-immortality/link-check.ts`.
**Evidence** The script computed orphans, printed them, and exited zero. A page
could stop being linked from anywhere and every gate would stay green.
**Correction** An orphan is now an error. Next's own `/_not-found/` and
`/_global-error/` are excluded by design — they are reached by failing to find
something, never by a link.
**Result** 0 orphans across 121 pages.

### SEO-09 · No rendered regression coverage for any SEO claim · P2

**Where** New: `apps/conditional-immortality/tests/e2e/seo.spec.ts`.
**Evidence** `route-sweep.spec.ts` checked structure (one `h1`, one `main`, no
console error, no broken fragment) but nothing checked canonicals, descriptions,
robots directives, Open Graph agreement or JSON-LD validity.
**Correction** Eleven checks over all routes, driven by the sitemap so a new route
cannot escape them, reading served HTML rather than driving a browser — the
crawler's view, and origin-agnostic, so the same assertions run against a
deployed preview through the existing `preview` project.

### SEO-10 · Em dashes in `/privacy/` · P3

The repository's style contract forbids the em dash outside quoted Scripture.
Two parenthetical asides on the privacy page used them. Rewritten with commas
and a colon; the privacy claims themselves are word-for-word unchanged.

### SEO-11 · The correction gate was green over a form that did nothing · P1

**Evidence** Under `next start` (`NODE_ENV=production`) the filesystem feedback
store refuses to write unless `FEEDBACK_STORE_DURABLE=1` declares its directory
survives a restart. The Playwright web server did not set it, so the endpoint
disabled itself and the correction test failed on a missing receipt.
**Correction** The suite's store is a temp directory that genuinely outlives the
server process, so the run now declares it. This restores real coverage of the
site's only write path.

### SEO-12 · A citation locator spoken three times · P3 (accessibility)

`formatCitation` already ends with the source's own locator. A `<Cite locator>`
repeating it, plus the visible marker that leads the accessible name, made a
screen reader say "Book II, chapter 34, section 3" three times for one footnote.
An identical locator is no longer appended; one that genuinely narrows the
source still is.

### SEO-13 / SEO-14 · Two stale test assertions · P3

The Irenaeus citation assertion still expected the accessible name to begin with
the full citation, after PR #7 deliberately moved the visible marker to the front
for WCAG 2.2 SC 2.5.3. It now asserts that *order*, so a revert fails. The S04
receipt assertion matched two elements, because the page also carries a
no-JavaScript `:target` receipt saying the same words; it is now scoped to the
live region, which is the path the click takes.

### SEO-15 · Font swap pushed CLS past the "good" threshold on two routes · P2

**Where** `src/app/layout.tsx` (now), `src/app/globals.css` (cause).
**Evidence** Measured cold against the production build, median of five runs
per route, Chromium at 1440×900:

| Route | CLS before | CLS after | LCP before | LCP after |
| --- | --- | --- | --- | --- |
| `/` | **0.1259** | 0.0000 | 412 ms | 332 ms |
| `/scripture/` | **0.1599** | 0.0294 | 296 ms | 348 ms |
| `/case/key-texts/eternal-punishment/` | 0.0174 | 0.0000 | 504 ms | 400 ms |
| `/full-case/` | 0.0035 | 0.0000 | 716 ms | 660 ms |
| `/search/?q=second+death` | 0.0063 | 0.0000 | 452 ms | 416 ms |
| `/watch/` | 0.0017 | 0.0000 | 332 ms | 324 ms |

**Root cause** Attributed with `PerformanceObserver`, not guessed: a single
shift at 357 ms on `/` and 431 ms on `/scripture/`, whose sources were text
nodes and `nav.ml-auto.hidden.xl:block`. That is the web fonts swapping in. The
six `@font-face` rules are only discovered once CSS has parsed, so the first
paint uses the fallback and every line is re-measured when the real faces
arrive. The comment above them claimed "a metric-similar fallback keeps CLS at
zero", but no `size-adjust`, `ascent-override` or `descent-override` is
declared, so nothing actually held the metrics.

**Correction** `ReactDOM.preload` for the two upright latin faces, which cover
essentially all above-the-fold text. Not the italic or latin-ext subsets: they
rarely appear there and preloading all six would only make them compete.
`crossOrigin` is set because a font preloaded without it is fetched a second
time by the CSS.

**Why not fix the metrics instead** Adding `size-adjust`/`ascent-override` to a
fallback stack changes text geometry, and this repository has a text-geometry
contract gated across three engines (`docs/pretext-text-geometry.md`). It is
also a typography change, which SEO work here is explicitly not allowed to
make. Preloading changes *when* the same files arrive and nothing else — same
faces, same metrics, same contract.

**Test** `seo.spec.ts` — *the two faces that draw the first screen are
preloaded*. The tags are gated, not the measurement: a CLS number taken on a
shared CI machine is noise, and a flaky performance gate teaches people to
re-run the build. The tags are the cause and losing them is the regression.

**Honest limit** These are **lab** numbers from a local production server on one
machine. They are not field data, and no CrUX or Search Console data exists
because nothing is deployed.

---

## What the Agentic SEO Skill reported, and what came of it

The skill was run at commit `69199160e18372bc5cdf9ddec20ccb9fb1b509f1` against
the built HTML, and its `finding_verifier.py` reduced 14 raw findings to 12
distinct ones. **Zero were errors.** All twelve were warnings, and all twelve
are accounted for:

| Skill finding | Disposition |
| --- | --- |
| `WebSite is missing recommended property 'potentialAction'` | **Rejected.** This is the retired sitelinks `SearchAction` — the skill is recommending exactly what SEO-01 removed, and Google retired the feature on 21 November 2024. |
| `VideoObject is missing recommended property 'contentUrl'` | **Rejected.** Google: "Don't link to the page where the video lives; this must be the URL of the video file's actual content bytes." No media-file URL exists. See SEO-04. |
| `VideoObject is missing recommended property 'publisher'` | **Rejected.** No organization publishes this site. Same reasoning as SEO-02. |
| `Article is missing recommended property 'publisher'` | **Rejected.** As above. |
| `Article is missing recommended property 'image'` | **Rejected.** See the rejection table below. |
| `VideoObject is missing recommended property 'transcript'` | **Rejected.** The full transcript is already visible, server-rendered and crawlable on `/watch/`, which is what actually lets it be understood. Duplicating 28 minutes of prose into a JSON-LD string would inflate the document for a property with no documented Google consumer. |
| `BreadcrumbList is missing recommended property 'item'` | **False positive.** `item`, `name` and `position` belong on the `ListItem` children, and that is exactly where this site puts them. The skill checks for them on the parent node. |
| `BreadcrumbList is missing recommended property 'name'` | **False positive**, as above. |
| `BreadcrumbList is missing recommended property 'position'` | **False positive**, as above. |
| `BreadcrumbList property 'itemListElement' appears to contain placeholder text` | **False positive.** The skill's placeholder heuristic lists `"["` as a marker, so every JSON array on every site trips it. |
| `VideoObject property 'hasPart' appears to contain placeholder text` | **False positive**, same array heuristic. |
| `VideoObject property 'thumbnailUrl' appears to contain placeholder text` | **False positive**, same array heuristic. |

### Where the skill could not reach

Its URL-fetching scripts refuse any host resolving to a private or loopback
address (`lib/safe_http.py`), which is a sound SSRF guard and also means they
cannot audit an undeployed site at all — every script that takes a URL rather
than a file was unusable here. The guard was **not** patched to work around it:
weakening a security control to make a tool produce output is not a trade worth
making, and this repository already covers the same ground deterministically and
on every push:

| Skill script | Repository equivalent, running in CI |
| --- | --- |
| `canonical_checker.py` | `canonical-check.ts` + `seo.spec.ts` canonical test |
| `robots_checker.py` | `indexing-contract.test.ts` + `smoke.spec.ts` |
| `sitemap_checker.py` | `indexing-contract.test.ts` (parity both ways, absolute URLs, no future `lastmod`) |
| `internal_links.py`, `orphan_pages_from_sitemap.py` | `link-check.ts`, which now fails on an orphan |
| `indexability_matrix.py` | `seo.spec.ts` robots test over every route |
| `social_meta.py` | `seo.spec.ts` social metadata test |
| `x_robots_header_checker.py` | `security-headers.spec.ts` |

---

## Already correct, and now demonstrated

These were audited as candidates and found sound. Each is listed because "we
checked and it holds" is a result, and because most of them now have a test that
did not exist before.

| Candidate | Finding |
| --- | --- |
| **A** Production origin fallback | `resolveSiteUrl` refuses to invent an origin: a build either names one or declares itself local. Validated for scheme, credentials, query, fragment and path. 100% branch coverage, plus `canonical-check.ts` proving the resolved origin reached every canonical, `og:url`, `og:image` and `<loc>` in the output. |
| **M** Social-image host | Same mechanism; `canonical-check.ts` covers `og:image` explicitly. |
| Production-origin build | Every other check in this audit ran against a localhost build, so the production path was verified separately: a build with `NEXT_PUBLIC_SITE_URL=https://…` and `SITE_ENV=production` was checked with `content:canonical`, and every canonical, `og:url`, `og:image`, sitemap `<loc>` and robots directive across 121 pages agrees with that HTTPS origin. No localhost string survives into a production build. |
| **K** Route metadata consistency | Verified by rendered inventory, not by assumption: all routes carry exactly one canonical pointing at themselves, and **no two pages share a title or a description**. |
| **L** `noindex` strategy | `/full-case/` and `/search/` are noindex, absent from the sitemap, and still reachable and linked. Deliberate and internally consistent. |
| Sitemap ↔ registry parity | The sitemap is now proven to equal the registries exactly, in both directions. |
| Trailing slash | `trailingSlash: true`; every canonical, sitemap entry and internal link agrees. |
| Redirects | 20 aliases, all permanent, all to canonical routes. No alias is a duplicate page. |
| Language | English-only content with marked Greek and Hebrew spans. No `hreflang`, correctly. |
| Server rendering | Primary content, metadata and JSON-LD are all in the served HTML. |
| `meta keywords` | Absent, and now guarded. |
| Framework error documents | `/_not-found/` answers **404** and `/_global-error/` answers **500**. Both are real entries in the route manifest and both are prerendered, and `_global-error.html` has no title — but neither is servable as a 200, so neither can become the title-less soft 404 that gets indexed and then sits in Search Console as an unexplained quality problem. Verified by request and now gated. |
| 404 handling | An address that never existed answers a true 404, not a styled 200. |
| External links | 188 catalogued and deliberately **not** fetched in pull-request CI. `.github/workflows/external-links.yml` fetches every one of them monthly and on demand, with `bun run content:links:external`. Keeping third-party servers out of the deterministic path is correct: a gate that fails because someone else's host is down teaches people to re-run it rather than read it. |
| Redirect chains | An alias takes two permanent hops — `/annihilationism` → `/annihilationism/` → `/topics/annihilationism/` — because `trailingSlash: true` normalises before the alias table matches. Asserted deliberately in `smoke.spec.ts`. Removing the hop would mean `skipTrailingSlashRedirect` and hand-rolled normalisation, which is what the entire canonical contract rests on; two 308s on a hand-shared alias is well inside what crawlers follow. Considered and kept. |

---

## Rejected, with evidence

| Recommendation | Why rejected |
| --- | --- |
| Add `image` to `Article` | Google: "Use images that are relevant to the article, rather than logos or captions." The only image this site has is a generated Open Graph title card — a caption by any reading — and 1200×630 is none of the recommended 16:9, 4:3 or 1:1 ratios. Filling the field would mean generating imagery for a text-driven reference site to satisfy a field, which §27 forbids. |
| Add `llms.txt` | Google Search ignores it. No specific non-Google consumer has been identified for this site, and its absence is not a defect. |
| Add FAQ / HowTo / Speakable schema | The visible pages are not in those formats. Marking ordinary prose as an FAQ to chase a rich result is exactly what Google's structured-data policies prohibit. |
| Add `ProfilePage` to `/about/` | The page is about the site *and* its author — method, purpose, independence, contact — not a person profile. |
| Add `Organization` schema | No organization exists. See SEO-02. |
| Enforce 50–60 character titles / 150–160 character descriptions | Google has no fixed maximum for either and rewrites both by context and device. Uniqueness and accuracy are gated instead; length is a review signal, not a pass/fail. |
| Add IndexNow | A low-frequency editorial site with no chosen deployment target yet. Its absence is not a defect. |
| Add image or video sitemap extensions | The site has no content images, and the one video already has valid `VideoObject` markup on a real watch page. |
| Add `crawl-delay` | Unsupported by Google, and there is no crawl-budget problem on 120 static pages. |
| Rewrite the case into 100–200-word answer blocks | Would destroy the cumulative argument the site exists to make. §8 forbids it and so does the site's own purpose. |

---

## External verification required

Genuinely external — each needs ownership, credentials, elapsed indexing time or
human editorial authority. None is deferred code work.

1. **The production domain.** Apex or `www` is unchosen and unregistered. Until
   it exists there is no production origin, no Search Console property, and no
   field data. The build fails loudly rather than guessing, which is the correct
   state for a site that has not been given a name.
2. **Search Console.** Property verification, sitemap submission and URL
   inspection all require the domain above. The checklist is in
   `docs/seo/SEARCH-OPERATIONS.md`.
3. **Field Core Web Vitals.** CrUX needs real traffic. Lab measurements are
   recorded in the implementation report and are labelled as lab.
4. **Deployed preview headers.** `X-Robots-Tag: noindex, nofollow` and the
   preview `robots.txt` are unit-tested and can be re-verified in one command
   against a real deployment (`bun run test:preview`), but no preview is
   deployed at audit time.
5. **AI crawler policy.** `robots.txt` currently allows every crawler except on
   `/api/`. Whether to distinguish search indexing, AI-search retrieval and
   model training is a rights decision belonging to the site owner, not a
   defect. It is written up as an owner decision, not implemented unilaterally.
6. **Specialist theological review.** Sections carrying a review-pending label
   keep it. Nothing was relabelled to look more authoritative.

## Stability

The three tests that appeared flaky in a local all-projects run were re-run as a
burn-in with **retries disabled**: 181 tests, 0 failures, 1.4 minutes. The
original flakes — and 92 hard failures in the same run — were
`net::ERR_CONNECTION_REFUSED`: the single `next start` process died partway
through, because `bun run ci` drives all ten Playwright projects at one server.
CI runs `validate`, `test:e2e` and `test:a11y` as separate steps and is green.
No retry is hiding a real failure.

## What was deliberately not touched

No route, permanent identifier (`P00`, `RB1`–`RB3`, `S01`–`S34`, `APP1`,
`APP2`), fragment, section ordering, Scripture text, quotation, citation,
footnote, revision record or review label was changed. No page was created,
merged or deleted. No design token, font, colour or motion value was altered.
No third-party script was introduced. The only prose edited anywhere on the site
is two sentences on `/privacy/`, rewritten to remove em dashes without changing
a single claim.
