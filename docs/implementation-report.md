# Implementation report

The Case for Conditional Immortality. Built 29 July 2026.

## Where the site lives

```
apps/conditional-immortality/     the Next.js application
packages/ci-content-schema/       Zod models, Bible reference parser
packages/ci-content/              the content registries and MDX bodies
packages/ci-search/               search index builder and ranker
packages/ui/                      shared primitives
scripts/conditional-immortality/  import, validation and audit tooling
docs/                             this and the other reports
private/source/                   redacted source archive, not published
```

## Stack

Turborepo with Bun workspaces. Next.js 16 App Router, React 19, Tailwind 4,
TypeScript 5.9, Biome for lint and format, Vitest for unit tests, Playwright
with axe-core for end-to-end and accessibility.

The repository did not exist before this work, so there were no prior
conventions to follow. The structure above is the one the brief suggested,
adopted because it cleanly separates content from presentation.

## Architecture decisions

**Content lives in version-controlled files, not a CMS.** Prose is MDX; metadata
is typed TypeScript validated by Zod at build time. TypeScript rather than YAML
for structured data, because a wrong section id then fails compilation as well
as validation.

**One registry drives everything.** `caseSections` produces the routes, the
navigation, previous and next links, the case map, the full continuous edition,
the sitemap and the search index. No component re-declares the list.

**Permanent identifiers.** `P00`, `RB1`-`RB3`, `S01`-`S34`, `APP1`, `APP2` never
change. Titles, slugs and routes may be revised freely; the changelog, reading
progress and every cross-reference key off the id.

**Server components by default.** An article page ships no client JavaScript for
its prose. The only client components are the mobile navigation sheet, the
search dialog, the click-to-load video, the feedback form, reading progress, the
print button, two progressive-enhancement filters, and two leaves in the shell:
the primary navigation item, which reads the path to mark the current page, and
the smooth-anchor scroller, which renders nothing at all. Every one degrades to
working markup with scripting disabled. The text-layout runtime the search
dialog uses is in a chunk of its own that an article page never requests; an
end-to-end test finds that chunk in the production output and proves it.

**Scripture is rendered, never typed.** This is the decision I would defend
hardest. 197 passages of the public-domain World English Bible are stored in a
generated corpus. `<Scripture reference="Mark 9:42-48" />` takes only a
reference. An author cannot misquote a verse, and an unknown reference fails the
build. It also keeps a reference work of this size clear of modern-translation
licensing. See `docs/rights-audit.md`.

**Search runs in the browser.** The index is built from the registries at build
time and served as a static asset. No query leaves the reader's machine and
there is no hosted search service to depend on. Ranking is a plain weighted
scorer over title, id, summary, headings, Scripture references, body,
transcript and notes, with synonym expansion at reduced weight.

**Matches are mapped back to the source, not guessed at.** Search normalises
text — lowercasing, NFKD, quote and dash folding, whitespace collapsing — and
then has to show the reader the original. An offset into one is not an offset
into the other, so `@ci/search` carries a chunk map between the two and
guarantees every highlight boundary lands on a grapheme cluster boundary.

**The search dialog fits its excerpts, and can decline to.** Pretext predicts
where lines will break so a quick-search excerpt lands on an exact two- or
three-line budget. It is loaded only after a reader shows search intent, it
never delays a result, and it switches itself off whenever the font, the browser
or the text is outside a deliberately narrow supported contract. The reader then
sees the ordinary excerpt and no error. The full decision, the supported
contract and the browser evidence are in `docs/pretext-text-geometry.md`.

## Routes

129 pages generated. Landing and orientation: `/`, `/start/` and its three
children, `/case/`, `/objections/`, `/passages/`, `/scripture/`, `/topics/`,
`/glossary/`, `/sources/`, `/watch/`, `/full-case/`, `/method/`, `/about/`,
`/corrections/`, `/changelog/`, `/original-document/`, `/download/`,
`/accessibility/`, `/privacy/`, `/search/`, 404.

Generated: 40 section pages under `/case/`, `/objections/` and `/appendix/`;
18 passage pages; 27 topic pages; 12 per-section changelog pages.

Handlers: `/search-index.json`, `/download/transcript.txt`,
`/download/bibliography.txt`, `/download/handout.html`, `/sitemap.xml`,
`/robots.txt`, `/og`, `POST /api/feedback`.

21 redirects cover the paths readers guess (`/annihilationism`, `/ect-vs-ci`,
`/conditional-immortality` and so on). No thin duplicate pages were created.

## Feedback

`POST /api/feedback/` validates server-side with the same Zod schema the client
uses, rate limits per IP, and appends a JSON line under `FEEDBACK_STORE_DIR`.
Persistence happens **before** any notification. The message body, name and
email are never logged. A filled honeypot returns an ordinary success response
and stores nothing. The form posts normally without JavaScript.

No external service is required. With `FEEDBACK_NOTIFY_EMAIL` unset, no
notification is attempted and submissions are still recorded.

## Testing

1,258 tests, all passing.

| Suite | Count |
|---|---|
| Unit, `@ci/content-schema` | 51 |
| Unit, `@ci/content` | 64 |
| Unit, `@ci/search` | 336 |
| Unit and component, `conditional-immortality` | 364 |
| End-to-end, desktop and mobile | 310 |
| Accessibility, axe plus structural, desktop and mobile viewports | 64 |
| Text geometry, Chromium, Firefox and WebKit | 69 |

Plus seven gates that fail the build: content validation, the content audit,
the documentation path check, the PII scan, the link check, the first-load
JavaScript budget and the production build itself. All of them, and all three
browser suites, run on every push through `.github/workflows/ci.yml`.

`bun run validate` is the non-browser gate. `bun run ci` runs it and then every
browser suite, accessibility and text geometry included.

Nothing is skipped, no axe rule is disabled, and no assertion was weakened to
get a pass.

## Accessibility status

Target WCAG 2.2 AA. axe-core reports **zero violations** across 15 routes plus
the open states of both dialogs.

Verified beyond axe: one `<h1>` per page and no heading level skips; four
landmarks with every `nav` named; the skip link moves focus, not just scroll;
dialogs trap focus and restore it to their trigger on Escape; no horizontal
scrolling at 320 CSS pixels; Greek carries `lang="grc"` and Hebrew
`lang="he" dir="rtl"`; print output keeps the argument and drops the chrome.

Motion ships in two variants, and both are tested. See
[the motion brief](motion-brief.md) for the tiers and for what was deliberately
left unanimated. The previous blanket `prefers-reduced-motion` rule, which
collapsed every duration to 0.001ms with `!important` on `*`, has been replaced:
it removed meaning along with movement and could not be overridden. Movement is
now opt-in under `prefers-reduced-motion: no-preference`, colour feedback is
kept under `reduce`, and an end-to-end sweep over eight representative pages
asserts that with the preference set no rendered element animates a movement
property.

Two findings from that work are worth recording because both were caught by
measurement rather than by reasoning:

- `scroll-behavior: smooth` on `html` suppresses the App Router's scroll-to-top
  on client navigation, so a reader following "Next section" from two thousand
  pixels down an article arrived two thousand pixels down the next one. Smooth
  scrolling is now applied for the duration of one fragment navigation instead.
- The `<details>` height animation cannot be shipped on Chromium 148: a
  collapsed `::details-content` never re-expands, so the disclosure appears open
  and empty. Withdrawn, with a test that fails if it returns.

Fixed during testing: three contrast failures, a target-size failure on the
glossary jump list, a heading skip on the search page, a skip link that only
scrolled, and a header that overflowed at 320 pixels.

One rule is disabled repo-wide: `a11y/useKeyWithClickEvents`. It fires on
backdrop dismissal of a native `<dialog>`, which has no keyboard analogue
because Escape is handled by the platform. Both dialogs have Escape, a visible
Close button, focus trapping and focus restoration, and the end-to-end suite
asserts all of it.

Fitted search excerpts change none of this: the excerpt is ordinary DOM text,
matches stay semantic `<mark>` elements, and replacing an excerpt is never
announced — a refinement of wording is not news a screen-reader user needs
interrupting for. axe runs over the open dialog after fitting.

**Not done:** descriptions of on-screen text in the video. Writing those
requires watching it, and inventing them was not acceptable. The watch page and
the accessibility statement both say so.

## Performance

Static generation throughout. No third-party-hosted script, font or stylesheet:
every byte is served from this origin, including the one runtime dependency the
search dialog loads lazily. Fonts are self-hosted and subset. YouTube is not contacted until the reader presses
play, and then only on the privacy-enhanced domain. The video container has a
fixed aspect ratio, so activating it causes no layout shift. The search index
loads only when a reader first opens search.

Core Web Vitals were not measured under field conditions; that needs a real
deployment. The build characteristics that drive them are in place.

## Deployment

Everything works with no environment variables set. Set `NEXT_PUBLIC_SITE_URL`
before a production build so canonical URLs, the sitemap, Open Graph images and
the printed QR code point at the real domain. `FEEDBACK_STORE_DIR` and
`FEEDBACK_NOTIFY_EMAIL` are optional.

The in-memory rate limiter is per-instance. A multi-instance deployment should
replace `src/lib/rate-limit.ts` with a shared store.

## Known limitations

1. Video visual descriptions, as above.
2. Two case pages and eight original-language notes carry
   `specialist-review-pending` because they rest on a Greek or Hebrew claim.
   They are marked in the interface, not just in a document.
3. S34 carries `revision-needed` until someone produces a heaven-versus-hell
   count with published methodology.
4. External links are recorded with an access date but are not fetched by CI, so
   link rot is not detected automatically. Archive URLs are recorded where they
   exist and are not yet complete.
5. No visual regression testing. The text-geometry suite is not one: it compares
   predicted and actual line counts, and says nothing about appearance.
6. Firefox does not get fitted search excerpts. Pretext 0.0.8 measures through
   an `OffscreenCanvas`, which in Firefox does not resolve `@font-face`, so its
   predictions there are made in the wrong font. The runtime detects this and
   falls back; the reasoning and the measurements are in
   `docs/pretext-text-geometry.md`.
