# Production-readiness QA

The final review before launch: what was inspected, what was wrong, what was
done about it, and what is still not this repository's to decide.

The companion document is [Launch runbook](launch-runbook.md), which is the
procedure. This one is the record.

**Status: no-go, on two external decisions.** Every code-level finding is
closed. The site cannot launch until someone chooses a domain and provisions a
store for reader corrections, and neither is something code can do. See
[External launch decisions](#external-launch-decisions).

## How this was done

Nothing here was taken on trust, including the previous audits. The baseline
was re-measured from a clean install before anything was changed, and every
count in this document was recomputed from the final tree.

That mattered immediately. The launch candidate claimed 1,249 tests and zero
failures; the first full browser run on this machine produced **nine failures
and three flakes**. All twelve turned out to be one defect in the test
infrastructure rather than twelve in the product — see **INFRA-1** — but a
green run reported from elsewhere would not have found it, and the nine
failures read exactly like product defects.

Fourteen independent read-only sweeps then went over the tree: build and
environment, feedback persistence, security and privacy, Vitest coverage,
Playwright architecture, accessibility, SEO, search, content integrity,
performance, resilience, CI and supply chain, documentation accuracy, and
Next 16 conformance. They produced 111 raw candidates. Twelve of the
behavioural ones — the claims where being wrong would have meant changing
something that was already correct — went to independent verification with
instructions to refute rather than confirm. Two were refuted outright and five
had their severity or scope corrected.

## Findings

Severity is user and launch impact, not effort: **P0** blocks a launch,
**P1** is a major defect, **P2** is a meaningful production-quality gap,
**P3** is polish.

### P0 — launch blockers

#### P0-1 · The canonical origin could silently be localhost

*Deployment configuration · `src/lib/site-config.ts` · Implemented and verified*

`resolveSiteUrl` fell back to `http://localhost:3210` unconditionally, so a
production build that forgot one variable was wrong everywhere at once and
nothing failed.

Measured on the build in the tree at the time: **604 output files** carried
the localhost origin, including every one of the 119 canonical links, all 118
sitemap `<loc>` entries, `Host` and `Sitemap` in `robots.txt`, every Open Graph
URL, the address printed on all three downloads, and the destination encoded in
the printed handout's QR code. A site in that state is un-indexable, its social
cards never resolve, and its printed QR code goes nowhere. Because the value is
baked at build time, setting the variable on a running server afterwards fixes
none of it.

Reproduction: `bunx next build` with no environment, then
`grep -rl 'localhost:3210' .next/server/app | wc -l`.

**Correction.** The resolver moved to `src/lib/site-url.ts` as a pure function
of its environment and now refuses to guess: a build either names the canonical
origin or declares itself a localhost build via
`NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL`. There is no third state. It also
rejects a path component, a query, a fragment, embedded credentials, a
non-`http` scheme, and plain `http` for a release. `next.config.ts` calls the
same function, so the header policy and the canonical URLs cannot disagree
about what the build is.

**Alternatives considered.** Warning instead of failing was rejected: a warning
in a build log is exactly what nobody reads before a deploy. Defaulting to a
placeholder domain was rejected for the same reason it is wrong today — a
plausible-looking wrong answer is worse than a refusal.

**Coverage.** 19 unit tests over every branch, and
`scripts/conditional-immortality/canonical-check.ts` in `validate`, which
proves the resolved origin is the one that actually reached the output in every
canonical tag, Open Graph URL, sitemap entry and robots directive. Verified red
against a mismatched origin (443 problems, exit 1) and green against a correct
one.

#### P0-2 · A published citation resolved to the private working document

*Privacy, rights · `packages/ci-content/src/sources/sources.ts` · Implemented and verified*

`/sources/`, the downloadable bibliography and the public search index all
carried `https://tinyurl.com/ECTvsCI`. It 301s to a Google Doc — the working
document that `docs/rights-audit.md` withholds because "it opens with a
personal email address and phone number" and "contains 30 private editorial
comments by named third parties who did not consent to publication".

Reproduction: `curl -sI https://tinyurl.com/ECTvsCI` returns
`301 → https://docs.google.com/document/d/1Q_EU…`.

The record was `citedBy: []` — it cited nothing — so the short link served no
reader and leaked the document to any of them.

**Correction.** The URL is removed; the record and its note stay, so the source
count is unchanged and the fact that a short link existed and was retired is
still on the page. A registry test now rejects any source URL on a shortener or
a shared-drive host, on the general ground that a published citation whose
destination the registry cannot show has not been reviewed.

#### P0-3 · Unconsented third-party correspondence in a public repository

*Privacy · `private/source/` · Implemented in code; history purge is external*

The same thirty comments — three named people, dates, full text — were
committed to a public GitHub repository in `source-comments.json`,
`source-elements.json` and `source-text-redacted.md`. The rights audit's
reasoning had been applied to the website and not to the repository, and
`pii-scan.ts` was told by name to skip two of the three files.

**Correction.** All three untracked and ignored. They are outputs of
`bun run source:import`; nothing in the build, the validation chain or any test
reads them. `pii-scan.ts` now fails if one is ever tracked again — verified red
before the fix, green after. It also stopped skipping `.body` files, which is
the whole of `robots.txt`, `sitemap.xml`, the search index and all three
downloads: 1,753 files were being scanned and 1,778 are now.

**What this does not do.** Removing a file from `HEAD` does not remove it from
a public repository's history. That is recorded as **EXT-3**.

#### P0-4 · Feedback persistence was unsafe on any topology but one

*Data loss · `src/app/api/feedback/route.ts` · Implemented and verified*

The site's only write appended to a directory under `process.cwd()`. On a
persistent server with a real volume that is correct. On anything serverless,
containerised or multi-instance it is either a hard failure (read-only
filesystem) or silent loss (an ephemeral one). No code can tell the two apart:
a volume that survives a redeploy and one that evaporates behave identically to
`appendFile`. No deployment target has been chosen, so both were live
possibilities. The endpoint also had **no tests at all**.

**Correction.** Three stores behind one interface, chosen by configuration:

- `filesystem` — the default. In production it additionally requires
  `FEEDBACK_STORE_DURABLE=1`, which is an operator asserting the volume
  outlives the process, and an absolute path, because `cwd` is the host's
  choice and moves between a build step and a running server.
- `http` — POSTs each record to an endpoint the operator owns, with a five
  second timeout. The only durable option that ties the site to no vendor and
  adds no dependency.
- `memory` — tests, and refused in production by name.

A configuration that does not resolve answers **503 and says nothing was
stored**, rather than accepting a correction and dropping it. It does not
throw, so one wrong variable cannot take the other 129 pages down with it.

**Alternatives considered.** Adding a database client was rejected: it would
commit the project to a vendor before it has chosen a host, and add a
dependency for a form that receives a handful of submissions. Emailing the
record was rejected because the privacy design forbids the message body leaving
in a notification. Silently degrading to `/tmp` was rejected as the exact
failure being fixed.

**Coverage.** 60 tests across config, stores and handler: every refusal, the
honeypot answering identically to a success, a blocked store, a store that
fails mid-write, concurrent appends, month-boundary filing, and four sentinel
strings proving no message, name, email or source URL reaches a log line or a
response body.

### P1 — major defects

#### P1-1 · The rate limiter was not a rate limiter

*Security · `src/lib/rate-limit.ts` · Implemented and verified*

`clientAddress` read the **first** `X-Forwarded-For` entry, which is whatever
the client typed. A new leftmost address per request is a new bucket per
request, so the window was never met and the site's only write endpoint was an
unbounded write target for anyone who noticed.

**Correction.** It reads the entry the nearest trusted proxy appended, counted
from the right, with the hop count configured because it is a property of the
host (`FEEDBACK_TRUSTED_PROXY_HOPS`, default 1; 0 means nothing is in front and
no forwarding header is believed). Eleven tests, including one that forges a
chain and proves the key does not move.

#### P1-2 · No request body cap

*Security · Implemented and verified*

The entire body was buffered before validation, and the limiter did not run
until after that. A 64 KiB cap is now applied on the declared `Content-Length`
and again while reading the stream, because the header is a claim. Two tests,
one of them lying about its length.

#### P1-3 · Every form control failed WCAG 2.2 SC 1.4.11

*Accessibility · `src/app/globals.css` · Implemented and verified*

All twelve author-styled inputs, textareas and selects drew their only boundary
at **2.04:1** (`--color-border-strong` on `--color-paper-raised`) or **1.45:1**
(`--color-border` on `--color-paper`), against a required 3:1. Their fill
differs from the surround by 1.08:1, so the border was the only thing
identifying them, and because border-colour, background and radius are all
authored the "determined by the user agent" exception does not apply.

axe-core 4.12.1 has no non-text-contrast rule — only the text-only
`color-contrast` — so the accessibility gate was green and would have stayed
green.

**Correction.** A new `--color-border-control` takes the same warm grey deeper
until it clears 3:1 on every surface a control sits on: 3.71:1 on paper,
4.01:1 on paper-raised, 3.37:1 on panel, 3.02:1 on panel-strong. Structural
borders are untouched — 1.4.11 governs components and states, not decoration,
and darkening a card edge would change the look of the whole site to fix
something it is not part of.

**Coverage.** `form-control-contrast.test.ts` recomputes the ratios from the
tokens in `globals.css` rather than restating them, asserts the twelve controls
all use the token, and asserts the count is twelve so the check cannot pass
vacuously. Verified red by reverting one control.

#### P1-4 · A submission made without scripting produced no receipt

*Resilience, accessibility · Implemented and verified*

The success and failure banners were rendered by a client component reading
`?submitted=`, which is the one place a reader with no scripting can never see
them. `/corrections/` is statically prerendered, so a no-JS reader was returned
to an apparently untouched empty form whether their correction had been
recorded or not.

**Correction.** The endpoint redirects to a fragment and `/corrections/`
renders both receipts in static markup, revealed by `:target`, focusable so the
fragment navigation announces them. With scripting on the form posts with
`fetch` and never navigates, so neither fragment is reached and the form's own
status region remains the only message.

#### P1-5 · No error boundaries

*Resilience · Implemented and verified*

An uncaught render error served Next's built-in page: no `lang`, no landmark,
its own dark-mode styling, and no way out. `error.tsx` and `global-error.tsx`
now offer a retry and two routes, and log the digest only.

#### P1-6 · `qr.ts` had no test

*Correctness · Implemented and verified*

666 lines of hand-written Reed-Solomon, masking and bit placement behind the QR
code on the printed handout — an artefact whose failure a reader discovers by
pointing a phone at a piece of paper. Its header lists five correctness checks
including a round trip through "an independently written decoder"; none was in
the repository, so none was reproducible.

**Correction.** That decoder is now in the suite. It reads the format bits,
unmasks, walks the zigzag, de-interleaves the blocks and parses the payload
back to text for eight payloads including multi-byte ones; checks every block
at every version 1–10 against Reed-Solomon syndromes computed from a separately
written GF(256), with a corruption case proving the check is not vacuous; and
verifies the capacity table, the format bits, the finder and timing patterns
and the dark module.

The encoder is correct. The ISO/IEC 18004 Annex I vector reproduces exactly
(`A5 24 D4 C1 ED 36 C7 87 2C 55`). The finding was the absence of the test, not
a defect in the code.

#### P1-7 · The privacy page made a false claim

*Privacy, content integrity · Implemented and verified*

"No query is transmitted anywhere, not to this site and not to anyone else."
The header search box does match in the browser and transmits nothing — but
`/search/` is a server-rendered page whose query is part of its address, and it
is the only search a reader without scripting has.

**Correction.** The page says both things plainly, and says which to use if a
query must never leave the device. The implementation is unchanged: making
`/search/` client-only would break the no-scripting path, which is a contract,
and the honest fix for a false sentence is a true sentence.

#### P1-8 · No coverage measurement anywhere

*Test system · Implemented and verified*

No provider, no script, no threshold. See [Coverage](#coverage).

### P2 — production-quality gaps

#### INFRA-1 · The browser suite could silently measure the wrong build

*Test infrastructure · Implemented and verified*

The suite served its production build on a hard-coded port. During this review
a second checkout of the repository was testing at the same time, and the run
bound to — or was answered by — the other checkout's server. It reported nine
failures that described **that** build: hashed chunk names the lazy-boundary
tests could not match, dialog markup the excerpt tests could not find. Every
one looked like a product defect. None was; all forty passed in isolation.

This is the most dangerous class of test failure, because a wrong answer that
looks like a finding costs more than no answer.

**Correction.** `PLAYWRIGHT_PORT` overrides the port, and the Pretext harness
and the feedback store are keyed to it so two runs cannot share either. Every
project depends on a `served-build` guard that refuses to start unless the
server is serving this checkout's `.next/BUILD_ID`. Verified in both
directions: green against its own build, and a named, actionable failure
against anything else.

#### Other P2 findings, all implemented and verified

| # | Finding | Correction |
|---|---|---|
| P2-1 | Print deleted the body of every closed disclosure. `::details-content` is a user-agent pseudo-element the `display: revert` on children cannot reach; measured under print emulation, all three engines printed the summary and nothing else — the opposite of what `/accessibility/` says | `content-visibility: visible` on the pseudo-element, plus a **rendered** print test. The old check asserted the CSS text, which proves rules exist, not that content reaches paper |
| P2-2 | The external-destination print rule was scoped to `.prose-article`. Measured across all 118 routes, that selector matched **zero** of the site's 278 external links, so the accessibility statement's promise was true of no page | Scoped to `main`, where the citations actually are |
| P2-3 | `<Cite>` failed SC 2.5.3 Label in Name: the visible "[Dear, page 76]" appeared nowhere in the accessible name | The name begins with the visible marker; the full citation still follows |
| P2-4 | No security-header test anywhere — the whole CSP and header block was computed and never read back off a response | Asserted on the wire, in a spec that also runs against a deployed origin |
| P2-5 | No HSTS, and no `X-Robots-Tag` for previews | Both added, gated on the resolved origin being HTTPS and on `SITE_ENV`/`VERCEL_ENV` |
| P2-6 | `VERCEL_ENV` and the origin variables changed build output but were not in the Turborepo cache key, so a cached **preview** build could be restored as production — with `Disallow: /` in it | Six variables added to the `build` task's `env` |
| P2-7 | No deployed-preview mode: the suite could only test a locally started server | `PLAYWRIGHT_BASE_URL`, a `preview` project, and `bun run test:preview` that starts no local server |
| P2-8 | No visual regression of any kind | Thirteen surfaces, pinned engine/viewport/scale/motion, Linux baselines produced in the same image CI compares in |
| P2-9 | The rendered route sweep covered 31 hand-picked routes | `route-sweep.spec.ts` drives all 120 public routes from the sitemap at five viewports |
| P2-10 | No Origin or `Sec-Fetch-Site` check on the only write endpoint | Added, with `curl` deliberately still allowed: the endpoint has no session to borrow, so this is spam hygiene, not CSRF defence |
| P2-11 | Malformed JSON answered 415 | 400. The content type was supported; the body was not |
| P2-12 | The eleven build scripts belonged to no tsconfig, and `tests/e2e` was excluded from the app's — nine Playwright files and every gate script had never been typechecked | Two tsconfigs, wired into `typecheck`. The first run found a real defect: see P2-13 |
| P2-13 | `reducedMotion` is not a top-level test option in Playwright 1.62 — it lives under `contextOptions`, and a top-level key is accepted and ignored. The first visual baselines had been taken with animation enabled | Moved to where it is read; baselines regenerated and proved stable against themselves |
| P2-14 | `images.remotePatterns` allowed `i.ytimg.com` for a `next/image` the repository does not contain, opening `/_next/image` as a fetch-and-re-encode proxy | Removed |
| P2-15 | The six self-hosted faces were served with `max-age=0`, revalidated on every navigation | `immutable`, one year. Their subsets are already frozen by `supported-text.ts` |
| P2-16 | The three downloads and the search index are complete duplicates of indexed pages, crawlable with no `X-Robots-Tag` | `noindex`, still fully reachable |
| P2-17 | CI actions pinned to mutable major tags; `persist-credentials` left on; no Dependabot | SHAs verified against the legitimate repositories with the release in a comment; credentials off; Dependabot for both ecosystems |
| P2-18 | CI installed Playwright browsers with `playwright@latest`, outside the frozen lockfile | `bunx playwright`, which resolves the pinned version |
| P2-19 | `cancel-in-progress` applied to `main`, so a merge could be cancelled by the next merge and leave the default branch with no completed gate | Off for `main` only |
| P2-20 | The drift gate used `git diff`, which cannot see a generated file that is **new** rather than modified | `git status --porcelain` |
| P2-21 | No external-link audit, and no gate ever fetched a citation | `external-link-audit.ts`, monthly and on demand, deliberately **not** in CI |
| P2-22 | `bundle-budget.ts` had no absolute ceiling: uniform growth raises the median with it and nothing fails | A hard ceiling, and per-route allowances expressed over the median rather than as absolute numbers |
| P2-23 | The correction form sent two POSTs on a double press | An in-flight guard in the handler. The button stays enabled: a control that cannot be pressed tells a reader nothing |
| P2-24 | No favicon or app icon; every page load 404'd on `/favicon.ico` | `app/icon.svg`, the existing wordmark at icon scale |
| P2-25 | The privacy page promised deletion on request and timed retention, and nothing in the repository could perform either | Runbook §8: read, export, delete-by-email, delete-by-id, retention |
| P2-26 | No runbook, no rollback procedure, no host requirements | `docs/launch-runbook.md` |
| P2-27 | No `.env.example`; the maintenance guide's variable table listed three of the twelve variables that change production behaviour | `.env.example` with every variable, what breaks without it, and no credential |

### P3 — polish, implemented

`rethinkinghell.com` published as plain `http` when it answers on `https` and
301s there anyway; Node pinned in `engines`; the `Refresh`-header trailing-slash
normalisation documented as carrying no policy (it has no body and nothing to
protect); the two-hop alias redirect chain documented and pinned by a test.

### Rejected, with evidence

| Candidate | Why it was rejected |
|---|---|
| `/og` is "uncached, unthrottled, with an attacker-controlled cache key", 127 images re-rendered per crawl | **Refuted.** The route sets `cache-control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` and it reaches the client unmodified. "127" is the count of prerendered pages, not of OG URLs. Satori escapes text, so no injection is possible. The proposed fix — restricting titles to a registry allowlist — would silently break real social cards for the 28 `pageMetadata` call sites that pass hand-written titles |
| "Metric-similar font fallback that does not exist" | **Refuted as stated.** No metric-adjusted fallback is declared, which is a restatement of the neighbouring finding rather than an independent one. The cache header, which was real, is fixed as P2-15 |
| "With scripting off, four primary destinations are unreachable below 1280px" | **Partly refuted.** The structural facts hold, but "unreachable" is false: the home link is in the global chrome on every page and the home page indexes all four. What was true was four stale comments claiming the footer mirrors the primary nav; corrected in place |
| The text-geometry gate "can silently disable itself and still report green" | **Partly refuted.** The conditional branch asserts a second, real contract rather than nothing, and checks it against production's own runtime self-check. Non-zero-case guards were added so the iteration cannot become vacuous, but the gate was not broken |
| `/full-case/` ships 1.82 MB of HTML with duplicated RSC flight payload | **Confirmed as a measurement, rejected as a defect.** The flight duplication is structural to React Server Components and Next exposes no flag to suppress it; the page is a deliberate read-it-all edition and is `noindex`. What was actionable — speculative prefetch of that payload from five link sites — is a separate item |
| Remove `@tanstack/react-table`, which has no imports | **Deferred, not rejected.** It is genuinely unreferenced, but removing a dependency changes the lockfile and the shared graph, and this branch is already large. Recorded for the next dependency pass rather than smuggled into a QA PR |
| Search index `builtAt` breaks reproducibility | **Partly refuted.** It is date-only, so two builds on the same UTC day are already identical. Real but P3, and touching the index generator risks the ranking baseline this PR must not move |

## Coverage

Measured with V8 — Vitest runs its workers on Node here even though the runner
is invoked through Bun, so V8 coverage is available and accurate, and Istanbul
would add a Babel pass for nothing.

`include` is explicit. Without it a provider only reports files a test happened
to import, so a module with **no** test does not appear as 0% — it does not
appear, and the number rises as coverage falls.

| Package | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `apps/conditional-immortality` | 66.2% | 57.2% | 50.4% | 67.3% |
| `packages/ci-content-schema` | 94.1% | 89.7% | 100% | 98.5% |
| `packages/ci-content` | 71.1% | 61.3% | 66.1% | 76.6% |
| `packages/ci-search` | 95.6% | 89.7% | 100% | 97.8% |

The app's global figure keeps 29 components in the denominator on purpose.
Excluding them would lift it about twenty points while measuring less. What
they have instead is a browser: 120 routes rendered at five viewports, axe at
two, thirteen screenshots, and the reading, motion and search specs driving
their real interactions. jsdom copies would be weaker oracles for the same
claims.

Where unit coverage is the right tool, the floors are strict:

| Module | Lines | Branches |
|---|---|---|
| `src/lib/site-url.ts` | 100% | 100% |
| `src/lib/feedback/**` | 98.1% (floor 95) | 93.0% (floor 88) |
| `src/lib/qr.ts` | 99.6% (floor 98) | 92.6% (floor 90) |
| `src/lib/rate-limit.ts` | 84.2% (floor 83) | 89.3% (floor 87) |
| `src/lib/text-layout/**` | 85.8% (floor 84) | 74.8% (floor 72) |

App line coverage went from 50.5% to 67.3% over this pass, entirely from tests
that pin behaviour rather than from exclusions.

## Test counts, from the final tree

**Unit and component: 930** across 34 files — 478 app, 336 search, 65 content,
51 content-schema. Was 808.

**Browser: 570 across eleven projects.**

| Project | Tests | What it is for |
|---|---|---|
| `served-build` | 1 | Refuses to run the suite against a foreign build |
| `chromium-desktop` | 185 | Full suite at 1440×900 |
| `chromium-mobile` | 185 | Full suite at 375×812 with touch |
| `accessibility` | 32 | axe + structure, desktop |
| `accessibility-mobile` | 32 | axe + structure, mobile |
| `firefox-smoke` | 22 | Critical flows and headers, Gecko |
| `webkit-smoke` | 22 | Critical flows and headers, Playwright WebKit |
| `geometry-chromium` | 23 | Pretext line-break contract |
| `geometry-firefox` | 23 | Same, Gecko |
| `geometry-webkit` | 23 | Same, Playwright WebKit |
| `visual` | 13 | Screenshot comparison |
| `preview` | 22 | The same smoke set against a deployed origin |

`webkit-smoke` and `geometry-webkit` are Playwright's WebKit build. Neither is
Safari and neither is described as Safari; the manual Safari procedure is in
[Pretext and text geometry](pretext-text-geometry.md).

## What was measured, not assumed

| Claim | Measured |
|---|---|
| Prerendered HTML pages | 121 (119 with canonicals, plus `_not-found` and `_global-error`, which correctly have none) |
| Sitemap entries | 118 |
| Pages the link checker walks | 121, 9,543 internal links, 0 broken, 0 duplicate ids |
| External links published | 31 distinct; all 31 answered; 6 redirect; 1 plain-http host with no TLS available |
| Median first-load JS | 591.2 kB uncompressed |
| Largest route | 667.5 kB (`/corrections`, TanStack Form) |
| Search index | 624 kB, fetched once on search intent |
| Third-party requests before video activation | 0 |

## External launch decisions

These are not code, and none of them is marked done.

**EXT-1 · The canonical domain.** Nobody has chosen one. The build now refuses
to proceed without it rather than inventing `localhost`, so this is a hard
blocker by design. Apex versus `www` must be settled before the first release
build: every canonical URL, every sitemap entry and the printed QR code carry
it, and changing it later is a rebuild.

**EXT-2 · A durable store for reader corrections.** The architecture is done
and tested; the provisioning is not. Until `FEEDBACK_STORE` and its companions
are set, the endpoint answers 503 and tells the reader nothing was stored —
correct behaviour, and not a launched state. Runbook §3 has the decision and
the checklist.

**EXT-3 · Purging the private artefacts from public git history.** P0-3 removed
three files from `HEAD`. Their contents remain in the history of a public
repository, and rewriting that history is destructive, outward-facing, and the
owner's call. It requires a history rewrite plus a force-push, contacting
GitHub Support to purge cached views, and a decision about whether to tell the
three named people. Nothing in this branch does any of it.

**EXT-4 · Video description.** Six pages carry `specialist-review-pending` and
S34 carries `revision-needed`; the video's on-screen text is undescribed.
Whether the overview needs audio description or a media alternative for WCAG AA
depends on watching it and judging whether the on-screen text is conveyed in
the audio. That is content work on material this review cannot verify, and
`/accessibility/` is careful to describe itself as testing rather than
conformance, which remains accurate. The flags are untouched.

**EXT-5 · Human theological review.** Unchanged by this pass, and not
this review's to grant.

**EXT-6 · Field Core Web Vitals.** The site has never been served publicly, so
there is no field data and lab numbers are not field numbers. Runbook §9 sets
out reading them from Search Console after launch, which needs no script on the
page and contradicts nothing the privacy page says.

## What was deliberately not changed

The warm-paper palette, Source Serif 4 and Inter in their roles, the
information architecture, every route and permanent section identifier
(`P00`, `RB1`–`RB3`, `S01`–`S34`, `APP1`, `APP2`), fragment behaviour, the
motion doctrine and its tiers, theological wording, Scripture text, citations,
search ranking, search normalisation and Unicode mapping, the migration ledger,
and every review-status flag.

The one token added is `--color-border-control`, and it exists because twelve
controls failed a WCAG AA requirement. No test was disabled, no assertion
weakened, no threshold lowered, and no sweep narrowed.
