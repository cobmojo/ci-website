# Maintenance guide

Everything routine you might need to do, and the command that does it.

## Prerequisites

Bun 1.3 or later. `bun install` at the repository root.

```bash
bun install
```

## The validation gate

One command runs everything CI runs:

```bash
bun run validate
```

That is formatting, lint, typecheck, content validation, the content audit,
the documentation path check, unit tests, the production build, the PII scan,
the link check, the canonical-origin check and the first-load JavaScript
budget, in that order. The last four read the build output, which is why they
come after it.

```bash
bun run qa:production
```

`validate`, then coverage against its thresholds, then `test:browser`:
end-to-end on desktop and mobile, accessibility at both viewports, cross-engine
smoke in Firefox and Playwright WebKit, the text-geometry contract in three
engines, and visual regression. `bun run ci` is the same command.

All of it also runs on every push and pull request through
`.github/workflows/ci.yml`, so a red gate is reported rather than discovered.

Run the pieces individually while working:

```bash
bun run content:validate   # registry integrity, cross-references, MDX rules
bun run content:audit      # migration completeness, regenerates ledger exports
bun run content:pii        # scans built output for source contact details
bun run content:links      # internal links and fragments in built HTML
bun run content:bundle     # first-load JavaScript budget per route
bun run content:docs       # every file path named in prose or a comment exists
bun run content:canonical  # every canonical URL, OG URL and sitemap entry agrees
bun run test:coverage      # coverage, against the thresholds in vitest.coverage.ts
bun run test:visual        # thirteen screenshot comparisons
bun run test:smoke         # the cross-engine set, in Firefox and WebKit

# Outside the gate, because they depend on machines this repository does not own:
bun run content:links:external              # fetches every published citation
PLAYWRIGHT_BASE_URL=… bun run test:preview  # the smoke set against a deployment

bun run test:e2e           # desktop and mobile end-to-end
bun run test:a11y          # axe plus structural accessibility
bun run test:text-geometry # Pretext against real browser layout, three engines
bun run test:interaction   # interaction latency, measured as INP is defined
bun run test:print         # printed output, in all three engines
bun run test:browser       # every browser suite above, in all fourteen projects
```

`content:pii` and `content:links` read the build output, so run `bun run build`
first. The browser suites build it themselves.

## Measuring performance and technical SEO

Deliberately outside the gate. A Lighthouse category score taken on a shared
runner is noise, and a flaky performance gate teaches people to re-run the
build; what the gate holds instead is the deterministic *cause* of each thing
these measure — the prefetch budget, the bundle budget, the interaction
latencies and the indexability matrix, all inside `test:browser` and
`validate`.

Each of these starts its own production server on a port of its own and proves
it is serving the build in `.next` before it says anything about it. Run
`bun run build` first, and run them one at a time: a benchmark sharing a
machine with a test suite is measuring the test suite.

```bash
bun run perf:routes    # the route inventory, and the four sources reconciled
bun run perf:smoke     # one cold audit of each family's worst route, both modes
bun run perf:audit     # one cold audit of every HTML route, both modes, gated
bun run perf:certify   # five cold audits of each family's worst route, gated
bun run seo:matrix     # what all 120 routes say about themselves, on the wire

# Against a real origin, when one exists:
bun run perf:deployed -- --base-url https://example.org
```

Reports land in `reports/`, which is git-ignored. The tracked summary of what
they found is
[Performance and technical SEO](performance-and-technical-seo-report.md); read
it before changing anything in the name of a score, because it records which
hypotheses were tested and reverted and why.

Playwright needs its browsers once per machine:

```bash
bunx playwright install chromium firefox webkit
```

---

## Add or edit a case section

Sections are identified by a permanent id that never changes. Titles, slugs and
routes may be revised; the id may not.

1. Add or edit the entry in `packages/ci-content/src/case/sections.ts`. Every
   field is validated: a thesis under 40 characters, a missing evidence role or
   an unknown related section all fail the build with a message naming the
   section.
2. Write the body at
   `packages/ci-content/case/<id-lowercase>-<slug>.mdx`, or
   `packages/ci-content/appendices/…` for an appendix.
   The body contains no frontmatter and no `<h1>`. It starts at `## In brief`.
3. Read `docs/authoring-brief.md` before writing prose. The rules there are
   enforced: placeholder text, an em dash or an `<h1>` will fail the build.
4. Record the change in `packages/ci-content/src/revisions/revisions.ts` if it
   is substantive, and update `lastSubstantiveRevision`.

```bash
bun run content:validate
```

### Never type Scripture

Write `<Scripture reference="Mark 9:42-48" />`. The component renders verified
public-domain text. If the reference is not in the corpus the build fails and
tells you to add it. Do not work around this by typing the verse.

---

## Add a Scripture passage to the corpus

1. Add the reference to `ADDITIONAL_REFERENCES` in
   `scripts/conditional-immortality/fetch-scripture.ts`.
2. Run it. Books already retrieved are cached, so only new ones are fetched.
3. Commit the regenerated `packages/ci-content/src/scripture/web-text.ts`, and
   empty `ADDITIONAL_REFERENCES` again.

Passages already in the corpus are re-fetched and **checked**, not overwritten.
If the live World English Bible no longer matches what is committed, the script
reports every difference and writes nothing, because changing verified Scripture
is an editorial decision. One narrow exception is recorded in the script: the
feed drops a footnote marker in Mark 9:47 without leaving its space, and the
committed text is right.

---

## Add a key passage page

Only passages with substantial treatment get a page. A passing citation belongs
in the Scripture index, which is generated from the registry automatically.

Add a record to `packages/ci-content/src/passages/passages.ts`. Required prose:
`ectReading` and `conditionalistReading` (both substantial), `agreements` (what
both sides actually accept), and `disagreement` (the single precise point of
divergence). The route appears automatically.

---

## Add a source

Add a record to `packages/ci-content/src/sources/sources.ts` with an
`accessedAt` date and a `rightsStatus`. Then add its id to the `sourceIds` of
every section that cites it. The build checks both directions: a source that
claims to be cited by S04 must appear in S04's list, and vice versa.

Cite it in prose with `<Cite id="…" locator="page 121" />`. Never leave a bare
URL in prose.

---

## Add a topic or glossary term

`packages/ci-content/src/topics/topics.ts` and `…/glossary/glossary.ts`.

Topics carry `distinctions`, which is where Hades, Sheol, Gehenna and the lake
of fire are kept apart from each other and from the English word "hell". Keep
glossary entries to two or three sentences and link to the topic for depth.

---

## Record a revision

Add to `packages/ci-content/src/revisions/revisions.ts`. Entries appear on the
section page, on `/corrections/` and at `/changelog/<id>/`.

Never publish a submitter's identity unless the record carries `creditedTo`,
which requires their explicit consent.

---

## Re-run the source import

Needed when the source document itself changes.

```bash
bun run source:import                    # uses SOURCE_DOCX_PATH or the default
bun run source:import path/to/file.docx  # or pass it explicitly
```

This reads the DOCX package directly, not a converted rendering, and writes the
inventory, the comment extract, the redacted plain-text rendering and the media
into `private/source/`. Personal contact details are redacted from every derived
artefact, and the script verifies the redaction before reporting success. The
raw DOCX is never copied into the repository.

The reported SHA-256 will differ from the one in `siteConfig.sourceDocument`.
Update it, then re-run `bun run content:audit` and reconcile any element that
has lost its destination.

---

## Update the video transcript

The transcript is the author's published caption track, not a reconstruction.

The plain timed-text endpoint no longer serves it — `api/timedtext` answers 200
with an empty body — so the fetch goes through `youtube-transcript-api`, a
Python package. It is the only non-JavaScript dependency in the repository, and
it is needed for this one script and nothing else.

```bash
python -m pip install youtube-transcript-api
bun run scripts/conditional-immortality/import-transcript.ts
```

The script compares what it fetched against the committed cues and reports
whether anything changed before writing. All 279 cues and all 279 timings
currently match the published track exactly, once non-breaking spaces and line
breaks are normalised.

Then adjust chapter boundaries in `packages/ci-content/src/video/index.ts` if
the video changed. Chapters must not overlap, must stay inside the duration and
may only claim a `sectionIds` mapping where the correspondence is exact. The
content validation checks all three.

---

## Rebuild search

Nothing to do. The index is built from the content registries during
`next build` and served as a static asset at `/search-index.json`.

To change ranking, edit the field weights in `packages/ci-search/src/query.ts`.
To add a synonym group, edit `packages/ci-search/src/synonyms.ts`. Both have
tests; run `bun run test` in `packages/ci-search`.

Ranking is pinned by a snapshot. `src/__tests__/ranking-baseline.json` records
what thirty real queries returned against the real content index — totals,
order, scores, matched fields and terms. A deliberate ranking change means
regenerating it in the same commit and saying why; an accidental one fails the
suite, which is the point.

---

## Work on the fitted search excerpt

The quick-search dialog fits its excerpts to an exact line budget using
Pretext. Read `docs/pretext-text-geometry.md` before changing any of it. The
short version:

- The measured typography lives in one class, `.quick-search-excerpt`, in
  `globals.css`. Changing a declaration there changes what Pretext is told;
  the geometry suite will tell you if the two stop agreeing.
- `apps/conditional-immortality/src/lib/text-layout/supported-text.ts` decides
  what may be measured. Widening it is a font change first: add the subset to
  `globals.css`, add the range there, add corpus cases, then run the suite.
- `bun run test:text-geometry` is the gate, and it is also the gate for
  upgrading Pretext. Never upgrade from `main`.

The typography corpus the contract is proved against is in
`apps/conditional-immortality/tests/fixtures/typography-corpus.ts`. Its approved
half must agree with the browser exactly; its fallback half must be declined
with the documented reason. Do not move a case from the second half to the first
to make a run go green.

---

## Review feedback

Submissions are appended as JSON lines under `FEEDBACK_STORE_DIR`, defaulting to
`.feedback-store/`, which is git-ignored.

The message body, name and email are never written to logs. Rate limiting is
per-IP and in-memory; if the site is ever deployed across multiple instances,
replace `src/lib/rate-limit.ts` with a shared store.

To publish an accepted correction, add a revision record and reference the
submission id in `sourceSubmissionId`.

---

## Publish a correction

1. Fix the content.
2. Add a revision record with `issue`, `decision` and a `summary`.
3. Update `lastSubstantiveRevision` on the section.
4. `bun run validate`.

The correction appears on the section page, on `/corrections/` and in the
per-section changelog automatically.

---

## Configuration

Local work needs nothing: `bun run dev` and the `validate` chain set the one
variable they need themselves. A **release build** is different, and refuses to
proceed until it is told what it is building.

| Variable | Required | Effect if unset |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | for a release | The build **fails**. It no longer falls back to localhost: a build that guessed was wrong in 604 output files at once, and nothing failed. |
| `NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL` | for a local build | Same failure. Set by `dev`, `validate` and the browser suites. |
| `SITE_ENV` | for a preview | A preview is indexable and competes with production. |
| `FEEDBACK_STORE` | no | Defaults to `filesystem`. |
| `FEEDBACK_STORE_DIR` | filesystem | Submissions go to `.feedback-store/`. Must be absolute in production. |
| `FEEDBACK_STORE_DURABLE` | filesystem, in production | The endpoint answers 503 and says nothing was stored. |
| `FEEDBACK_STORE_URL` | http | The endpoint answers 503. |
| `FEEDBACK_STORE_TOKEN` | http, if required | The collector rejects the write. |
| `FEEDBACK_TRUSTED_PROXY_HOPS` | no | Defaults to 1, which is the shape of every managed host. |
| `FEEDBACK_NOTIFY_EMAIL` | no | No notification line is logged. Submissions are still stored. |

[`.env.example`](../.env.example) carries the same list with the reasoning, and
[Launch runbook](launch-runbook.md) has the deployment procedure that uses it.

---

## Things that will fail the build, by design

- A missing or duplicated permanent section id
- A duplicated slug or route, or a broken canonical order
- A related section, source, topic or revision pointing at something that does not exist
- A Scripture reference that cannot be normalised, or is absent from the corpus
- A quotation without translation or rights metadata
- A page without a thesis or a short summary
- An MDX body with frontmatter, an `<h1>`, an em dash or placeholder text
- A substantive source element with no destination in the migration ledger
- The source email address or phone number anywhere in built output
- A broken internal link or a fragment that does not exist on its target page
- S17 and S18 reverting to the source document's table-of-contents order

None of these should be suppressed. If one fires, the content is wrong.
