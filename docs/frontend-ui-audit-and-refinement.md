# Frontend, UX and UI audit and refinement

One complete audit of the rendered site against its own design contracts, followed
in the same pass by the implementation of every finding that survived the evidence
gate. This is a refinement of the existing site, **not a redesign**: the warm-paper
editorial identity, the information architecture, the permanent section
identifiers and the entire motion system of `docs/motion-brief.md` are preserved
exactly as they stand.

## 1. Executive summary

**What was audited.** All 129 routes across every route family, the shared
component layer (`packages/ui` and `src/components`), the global stylesheet and
design tokens, both native dialogs, the correction form, search in both surfaces,
the two index filters, the video and transcript surfaces, print output, and the
no-JavaScript behaviour of every interactive control. Inspection combined full
source reads of every component and route file with rendered inspection of the
production build in a browser.

**Current strengths.** This site is in unusually good shape, because it has
already survived three audits: PR #2 closed a twelve-finding codebase audit and
added four CI gates, PR #3 unified every hand-rolled button surface onto shared
`buttonVariants`, and PR #4 built and tested the five-tier motion system. The
token discipline is real (two radius tokens, five motion tokens, semantic colours
throughout), the accessibility floor is high (axe-clean on 15 routes plus both
open dialogs, one `h1` per page, named landmarks, focus restoration on both
dialogs), and the reading experience is the point of the design rather than a
casualty of it.

**Main opportunities.** What remains is drift at the edges, most of it in the
places the three earlier PRs did not reach: one hand-rolled header CTA that
escaped PR #3, ARIA state and focus management gaps in two client components,
sub-16px mobile field text in the index filters, a server-error path in the
correction form that drops the field detail the server provides, and a handful of
single-instance inconsistencies (an untokenised radius, a press duration on the
wrong motion token, a dead package export, dead component state). Every accepted
finding is a correction toward a contract the repository itself already states.

**The motion system is preserved.** No tier changes, no new animation, no
reinstated exclusions. The only motion changes in this pass move two existing
declarations onto the tokens the brief already assigns them: the video-glyph
press onto the Tier 2 duration and curve, and the shared `reveal-fade` arrival
onto the Tier 3 curve. Both are conformance, not redesign, and both are now
held by the motion contract test.

**Baseline verification.** At the base commit, `CI=1 bun run validate` passes
completely (formatting, lint, typecheck, content validation, content audit, docs
check, 281 unit tests, production build, PII scan, link check, bundle budget),
and the end-to-end and accessibility suites pass (see section 10 for counts).

## 2. Repository state

| Item | Value |
|---|---|
| Base branch | `main` |
| Base commit | `b05b7ce` (Merge pull request #4) |
| Working branch | `claude/ci-site-audit-refinement-9ce21d` (worktree) |
| PR #1 | MERGED. Unit tests for the app's pure lib modules |
| PR #2 | MERGED. Codebase audit closed: 12 findings, 4 new gates, 123 → 455 tests |
| PR #3 | MERGED. Hand-rolled button surfaces moved onto shared `buttonVariants` |
| PR #4 | MERGED. The motion system: five tiers, two variants, tested |
| Motion base | PR #4 is fully contained in `main`; no branch surgery was needed |
| Bun | 1.3.14 |
| Node (Playwright host) | 24.11.1 |
| Next.js | 16.2.12 (App Router, static generation) |
| React | 19.2.8 |
| Tailwind CSS | 4.3.3 |
| TypeScript | 5.9.3 |
| Biome | 2.5.6 |
| Playwright | 1.62.0 (Chromium desktop 1440×900, Chromium mobile 375×812) |
| Platform | Windows 11 Pro, `core.autocrlf=input` |

PR ancestry was confirmed with `gh pr list --state all` and
`git log --oneline --decorate --graph`: all four PRs are merged and `main` is
their union. This audit branch was created from `main` at `b05b7ce`.

## 3. Sources consulted

**Repository documentation** (all read in full): `README.md`,
`docs/authoring-brief.md`, `docs/routing-brief.md`, `docs/motion-brief.md`
(binding), `docs/maintenance-guide.md`, `docs/implementation-report.md`,
`docs/content-migration-report.md`, `docs/source-verification-report.md`,
`docs/rights-audit.md`, `.github/workflows/ci.yml`, `playwright.config.ts`,
`biome.json`, `turbo.json`, every `package.json`, the five content-audit scripts
under `scripts/conditional-immortality/`, `src/app/globals.css`, all of
`packages/ui/src`, every component under `src/components`, every route under
`src/app`, and the five end-to-end spec files.

**Pull requests**: #1, #2, #3, #4 inspected via `gh pr list`/`git log`; PR #4's
motion work and its review fix-ups (`27aafb5`) read in the history.

**External skills** (retrieved 2026-07-30 from their main branches):

- shadcn official skill (`shadcn-ui/ui` → `skills/shadcn/SKILL.md`)
- shadcn `/improve` (`shadcn/improve` → `skills/improve/SKILL.md`)
- UI Skills (`ibelick/ui-skills`): `improve-ui`, `baseline-ui`,
  `fixing-accessibility`, `fixing-motion-performance`
- Anthropic frontend-design skill (`anthropics/skills`)
- Vercel Web Interface Guidelines (`vercel-labs/web-interface-guidelines`)

**Normative sources**: WCAG 2.2 (AA as the hard requirement; 2.5.3 Label in
Name, 2.5.8 Target Size Minimum, 2.4.3 Focus Order, 1.4.4/1.4.10 zoom and
reflow), WAI-ARIA Authoring Practices for dialog and disclosure patterns,
Core Web Vitals thresholds (LCP ≤ 2.5 s, INP ≤ 200 ms field, CLS ≤ 0.1), and
the Next.js 16 / Tailwind 4 documentation for the installed versions.

Where an external skill conflicts with a repository decision, the repository
wins. Conflicts encountered and refused are recorded in section 7.

## 4. Existing design language

Reconstructed from tokens, components and rendered output before any change was
considered.

**Audience and purpose.** Readers investigating conditional immortality:
skeptical evangelicals, people worried about one passage, people who want the
whole case. The product is a reference work; the main reader tasks are reading
long arguments in full, looking up a passage or term, comparing interpretations,
watching the overview, and submitting corrections.

**Personality.** A professionally edited theological reference book: calm,
warm, precise, unhurried. The interface recedes; the argument carries the page.

**Palette** (all in `@theme`, `globals.css:91-137`; raw hex is forbidden in
components): warm paper `#f7f4ed` ground, raised cream `#fffdf8` surfaces, quiet
panels `#eee9df`/`#e4ddd0`, deep ink text `#1c242b` with muted `#4c5763` and
subtle `#57606d` steps (both AA-clear on every surface they sit on), navy
headings `#233a4d`/`#16283a`, copper accents `#9a6431`/`#7d4f22` for links and
identity, restrained borders `#d4ccbe`/`#bdb3a1`, ochre caution pair, affirm
green pair, deny red pair. Meaning is never colour-alone; every status carries a
text label and usually a glyph.

**Type.** Source Serif 4 (self-hosted, subset, `font-display: swap`) for body
prose at 1.1875rem/1.68; Inter for headings, navigation, controls, labels and
metadata. Headings are Inter 600 with slight negative tracking and
`text-wrap: balance`; body paragraphs get `text-wrap: pretty`. Prose links are
underlined, offset 0.16em, thickness 0.06em rising to 0.11em on hover.

**Scale and layout.** Page container `max-w-[80rem] px-4 sm:px-6`; reading
measure `--spacing-measure: 42rem` with a `min(42rem, 39em)` cap on supporting
prose inside full-width containers (`measure-prose`); article template is a
three-column grid at `xl` (chapter rail 14rem, article, page rail 13.5rem),
two-column at `lg`, single below. Radii are two tokens only (0.25rem, 0.375rem).
Shadows are absent; hierarchy is done with borders and surface steps.

**Components.** `packages/ui` owns `Button`/`buttonVariants` (six variants,
`min-h-11` floor, `pressable`), `Badge` (six tones, glyph optional and
decorative), `Callout` (six tones with text glyph so print survives greyscale),
and `cn()`. The app owns the article chrome (breadcrumbs, header, on-this-page,
previous/next, feedback CTA), chapter navigation (list + `<details>`
disclosure), MDX rendering with `rehype-slug`, scrollable-table and id-prefix
plugins, Scripture/Greek/Hebrew/Cite/Compare content components, two native
`<dialog>` overlays, the correction form (TanStack Form, progressive
enhancement), click-to-load video, reading progress, and two
progressive-enhancement index filters.

**Motion.** Five tiers per `docs/motion-brief.md`, all durations tokenised
(130/100/200/150/180 ms), two easing tokens, everything that moves inside
`prefers-reduced-motion: no-preference`, reduced variants keep meaning
(crossfades), enforced by a source-level contract test, a component test and a
browser-level sweep. Tier 0 (all content) is never animated.

**Ownership map** (who owns what a change must go through):

| Concern | Owner |
|---|---|
| Body/heading typography, tokens, motion, print | `src/app/globals.css` |
| Button surfaces | `packages/ui/src/button.tsx` (`buttonVariants`) |
| Badges, callouts | `packages/ui/src/badge.tsx`, `callout.tsx` |
| Article shell | `src/components/article/section-page.tsx` |
| Breadcrumbs, article header, on-this-page, prev/next, feedback CTA | `src/components/article/article-chrome.tsx` |
| Chapter rail and narrow-screen contents | `src/components/article/chapter-navigation.tsx` |
| Header, primary nav, current-page state | `site-header.tsx`, `nav-link-item.tsx` |
| Mobile sheet | `mobile-navigation.tsx` |
| Search dialog and page results | `search-dialog.tsx`, `search-results.tsx`, `app/search/page.tsx` |
| Index filters | `scripture-filter.tsx`, `source-filter.tsx` |
| Correction form | `feedback-form.tsx` (+ `app/api/feedback/route.ts`) |
| MDX content and article components | `mdx-content.tsx`, `scripture.tsx`, `language.tsx`, `cite.tsx` |
| Video | `click-to-load-video.tsx` |
| Nav model | `src/lib/navigation.ts` |

## 5. Route and surface coverage

129 routes, generated from the App Router files below. 121 are prerendered
as HTML; `/search/` and `/corrections/` render on demand because they read
query parameters, and the rest are handlers. Every unique
template was inspected in the rendered production build; the representative set
covered at minimum one instance of every template plus the outliers named in the
matrix.

| Route family | Routes | Template / owners | Primary reader task |
|---|---|---|---|
| Homepage | `/` | bespoke orientation page; `buttonVariants`, `ClickToLoadVideo` | orient, choose an entry point |
| Start Here | `/start/` + 3 children | article-style pages; compare table on `/start/compare-the-views/` | first contact with the argument |
| Case hub | `/case/` | section inventory with essential path, `ReadingProgress` | choose and track sections |
| Case sections | 40 pages under `/case/…`, `/objections/…`, `/appendix/…` | `SectionPage` → `ArticleHeader`, chapter rail, `OnThisPage`, `MdxContent`, sources, revisions, prev/next, `FeedbackCta` | deep reading |
| Objections hub | `/objections/` | index of objection sections | find a specific objection |
| Passages | `/passages/` + 18 detail pages | passage template: Scripture block, ECT reading, CI reading, agreements, disagreement | study one passage |
| Scripture index | `/scripture/` | 208-entry filterable table (`ScriptureFilter`) | find every use of a text |
| Topics | `/topics/` + 27 detail | topic template with distinctions | understand a term |
| Glossary | `/glossary/` | 20-term list with jump list | quick definition |
| Sources | `/sources/` | 33-source filterable library (`SourceFilter`) | inspect the evidence base |
| Watch | `/watch/` | video + 279-cue transcript with chapters | watch, follow along |
| Full case | `/full-case/` | continuous edition, id-prefixed bodies | read everything, print |
| Method/About | `/method/`, `/about/` | article-style | assess credibility |
| Corrections | `/corrections/` | `FeedbackForm` | submit a correction |
| Changelog | `/changelog/` + 12 per-section | revision lists | see what changed |
| Original document | `/original-document/`, `/download/` | provenance and download cards | verify the source |
| Search | `/search/` (noindex) | server-rendered form + client results | find anything |
| Meta | `/accessibility/`, `/privacy/`, 404 | article-style | policy, recovery |
| Handlers | `/search-index.json`, `/download/*.txt|html`, `/og`, sitemap, robots, `POST /api/feedback` | route handlers | n/a |

Global surfaces audited on every template: sticky header (60px, blur), skip
link, desktop nav with `aria-current`, mobile sheet, search trigger and dialog,
footer (4 groups), focus treatment (3px copper), print output.

## 6. Findings

Every finding below passed the evidence gate: a stated contract, runtime or
source proof with exact locations, one deterministic correction, and a real
user impact. Findings are grouped by root owner. Priorities: P1 = defect a
reader can hit, P2 = verified inconsistency or gap with real impact, P3 =
high-confidence, low-risk polish.

| ID | Pri | Surface | Problem | Contract | Evidence | Root owner | Correction | Reach | Motion tier | Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 | P2 | Button `size="sm"` | `min-h-9` (36px) contradicts the variant's own 44px doc comment; sole consumer overrides it back | button.tsx:8-9 vs :33 | reading-progress.tsx:120 re-adds `min-h-11` | `packages/ui/src/button.tsx` | `sm` floor becomes `min-h-11`; drop the override | shared | n/a | low |
| F2 | P3 | `@ci/ui` package | The `./styles.css` export maps to a `src` file that does not exist | exports must resolve | the mapped file is absent from the package | `packages/ui/package.json` | remove the dead export | shared | n/a | low |
| F3 | P2 | Video play glyph press | Tier 2 press runs at `--motion-feedback` (130ms) instead of `--motion-press` (100ms); the site's two press confirmations run on different clocks | motion brief Tier 2 | globals.css:731-745 vs :648-658 | `globals.css` | `:active` override at `--motion-press` | shared | Tier 2 | low |
| F4 | P3 | `reveal-fade` easing | Tier 3 arrival uses keyword `ease` where the brief assigns `--ease-out-quad`; sibling `status-in` uses the token | motion brief Tier 3 | globals.css:450 vs :722-726 | `globals.css` | use `var(--ease-out-quad)` | shared | Tier 3 | low |
| F5 | P1 | Header Watch CTA | Hand-rolled near-copy of `copperSoft` (border /40 vs /45) and the only header control under 44px (measured 41.6px vs 44px sibling) | PR #3 buttonVariants contract; 44px floor | site-header.tsx:44; runtime measure | `site-header.tsx` | compose from `buttonVariants({variant:'copperSoft'})` keeping compact text | header, all pages | Tier 1+2 | low |
| F6 | P2 | Mobile nav sheet | Never marks the current page; desktop nav does (`aria-current` + panel fill) | same surface, same state | mobile-navigation.tsx:110-158 vs nav-link-item.tsx:26-33 | `mobile-navigation.tsx` | `aria-current="page"` + active style on matching links | all pages < xl | n/a | low |
| F7 | P2 | Search dialog trigger | No `aria-expanded` while the sibling menu trigger has it; the `open` state's only read is dead code `{open ? null : null}` | ARIA disclosure pattern; sibling parity | search-dialog.tsx:83-93, :235 | `search-dialog.tsx` | wire `aria-expanded={open}`, delete dead expression | all pages | n/a | low |
| F8 | P3 | Landmark names | `aria-label="Primary navigation"` / `"Footer navigation"` repeat the role; sheet dialog names itself by `aria-label` while its visible h2 goes unreferenced | APG: do not repeat role; dialog naming parity | site-header.tsx:30, site-footer.tsx:10, mobile-navigation.tsx:76+92 | three files | labels "Primary"/"Footer"; sheet `aria-labelledby` its h2 | all pages | n/a | low |
| F9 | P3 | Dialog close buttons | Sheet close carries dead `text-[0.88rem]` on an icon-only button; glyph sizes differ 18 vs 16 | sibling parity | mobile-navigation.tsx:96-106 vs search-dialog.tsx:139-149 | both dialogs | drop dead class, one glyph size (18) | overlays | Tier 2 kept | low |
| F10 | P3 | Sheet secondary links | ~41px targets under the primary links' ~47px | 44px floor for button-shaped rows | mobile-navigation.tsx:151 | `mobile-navigation.tsx` | `py-2` → `py-2.5` | sheet | n/a | low |
| F11 | P3 | Footer nav links | Same `FOOTER_NAV` data renders underlined in the footer, `no-underline` in the sheet; every other nav list is `no-underline` with a hover cue | one treatment per nav-list family | site-footer.tsx:22 vs mobile-navigation.tsx:151 | `site-footer.tsx` | `no-underline hover:underline` | footer, all pages | Tier 1 | low |
| F12 | P3 | Watch CTA copy | Label/description hardcoded in header and sheet against navigation.ts's single-source claim | navigation.ts:4-5 | site-header.tsx:42-47, mobile-navigation.tsx:127-137 | `navigation.ts` | export `WATCH_CTA`, consume in both | header+sheet | n/a | low |
| F13 | P2 | Search dialog panel | `rounded-lg` (0.5rem) is the only radius outside the two-token scale in the app | token discipline | search-dialog.tsx:117; grep 1 hit | `search-dialog.tsx` | `rounded-md` | dialog | n/a | low |
| F14 | P3 | Search dialog input | `border-border` where the form-field family uses `border-border-strong` | one field recipe | search-dialog.tsx:134 vs search/page.tsx:136, feedback-form fields | `search-dialog.tsx` | `border-border-strong` | dialog | n/a | low |
| F15 | P2 | Index filter fields | 0.95rem (15.2px) fields zoom the viewport on iOS focus; book select also drops `text-ink` | 16px mobile input floor; field family | scripture-filter, source-filter, search/page.tsx:206; measured 15.2px | three files | `text-[1rem] text-ink` | all index/search | n/a | low |
| F16 | P3 | Ctrl/Cmd+K | Text-field guard runs before the open-dialog branch, so the documented toggle never fires from the dialog's own input | the handler's own doc (search-dialog.tsx:58-62) | search-dialog.tsx:63-74 | `search-dialog.tsx` | check `dialogRef.current?.open` first | global shortcut | n/a | low |
| F17 | P3 | Search dialog input | `statusId` live region minted but never referenced | complete the evident wiring | search-dialog.tsx:23,154 | `search-dialog.tsx` | `aria-describedby={statusId}` on the input | dialog | n/a | low |
| F18 | P3 | Dialog footer link | "Full search page" is a bare ~22px control in a bar of 44px controls | 44px floor for standalone controls | search-dialog.tsx:225-230 | `search-dialog.tsx` | `inline-flex min-h-11 items-center` | dialog | n/a | low |
| F19 | P3 | Search page filters | Checkbox label sizes differ within one form (0.9 vs 0.88rem); "More filters" summary is the only regular-weight summary and a ~25px target | internal consistency; 44px disclosure floor | search/page.tsx:152 vs :180, :168 | `search/page.tsx` | 0.9rem both; summary `font-medium` + padded hit area | /search/ | n/a | low |
| F20 | P3 | Live counters | Filter status lines and dialog count lack `tabular-nums`, so digits reflow as counts change per keystroke | no-layout-shift on changing numbers | scripture-filter, source-filter status; search-dialog footer | three files | add `tabular-nums` | indexes+dialog | Tier 0 (no motion) | low |
| F21 | P2 | Correction form errors | Client-side validation failure announces nothing and moves focus nowhere; server 400 discards the `fieldErrors` the API returns while claiming "fields marked below" | WCAG 2.4.3/3.3.1; honest status copy | feedback-form.tsx:260-264, 322-328; route.ts fieldErrors | `feedback-form.tsx` | focus first invalid control after failed submit; render server field errors in the status message | /corrections/ | Tier 3 kept | med |
| F22 | P2 | sourceUrl validation | Server schema accepts any URL scheme while the client "mirror" allows only http/https; a no-JS submission can store a `javascript:` URL | validators declared mirrors (feedback-form.tsx:78-79) | schema index.ts:550 vs feedback-form.tsx:94-106 | `ci-content-schema` | server schema requires http/https | API | n/a | low |
| F23 | P2 | Video activation | Play button unmounts on click with no focus management; keyboard/SR focus drops to body | WCAG 2.4.3 | click-to-load-video.tsx:75-125 | `click-to-load-video.tsx` | focus the iframe on activation | video surfaces | n/a | low |
| F24 | P2 | Play button name | `aria-label` replaces visible text; the video title is absent from the accessible name (WCAG 2.5.3) | label-in-name | click-to-load-video.tsx:44-48, :89 vs :108-123 | `click-to-load-video.tsx` | drop `aria-label`; visible content is the name | video surfaces | n/a | low |
| F25 | P2 | New-tab links | Seven hand-written `target="_blank"` links across four routes lack the site's sr-only "opens in a new tab" note | site's own convention (section-page.tsx:113) | section-page.tsx:79-85; sources ×3; watch ×2; full-case ×1 | four files | add the sr-only note | four routes | n/a | low |
| F26 | P1 | 404 page | Says the case has "thirty-nine parts"; every other surface says 37; root cause is hand-duplicated nav copy | one navigation model; factual copy | not-found.tsx:34 vs navigation.ts:17 | `not-found.tsx` | correct to thirty-seven + registry guard test | 404 | n/a | low |
| F27 | P2 | /start part count | "The full case runs to 40 parts" contradicts the 37-part framing used by home, nav and the hub | one orientation story | start/page.tsx:171-175 vs case/page.tsx:93-95 | `start/page.tsx` | mirror the hub's "37 parts plus preface and appendices" framing | /start/ | n/a | low |
| F28 | P2 | Corrections count | Renders `{n} changes are recorded` without `pluralise`, so n=1 reads wrongly; both changelog pages use the helper | sibling parity | corrections/page.tsx:130 vs changelog pages | `corrections/page.tsx` | use `pluralise` | /corrections/ | n/a | low |
| F29 | P2 | Revision entry card | Triplicated ~60-line card across corrections + two changelog routes, already drifted (h3 1.08 vs h2 1.12) | shared-owner rule; proven drift | corrections:138-211, changelog:147, changelog/[id]:108 | new `revision-entry.tsx` | extract shared component with heading-level prop | three routes | n/a | med |
| F30 | P2 | Sources label maps | Page re-declares `RIGHTS_STATUS_LABELS`/`LINK_STATUS_LABELS` under a comment claiming the schema has none; schema exports both and wordings have diverged | single source of truth; false comment | sources/page.tsx:39-58 vs schema index.ts:357-389 | schema + `sources/page.tsx` | move the page's reader-facing wording into the schema maps and import them | /sources/ | n/a | low |
| F31 | P2 | Method contents nav | Hand-rolls the shared OnThisPage markup with drifted link size (0.9 vs 0.85rem) | shared-owner rule | method/page.tsx:76-80 vs article-chrome.tsx:174 | `method/page.tsx` | reuse `OnThisPage` | /method/ | n/a | low |
| F32 | P3 | Review-status badge | The tone/glyph decision is re-implemented in glossary and method | shared-owner rule | glossary:51-62, method:319-330 vs article-chrome:66-79 | `article-chrome.tsx` | badge accepts a bare status; both consume | three routes | n/a | low |
| F33 | P3 | Section link list | Byte-identical section-list markup in topics detail and passages detail | shared-owner rule | topics/[slug]:52-65 vs passages/[slug]:217-228 | shared component | extract once, consume twice | two templates | n/a | low |
| F34 | P3 | Sources-cited list | Same citation ol in three templates with heading drift (1.18 vs 1.2rem) | shared-owner rule | section-page:96-124, passages:256-281, topics:210-235 | shared component | extract `SourcesCited` | three templates | n/a | med |
| F35 | P3 | Related-pages nav | Identical footer nav block hand-copied in 8 routes | shared-owner rule | 8 files, identical class strings | shared component | extract `RelatedPages` | 8 routes | n/a | low |
| F36 | P2 | OnThisPage at xl | The template's stated keyboard-first ordering is false at xl: the only visible TOC sits after the article in source order | the component's own doc (section-page.tsx:26-30) | section-page.tsx:52,175; no order classes | `section-page.tsx` | move sidebar TOC before the article with explicit grid placement | 40 article pages | n/a | med |
| F37 | P3 | Disclosure summaries | Three summary styles (0.95/0.92/0.9rem, mixed weight) and ~25px hit areas | one disclosure recipe; 44px floor | language.tsx:98, chapter-navigation.tsx:63, search:168 | three files | shared padding/weight recipe, ≥44px hit area | articles+search | n/a | low |
| F38 | P3 | Interpretation panels | Agreements/disagreement panels break the site's soft-surface pairing (`bg-affirm-soft` with plain `border-border`) | Badge/Callout tone pairing | passages/[slug]:151,166 vs callout.tsx:14-19 | passage template | `border-affirm/30`, `border-ochre/40` | 18 passage pages | n/a | low |
| F39 | P3 | Index cards | Same-role card titles at 1.14/1.1/1.1/1.08rem; changelog card alone uses p-3 | same-role consistency | objections:63, passages:114, topics:62, sources:165, changelog:103 | four files | title 1.1rem; p-4 | index family | n/a | low |
| F40 | P3 | Panel headings | Card-panel h2 sizes drift (1.08/1.12/1.18) against a 1.12 modal value; border-t reference h2s drift 1.2 vs 1.18 | same-role consistency | section-page:70, watch:116, passages:213-258 | three files | panels 1.12rem; reference sections 1.18rem | article family | n/a | low |
| F41 | P3 | Small-caps labels | RelatedSections column labels 0.8rem vs the 0.78rem recipe used by every sibling | one label recipe | section-page:205,221 vs article-chrome:165 | `section-page.tsx` | 0.78rem | articles | n/a | low |
| F42 | P3 | Scroll wrappers | Hand-rolled wrappers on original-document drop `overscroll-x-contain`; rehype table wrapper announces `role="region"` against ScrollRegion's documented `role="group"` decision | scroll-region.tsx:13-16 | original-document:163,328,396; rehype-scrollable-tables.ts:92 | two files | add the class; align the role | tables sitewide | n/a | low |
| F43 | P2 | Full-case outline | Section titles and their own body headings are both h2, flattening the 54k-word document's outline | heading hierarchy | full-case:137-149; MDX bodies start `##` | new rehype step | demote body headings one level on the continuous edition | /full-case/ | n/a | med |
| F44 | P3 | Accessibility/print claims | The 44px claim overstates (checkboxes, dense TOCs); the print claim says search controls are removed but /search/'s form and pagination print | honest policy copy | accessibility:160-164, :79; search/page.tsx | two files | narrow the claim to button-shaped controls; `print:hidden` the search form and pagination | policy + /search/ | n/a | low |
| F45 | P3 | Objections description | Metadata hard-codes "Seven" against a data-driven listing | data-driven copy | objections/page.tsx:25-26 | `objections/page.tsx` | interpolate the registry count | /objections/ | n/a | low |
| F46 | P3 | Case-map comment | Claims print parity but the diagram is `hidden lg:block`, absent at A4 print width | honest comments | case-map:16-20 vs :215 | `case-map/page.tsx` | correct the comment (the list alternative is what prints) | source only | n/a | low |
| F47 | P3 | Case hub metadata | Only audited route without the `Metadata` type annotation | sibling parity | case/page.tsx:39 | `case/page.tsx` | annotate | source only | n/a | low |
| F48 | P3 | Privacy `code` | Forced `font-sans` on one code element; sibling keeps monospace | element consistency | privacy:144 vs original-document:158 | `privacy/page.tsx` | drop the override | /privacy/ | n/a | low |
| F49 | P3 | Watch column | Sole 54rem content column against the sitewide 52rem | one utility-column width | watch:92 vs seven 52rem siblings | `watch/page.tsx` | 52rem | /watch/ | n/a | low |
| F50 | P3 | Menu trigger hover | The only header control with no hover feedback | Tier 1 on every interactive surface | mobile-navigation.tsx:58 vs search-dialog.tsx:88 | `mobile-navigation.tsx` | `hover:border-navy` | header | Tier 1 | low |
| F51 | P2 | A11y gate coverage | Accessibility project runs desktop-only; mobile regressions can pass the gate | gate honesty | playwright.config.ts:52-68 | playwright config | add a mobile accessibility project | CI | n/a | low |
| F52 | P3 | Stale header comment | site-header claims a `<details>` fallback for the menu that does not exist (the footer is the documented no-JS path) | honest comments | site-header.tsx:12-14 vs mobile-navigation.tsx:16-17 | `site-header.tsx` | correct the comment | source only | n/a | low |
| F53 | P3 | Registry count guards | "37 parts", "Twelve pages", "Seven objections" claims have no guard against registry drift | maintenance-guide gate philosophy | copy across 5 surfaces | new unit test | assert the registry counts the copy relies on | tests | n/a | low |

## 7. Rejected candidates

Recorded because restraint is part of the deliverable. Each was investigated
and rejected for the reason given.

| Candidate | Why rejected |
|---|---|
| Homepage tab title duplicates the site name | **Refuted at runtime.** `document.title` renders exactly "A Biblical Case for Conditional Immortality" in the production build; no template suffix is applied. |
| Closed `<details>` content lost in Chromium print | **Refuted at runtime.** Print-media emulation shows the closed disclosure's content at 434px height, visible; the `display: revert` rules work as documented. |
| Search page intro runs to 80rem | **Refuted at runtime.** The global `measure-prose` cap on `main` limits the paragraph; adding a header wrapper would change nothing measurable. |
| Align passage/topic body prose (1.05rem) and method/about (1.06rem) to `--text-base` | Measured 74–78 CPL at those sizes, inside the comfortable range; each template's denser ramp is internally consistent (headings sized to match). Re-ranking whole templates would invent product intent without a readability failure. |
| Case hub h2s below the base clamp | All four hub h2s share 1.35rem; a deliberate, internally consistent control-page density, not drift. |
| Serif correction-form textarea | Long-form prose written by the reader in the reading serif is a defensible editorial choice; two valid designs, no deterministic correction. |
| 20px form radios | Labels extend the effective target; WCAG 2.5.8 passes. Enlarging native radios is a visual change with no proven gain. |
| No-JS corrections submission loses `?section` context | Real, but unfixable without making the page dynamically rendered, which would break the static-generation contract. Recorded as a known limitation. |
| Restyle search pagination onto a stock variant | The quiet bordered look matches no variant; forcing `outline` (navy border) changes the design, and a new variant needs multiple consumers. |
| Unify topic chips / glossary jump chips / search chips | Different semantic roles (route navigation vs in-page jump) at different densities; sameness would be false uniformity. |
| Homepage hero kicker/lede one-off sizes | The hero is the one deliberate scale moment on the site; its tracking and lede size are internally motivated. |
| `pressable` on homepage topic pills | Added deliberately by PR #4 (button-shaped chips); confirmed via history. |
| Badge definitions only in `title` | Documented mitigation: full definitions repeated on /method/. |
| Compare (MDX) heading at 0.86rem vs panel 0.95rem | Width-driven: half-column cards vs full-width panels, each internally consistent. |
| ci.yml "121 pages" comment | Accurate: the link checker counts 121 HTML pages; 129 counts routes including handlers. |
| Dense TOC/footer links below 44px | Inline-text exception applies; the repo's own 24px-spacing e2e gate covers them; the 44px floor is for button-shaped controls. |
| "S22 Title" vs "S22. Title" formats | Context-appropriate variety with no demonstrated reader impact. |
| Search dialog result rows without Badges | Deliberate density: a 12-result palette is not the full results page. |
| Watch transcript link vs download button | Different affordance contexts (inline panel vs download card page); both idiomatic. |
| Homepage corrections panel vs shared FeedbackCta | Deliberately richer composition (size-lg button, changelog note, measure cap). |
| Topic pages og:type "article" | The metadata principle says OG describes what the page is; topics are term entries, not articles. |
| not-found derives copy from PRIMARY_NAV | The 404's sentence-length descriptions are richer than the nav model's; replacing them would flatten deliberate copy. Only the factual error is corrected (F26). |
| ECT/CI panels onto `Callout` | `Callout` renders an `<aside>`; the two readings are core argument content and must not become asides. Only the soft-border pairing is corrected (F38). |

## 8. Ordered implementation plan

Executed in this order, testing after each group (failing test first where a
test can express the contract).

1. **Group 1 — shared tokens and primitives**: F1, F2, F3, F4.
2. **Group 2 — header, navigation, footer**: F5, F6, F7, F8, F9, F10, F11, F12, F50, F52.
3. **Group 3 — search surfaces**: F13, F14, F15, F16, F17, F18, F19, F20, F44 (print part).
4. **Group 4 — forms**: F21, F22.
5. **Group 5 — video**: F23, F24.
6. **Group 6 — article shell**: F36, F37, F40, F41, F25 (section-page), F34, F33, F32.
7. **Group 7 — route families**: F26, F27, F28, F29, F30, F31, F35, F38, F39, F42, F43, F45, F46, F47, F48, F49, F44 (claims), F25 (remaining), F53.
8. **Group 8 — test infrastructure**: F51.
9. **Full validation** and section 9-10 updates.

## 9. Implementation log

Every accepted finding was implemented; none had to be withdrawn after
measurement. Notes record where an implementation detail was decided during
the work.

| ID | Status | Note |
|---|---|---|
| F1 | Implemented | `sm` now inherits the base `min-h-11` floor rather than restating it |
| F2 | Implemented | |
| F3 | Implemented | `:active` override carries `--motion-press`; contract test added |
| F4 | Implemented | contract test added |
| F5 | Implemented | `cn(buttonVariants({variant:'copperSoft'}), 'hidden px-3 text-[0.88rem] sm:inline-flex')` keeps the compact header look |
| F6 | Implemented | active-route logic extracted to `isActiveRoute` in navigation.ts, shared with `NavLinkItem`; e2e asserts the sheet marks The Case |
| F7 | Implemented | e2e asserts `aria-expanded` through the open/close cycle |
| F8 | Implemented | sheet's visible title renamed to "Site navigation" and referenced by `aria-labelledby`, so the five existing e2e name lookups hold |
| F9 | Implemented | both closes use the 18px glyph; dead text class dropped |
| F10 | Implemented | |
| F11 | Implemented | |
| F12 | Implemented | `WATCH_CTA` exported from navigation.ts |
| F13 | Implemented | |
| F14 | Implemented | |
| F15 | Implemented | filter fields and the book select at 16px with `text-ink` |
| F16 | Implemented | open-dialog branch now precedes the text-field guard; e2e toggle test added |
| F17 | Implemented | |
| F18 | Implemented | footer bar padding rebalanced (py-1) so the 44px link does not thicken the bar |
| F19 | Implemented | |
| F20 | Implemented | dialog count and both filter status lines |
| F21 | Implemented | focus moves to the first `[aria-invalid]` control after a failed submit; 400 responses render the server's own field report; e2e added |
| F22 | Implemented | schema `.refine` to http/https; five-case unit test added |
| F23 | Implemented | iframe focused on activation; e2e asserts it |
| F24 | Implemented | `aria-label` removed; visible poster text is the name; e2e name updated |
| F25 | Implemented | seven links across section-page, sources, watch, full-case |
| F26 | Implemented | copy corrected to thirty-seven; guarded by the F53 test |
| F27 | Implemented | mirrors the hub's "thirty-seven parts, with a preface and two appendices" |
| F28 | Implemented | |
| F29 | Implemented | `components/changelog/revision-entry.tsx`; heading normalised at 1.08rem; footer-link wording unified on "Every change to {id}" |
| F30 | Implemented | reader wording moved into the schema maps so rendered output is unchanged; `PERSPECTIVE_UNSTATED_LABEL` now the single source |
| F31 | Implemented | method's contents list reshaped as `ExtractedHeading[]` |
| F32 | Implemented | `ReviewStatusBadge` accepts `status`; glossary and method consume it |
| F33 | Implemented | `SectionLinkList` in article-chrome |
| F34 | Implemented | `SourcesCited` in article-chrome; the passage page turns its own divider off with the `divider` flag |
| F35 | Implemented | `components/navigation/related-pages.tsx`, eight consumers |
| F36 | Implemented | sidebar TOC moved before the article with explicit `col-start`/`row-start`; template comment updated to match |
| F37 | Implemented | negative-margin/padding trick keeps the rendered layout identical |
| F38 | Implemented | |
| F39 | Implemented | objections 1.14→1.1, sources 1.08→1.1, changelog card p-3→p-4 |
| F40 | Implemented | panel h2s at 1.12; reference-section h2s at 1.18 |
| F41 | Implemented | |
| F42 | Implemented | wrappers gain `overscroll-x-contain`; rehype wrapper role aligned to `group` with its unit test updated |
| F43 | Implemented | `rehype-demote-headings.ts` + unit tests; applied only on `/full-case/` |
| F44 | Implemented | claim narrowed to button-shaped controls; `/search/` form and pagination now `print:hidden`, which makes the print claim true |
| F45 | Implemented | |
| F46 | Implemented | |
| F47 | Implemented | |
| F48 | Implemented | |
| F49 | Implemented | |
| F50 | Implemented | |
| F51 | Implemented | `accessibility-mobile` project at 375×812 with touch; `test:a11y` runs both |
| F52 | Implemented | |
| F53 | Implemented | `orientation-copy.test.ts` pins 37/34/3/40/12 and the nav description |

### Post-review refinements

After implementation, an adversarial code review (ten independent finder
angles, one verifier per candidate, and a gap sweep) confirmed 28 residual
findings against the implementation itself, all corrected in a follow-up
commit:

- **Continuous-edition outline completed.** The rehype demotion only reached
  markdown headings; component-rendered headings (`Callout`, `ECTReading`,
  `CIReading`) are now demoted through the substitution map in `MdxContent`,
  and demoted `h4` headings keep their copy-link anchors (new `h4` entry and
  a widened anchor-reveal selector).
- **Tier 2 fully unified.** The video-glyph press also takes
  `--ease-out-quad`; the contract test now asserts token and curve.
- **Single sources of truth.** The form's visible labels drive the
  server-error report (`FIELD_LABELS`); the 400 wire shape is a shared
  `FeedbackFieldError` type; the sourceUrl rule uses `z.url({ protocol })`;
  `ReviewStatusBadge` takes one required `status`; `SourcesCited` exposes a
  `divider` flag instead of a className override.
- **Duplication removed.** Shared `NewTabLink` (seven external links, plus
  the one the first pass missed), shared `DialogCloseButton` (both
  overlays), one `.summary-hit-area` class (three disclosures), and
  `ScrollRegion` used on the original-document tables.
- **A latent outline flaw surfaced and fixed at its root.** Both appendix
  bodies opened with a caution `Callout as="h3"` before any `##` heading, a
  pre-existing h1-to-h3 skip on their own pages that no tested route covered;
  demotion turned it into an h2-to-h4 skip on the continuous edition and the
  structure gate caught it. The authored level is now `h2`, which is sound on
  both surfaces, and the callout's rendered title is identical at any level.
- **Guards made real.** The numbered-arguments count is counted rather than
  derived; the objections and Watch-CTA numbers are pinned to their
  registries; the transient `scheduled_tasks.lock` session file is untracked
  and ignored; the Playwright comment and this document's motion summary were
  corrected.

Three confirmed review findings were deliberately not applied, with reasons:
the method page's badge tooltip duplicating its adjacent definition (fixing
it would add a single-call-site boolean prop, the same altitude smell the
review flagged elsewhere; the tooltip is the badge's uniform contract), the
watch page's video-sources list joining `SourcesCited` (its "Open
youtube.com" affordance is deliberately different from "View original"), and
the mobile sheet reusing `NavLinkItem` (the shared logic already lives in
`isActiveRoute`; the components differ structurally).

## 10. Final verification

All commands were run on the finished branch, on Windows 11 with Bun 1.3.14,
against a production build.

| Check | Result |
|---|---|
| `bun run format:check` | Pass |
| `bun run lint` | Pass |
| `bun run typecheck` | Pass (all five workspaces) |
| `bun run content:validate` | Pass |
| `bun run content:audit` | Pass, ledger exports unchanged |
| `bun run content:docs` | Pass |
| `bun run test` | **843 unit tests pass** on the finished tree — 51 in `@ci/content-schema`, 80 in `@ci/content`, 336 in `@ci/search`, 376 in the app (281 at the audit base; the balance is this branch's additions and PR #5's merge) |
| `bun run build` | Pass, 129 routes, 121 prerendered as HTML |
| `bun run content:pii` | Pass: no source contact details in 1,753 built or 295 committed files |
| `bun run content:links` | Pass: 9,421 internal links and fragments resolve, 0 duplicate ids |
| `bun run content:bundle` | Pass on the merged tree: every route within budget; `/corrections` 663.7 kB against its 664.1 kB allowance |
| `bun run test:e2e` | **348 tests, 0 failures**, Chromium desktop 1440×900 and mobile 375×812 |
| `bun run test:a11y` | **76 tests, 0 failures** (32 at base, desktop only; now 38 × desktop + 38 × mobile via the new `accessibility-mobile` project, `/accessibility/` having joined the axe routes, plus four keyboard-operation tests axe cannot express) |
| `bun run test:print` | **6 tests, 0 failures** across Chromium, Firefox and WebKit |
| `bun run test:text-geometry` | **69 tests, 0 failures** across Chromium, Firefox and WebKit |

**Rendered sweep** (production build, before and after): 360 loads over all
120 built HTML routes at 1280/375/320 px — zero console errors, zero page
errors, zero horizontal page overflow, exactly one `h1` and one `main`
everywhere, no duplicate ids, no non-200 response. Print-media emulation
confirms closed disclosures keep their content on paper.

**Runtime spot checks on the new build**: the header Watch CTA measures
exactly 44px with the `copper/45` variant border; footer navigation links
rest without underlines; filter fields compute 16px.

**Screenshots**: the full before/after archetype set (28 routes × 5 widths)
was captured and reviewed; the highest-risk surfaces (the three-column
article template after the source-order change, the shared revision cards,
the mobile homepage) were inspected individually and render correctly.
Screenshots are session evidence and are not committed, per repository
convention.

**Content and privacy integrity**: no permanent id, route, slug, Scripture
text, migration-ledger entry or transcript cue changed; the PII scan is clean;
no third-party request was introduced (the sweep recorded zero external
requests before a play activation).

Three kinds of content correction were made, and each is a correction rather
than an edit. `welch-source-document` gained `S17` and `S18`, which cite it inline and
were missing from its `citedBy`, and both sections' `sourceIds` gained it to
keep the existing registry invariant; `sprinkle-introduction` lost `P00`,
whose text never mentions it. Eighteen authorless sources gained a
`shortName`, a new optional field, so their citation markers stop reading
`[What]` and `[Weeping]`. Sweep 6 records the evidence, and a registry test
now fails if `citedBy` and the MDX bodies disagree in either direction.

**Remaining limitations** (pre-existing, documented): field Core Web Vitals
still require a real deployment; the no-JS corrections submission cannot
carry `?section` context without abandoning static generation (recorded as a
rejected candidate); video visual descriptions remain outstanding as the
accessibility statement says.

### Gap sweep 1 (merged tree)

A six-angle adversarial sweep of the merged tree (merge seams, search
contracts, motion/routing contracts, ledger accuracy, fix regressions,
repository hygiene) confirmed sixteen residual findings, none refuted, all
corrected:

- **Search dialog robustness and interaction** (five): a failed index fetch
  now renders a recovery message instead of an unhandled rejection and a
  blank pane; the dialog closes on route change exactly as the sheet does,
  so it cannot survive browser Back; backdrop dismissal on both overlays now
  requires the press to begin on the backdrop, so a text-selection drag that
  ends outside the panel no longer closes it; the live region pluralises
  "1 result"; and Ctrl/Cmd+K is suppressed while another modal is open
  rather than stacking two.
- **Token discipline** (three): the OG image's `inkSubtle` mirror caught up
  with the contrast-fixed token; the quick-search excerpt's serif stack goes
  through `var(--font-serif)` (which resolves to the exact stack Pretext
  measures); its mark radius joins the radius scale.
- **Documentation accuracy** (eight): README and the implementation report
  carry measured merged-tree counts; the motion brief's Tier 3 prose matches
  the shipped shared tokens (200ms in / 150ms out for both overlays); two
  Playwright config comments count the actual seven projects and two
  accessibility projects; this ledger's own unit-count note is corrected
  (orientation copy is seven tests) and section 11 is committed rather than
  left as a working-tree edit.

One finder (fix regressions) died on a transient network error; its angle is
re-run in gap sweep 2.

### Gap sweep 2 (completed tree)

The second sweep ran five angles (fix regressions, fresh eyes on the search
dialog, contracts, documentation counts, accessibility) plus a hygiene angle
that had already returned clean. It confirmed fifteen findings, none refuted.
Three were regressions introduced by this branch's own earlier fixes, which
is exactly what a second sweep is for. All are corrected:

- **Announced search failure.** Gap sweep 1 gave the failed index fetch a
  visible recovery message, but left the live region empty at that moment, so
  assistive technology reported nothing at all (WCAG 4.1.3). The failure is
  now a branch of the polite status region, the visible copy is its
  `aria-hidden` twin, and an end-to-end test aborts the index request and
  asserts both channels plus the recovery link.
- **One current page per navigation region.** F6's `aria-current` had been
  applied to the sheet's secondary link list as well as the primary one, and
  the two lists share routes, so `/case/`, `/watch/` and every `/start/` page
  announced two current pages. The secondary list no longer marks anything,
  matching the footer that renders the same model; the end-to-end assertion
  now counts the marked links instead of sampling the first.
- **One scroll-region owner.** F42's `overscroll-x-contain` reached only the
  wrappers converted to `ScrollRegion`; the sibling `scrollRegionProps`
  helper still emitted none, and all three of its callers were missing it.
  The helper is retired and its callers use the component, so the class of
  drift is gone rather than patched again.
- **Modified clicks.** The search trigger called `preventDefault()`
  unconditionally and each result row called `onNavigate` on every click, so
  Cmd/Ctrl/Shift-clicking either opened a background tab *and* destroyed the
  dialog. A shared `isModifiedClick` helper (unit-tested for all four
  modifiers and the middle button) now lets the browser have those clicks.
- **Excerpt geometry measured through a transform.** The fitter read
  `getBoundingClientRect().width` one frame after the panel opened, inside
  its `scale: 0.98 → 1` enter transition, and cached a width about two per
  cent narrow for the life of the result set. It now reads `clientWidth`,
  which is the layout width and is unaffected by any ancestor transform.
- **Backdrop dismissal, the mirror case.** Sweep 1 required the press to
  begin on the backdrop; a drag that began on the backdrop and released
  inside the panel still dismissed. Both ends must now be on the backdrop.
- **A third palette mirror.** `download/handout.html` carried the same stale
  `ink-subtle` the OG mirror had, under the same parity comment.
- **Motion brief coverage.** The video poster's hover growth is a shipped,
  tested, `no-preference`-gated Tier 2 companion to its press, but the brief
  described Tier 2 as press-only. The brief now documents both halves and
  states that no other element takes a hover transform. No CSS changed.
- **Six documentation corrections**, each measured against the tree: 21
  redirects (not 20), 12 per-section changelog pages (not 13), two case pages
  plus eight language notes carrying `specialist-review-pending` (not "six
  pages"), the `test:browser` suite descriptions in two documents, and this
  ledger's own PII and bundle rows brought to their merged-tree values.

### Gap sweep 3 (completed tree)

Six angles over the tree at `04555d3`, auditing the previous sweep's own
fixes alongside fresh reads. Twenty findings confirmed, three refuted; five
were regressions from sweep 2, which is why the sweeps repeat. All corrected:

- **The `aria-hidden` twin was the wrong shape.** Sweep 2's visible failure
  message was marked `aria-hidden` to avoid double-announcing, but it
  contains the recovery link, so that link became a silent tab stop and the
  failure text vanished from browse mode (axe `aria-hidden-focus`, WCAG
  4.1.2). The failure now goes into a persistent `aria-live` region that
  wraps the visible text, which is the pattern the correction form already
  uses: one channel, announced and readable, with a reachable link. The
  end-to-end test now asserts the link is in the accessibility tree and is a
  real tab stop in order.
- **Modified clicks, the two sites sweep 2 missed.** The guard reached the
  trigger and the result rows but not the dialog's own recovery and footer
  links, which still closed the dialog on a background-tab click. One
  `onLinkClick` handler now serves all of them, and an end-to-end test
  Cmd/Ctrl-clicks a result and asserts the dialog and query survive.
- **The backdrop mirror case in the sheet.** Sweep 2 fixed it in the search
  dialog only; the navigation sheet kept the one-sided guard.
- **Focus could still reach `<body>`.** The sheet's trigger is `xl:hidden`
  while the sheet is not, so a viewport crossing 1280px with the sheet open
  left `close()` focusing a hidden element. Focus now falls back to the main
  region, the same landing the skip link uses.
- **Two tests could not fail.** The target-size contract looked for the
  `min-h-11` its base class always supplies, so only the literal `min-h-9`
  could ever trip it; it now reads every `min-h-*` and rejects any step below
  eleven. The failure-path test's role query silently matched the footer link
  rather than the hidden one it meant to click.
- **Excerpts no longer rewrite themselves as the dialog leaves.** Closing
  dropped every fitted excerpt back to its fallback while the panel was still
  painted through its 150ms exit, so the words changed under the reader.
- **The geometry suite measures the way production measures.** It still
  derived the excerpt width from `getBoundingClientRect()`, the transformed
  box that sweep 2 abandoned.
- **The skip link has a tier.** Its `translate` arrival is a shipped
  animation the five-tier taxonomy never named, and it was running an arrival
  on the Tier 3 *exit* token. It is now documented as Tier 3 and uses the
  entrance token.
- **Printed citations carry their destinations.** The rule that appends a
  URL after an external link was scoped to `.prose-article`, so the
  sources-cited list on roughly eighty-five pages printed "View original"
  with no address. It is scoped to `main`.
- **Two claims the pages did not honour.** The continuous edition said its
  contents panel is removed from print and it was not; the case map offered
  every reader a fallback "if the diagram is hard to read" when the diagram
  is only shown from `lg` up.
- **The filter disclosure stays open** when a filter inside it is active,
  instead of hiding the state it just applied.
- **Four jump navigations name themselves by their visible heading**, so the
  landmark name and the words on screen cannot drift; three of them had said
  something different.
- **Three documentation corrections**: the routing brief still taught the
  bare `overflow-x-auto` wrapper that `ScrollRegion` replaced, the
  implementation report's exhaustive client-component list omitted two, and
  the route table contradicted this document's own changelog-page count.

### Two racy end-to-end tests, root-caused

The sweep-3 pass left two end-to-end failures that reproduced on a loaded
machine and were traced rather than retried away. Neither was a site defect;
both were tests asserting against a moving target, and both are now
deterministic.

- **The skip link** was measured once, the instant focus landed, so the
  assertion raced the arrival it was testing and caught the link still
  travelling. It now polls until the link is on screen, which asserts the
  same property and still fails if it never arrives. This also settled the
  skip link's duration: the sweep had moved it to the Tier 3 entrance token,
  but 150ms is deliberate for the first control a keyboard reader meets, so
  the shipped timing is unchanged and the brief now records why it takes the
  quicker of the two Tier 3 durations.
- **"Carries the query through to the full search page"** asserted on
  whichever search field matched first, within the 150ms the dialog stays
  painted through its exit transition, so two fields matched and Playwright
  treats a strict-mode violation as fatal rather than retrying it. The test
  now asserts that following the link closes the dialog, then checks the
  field on the page itself, which is what it was always claiming.

### Gap sweep 4 (completed tree)

Six angles over the tree at `29245d4`. Fourteen findings confirmed, three
refuted. Two were regressions from sweep 3, and both were caught by verifiers
that measured rather than reasoned:

- **Printed addresses were doubling.** Sweep 3 widened the print rule that
  appends a link's destination from `.prose-article` to `main`, which fixed
  the sources-cited lists but caught the links whose visible text is already
  the address, so the `/full-case/` bibliography, the `/sources/` index and
  the video note printed every URL twice. `NewTabLink` now marks those five
  links, and the rule skips them; the citation links that motivated the
  widening keep their destinations.
- **A test that could pass without testing anything.** The modified-click
  test picked its target with an unscoped role query, and until the 610 kB
  index arrives the only link in the dialog is the footer one, which shares
  the same handler. A verifier proved it by delaying the index: past about
  150 ms the test clicked the footer link, exercised none of the row wiring
  it is named for, and still passed. It is now scoped to the result list.
- **Search pagination past the end** rendered an empty list beneath a count
  promising results, with a Previous chain walking back from a page that does
  not exist. An out-of-range `?page=` now redirects to the last real page.
- **Closed disclosures and wide tables on paper.** A scrolling region cannot
  scroll on paper, so anything past the printed column was clipped with
  nothing to show it had gone; print now lets those tables wrap.
- **Search invented and missed matches on `/start/`.** Its hand-authored
  search document listed three headings, two of which name text the page does
  not contain. It now lists the six headings the page actually renders.
- **A caption-less table announced itself as "Table".** A GFM pipe table
  cannot carry a caption, so the wrapper now falls back to the heading it
  sits under, which is what a reader would call it. Two unit tests cover the
  fallback and its precedence.
- **The accessibility statement said the axe suite covers that page**, and it
  did not. The page is now in the suite rather than the claim being softened.
- **The correction form asked browsers for the wrong thing.**
  `autoComplete="url"` is the autofill token for the reader's own home page,
  on a field that asks for a citation.

### Gap sweep 5 (completed tree)

Six angles over the tree at `c235dce`. Twelve findings confirmed, two refuted.
The dominant one showed that sweep 4's search fix had been a patch on one
instance of a class rather than a fix of the class:

- **The search index described pages that do not exist.** Sweep 4 corrected
  the hand-authored `headings` for `/start/`. Every other hand-authored entry
  had the same defect: the 27 topic documents, `/method/`, `/about/`,
  `/start/compare-the-views/` and every passage document. A verifier measured
  the harm in both directions. Searching *distinctions* returned all 27 topics,
  each quoting four section names, three of which appear nowhere on the page;
  searching *why philosophy is not treated as proof*, which is a heading
  `/method/` renders verbatim, returned that page nowhere at all. Every list
  now names the headings its page renders, and a new end-to-end test walks one
  document of each kind and fails if a claimed heading is not a heading on the
  route, so the class cannot return silently.
- **That correction moved the ranking baseline PR #5 pins.** The diff was
  inspected before regenerating. Measured against `main` at the end of the
  branch, 25 of the 30 pinned queries are byte-identical; four moved their
  total and one its scores, each explained by heading text that is now real.
  The pin's docstring records when regeneration is legitimate, because a
  ranker change is not. (An earlier draft of this section said 25 queries
  *moved*, which inverted the measurement; sweep 8 caught it.)
- **`print:hidden` disclosures printed anyway.** Sweep 4 made closed
  disclosures open on paper with `display: block !important`, which also
  overrode the utility that exists to keep a disclosure off paper entirely.
  The rule now excepts them.
- **An inline citation's accessible name did not contain its visible text**
  (WCAG 2.5.3), so speech input could not address the link by what it shows.
- **The watch page promised "two places for further reading"** above a list
  that renders three.
- Four documentation claims disagreed with the tree: the axe route count, a
  file extension, a static-generation claim that `/search/` is an exception
  to, and a stale panel token in the handout.

### Gap sweep 6 (completed tree)

Three angles over the tree at `38ce63c`: rendered-output truth, accessibility
beyond what axe can see, and the branch's own diff. Eighteen findings
confirmed. The most serious is a false statement about data handling on the
privacy page; the most instructive is that two of sweep 5's own fixes were
weaker than they read.

The first two came from chasing an end-to-end failure to its cause rather
than to its symptom. The failing assertion was the one sweep 5 had re-pointed
at the corrected accessible name; the fix was wrong in a way the old
assertion had been hiding.

- **Inline citations named a city instead of an author.** The marker took the
  author's last word as a surname, which is right for `Edward Fudge` and wrong
  for the classical "X of Y" form: `Irenaeus of Lyons` rendered as
  `[Lyons, Book II, chapter 34, section 3]`, and `Augustine of Hippo` and
  `Ignatius of Antioch` the same way. Three of the thirteen authors in the
  library are cited this way, in prose, where "Lyons" reads as a different
  person. Short names now come from `citationShortName`, beside
  `formatCitation` where the rest of citation formatting lives.
- **Citations stated their locator twice.** `formatCitation` already appends
  the record's own locator, and the marker appended the call-site one after
  it, so `/case/roadblocks/tradition/` served
  `aria-label="… c. AD 174-189. Book II, chapter 34, section 3. Book II,
  chapter 34, section 3"` — in the tooltip and in the accessible name.
  `citationLabel` now treats the marker's locator as replacing the record's
  default rather than following it, which also lets a marker cite a whole
  chapter where the record defaults to one section. Nine unit tests cover
  both functions, two of them over every source in the library.

The privacy finding is the one to read first:

- **The site told readers that nothing they searched for left their device,
  and it was not true.** `/privacy/` said "Nothing you type into it leaves
  your device" and "No query is transmitted anywhere, not to this site and not
  to anyone else"; `/search/` said "Nothing you type is sent to a server" —
  on the page that had just received it. `/search/` is a Server Component: it
  reads `searchParams.q`, scores the index on the server and renders the
  results. `curl` runs no JavaScript, and
  `curl "…/search/?q=zzqxnotaword"` returns `No results for "zzqxnotaword"`
  in the HTML, so an invented term demonstrably reached the server. Every
  documented path leads there — the quick panel's own footer link, the
  empty-state suggestions, and the scripting-disabled fallback the privacy
  page offered as *proof* of the claim.

  The claim is true of the quick panel, which matches the downloaded index in
  the browser, and false of the results page, which is server-rendered so that
  it works without scripting and so a page of results can be linked. The copy
  now draws that distinction on all six surfaces plus the index builder's own
  docstring, says the term travels in the URL and may appear in ordinary
  request logs, and points a reader who would rather it did not to the panel.
  Nothing about the architecture changed: the honest description was the fix.

Two of sweep 5's own corrections turned out to be weaker than they read:

- **The search index still described pages that do not exist**, in the class
  sweep 5 believed it had closed. Both templates render several sections
  conditionally, and the corrected lists were still unconditional: three
  topics carry no objections and five passages no wording notes, so
  "Objections that turn on this" was claimed for `/topics/gehenna/`,
  `/topics/sheol/` and `/topics/sodom-and-gomorrah/`, which do not render it.
  The passage list also omitted three headings that *are* rendered — "Where it
  sits in the canon", "Notes on the wording" and "Editorial notes" — so real
  headings were unfindable. Both lists are now built from the same predicates
  the templates branch on.
- **The guard test written to prevent exactly that could not see it.** It
  sampled one document per type, and the topic it happened to sample was the
  first alphabetically, which has all five sections. It now checks every route
  in the index — fetched over HTTP and parsed, so covering 90-odd routes costs
  seconds rather than a minute — and asserts the route count has not collapsed.

The remaining findings, each with rendered proof:

- **Inline markers printed the first word of the title for the 18 authorless
  sources**, giving `[What]`, `[Weeping]`, `[God]` and `[Bible]` in prose, and
  collapsing two different articles to `[Annihilation]` and two different
  lexicon entries to `[Strong's]`. `SourceRecord` gains an optional
  `shortName`, populated for all 18, and tests assert no authorless source
  falls back to the title and no two unrelated sources share a marker. Two
  works by one author sharing a surname is left alone: that is how citation
  has always worked, and the locator tells them apart.
- **"Sources cited on this page" disagreed with the citations on the page.**
  `citedBy` is hand-maintained: `welch-source-document` is cited inline in S17
  and S18 but was missing from both lists, and `sprinkle-introduction` was
  listed on `/case/why-this-matters/`, whose text never mentions it. A
  registry test now reads the MDX bodies and fails in both directions, exempting
  the two appendices, which have no body to read.
- **`/full-case/` contradicted itself in one sentence**, offering "About 247
  minutes of reading, or roughly two hours at a careful pace". 247 minutes is
  four hours, and a careful pace is slower, not faster. The hours are derived
  now.
- **`/method/` inverted the counts it invites the reader to check**, saying two
  claims were narrowed and one withdrawn where the changelog records one
  narrowed and two withdrawn — on the page that sets the site's evidentiary
  standard.
- **Video chapters read "1 minutes 26 seconds"** as their entire search
  excerpt. They now read `1:26`, as the watch page has always written them.
  This is also what moved the ranking baseline: "seconds" stems to "second",
  so every chapter of the video matched the query "second death".
- **`/passages/` named a range it does not end at** — "from Isaiah 66 to
  Revelation 20", after a Revelation 21 passage was appended. Both bookends
  are read off the registry now.
- **Two contract tests could not fail for the regression they name.** The
  button floor read `min-h-*` with a regex that consumed its own separator, so
  `min-h-11 min-h-10` looked like one value, and it ignored arbitrary values
  entirely though the button itself is written with them. The print rule for
  disclosures had been widened to `details[^{]*`, which `details[open]` also
  satisfies while forcing open only what is already open. Both now fail for
  the thing they exist to catch, and an unreadable height fails rather than
  being skipped.

The accessibility angle found four things the axe suite cannot see. It runs
clean on sixteen routes, and none of these is a rule violation it could have
caught — where focus is after a navigation, whether a tab stop has anything
behind it, and whether a modal is really modal are not things a rule engine
can check:

- **Every transcript timestamp stranded keyboard focus twenty-one thousand
  pixels off screen.** `/watch/` links each of its thirty-nine timestamps to
  `?t=…`, and a query-only navigation is a soft one: the router resets the
  scroll position but leaves focus exactly where it was. Measured, the player
  arrived at the top of the viewport while focus stayed on the timestamp at
  `y=21067` — a hundred and fifty-eight Shift+Tab presses away from the
  control the page's own prose promises it links to. Mouse readers never saw
  it; keyboard, switch and screen-reader readers were denied the feature
  entirely.
- **Search pagination had the same defect, and the announcement made it
  worse.** The live region correctly said "Page 2 of 4", and the next three
  tab stops after "Next" were footer links: every new result skipped. A
  correct announcement leading into a stranded focus is more misleading than
  silence.

  Both now use `FocusOnArrivalLink`, which moves focus to the region the
  navigation was for. It is not a fragment link and adds no motion.
- **Neither dialog stopped the page behind it scrolling.** `showModal()`
  makes the background inert to activation but says nothing about the wheel,
  so a gesture over the backdrop scrolled the document 800px behind the panel
  at every width tested, on both overlays. Closing then returned the reader to
  a place they never chose. `html:has(dialog[open])` states it once for any
  overlay; `scrollbar-gutter: stable` is the other half, because taking the
  scrollbar away would otherwise shift the page sideways, and this layout does
  not move.
- **`/scripture/` shipped forty-four tab stops that could not be used.** Its
  tables carry no `min-width`, so they fit at every width from 375px up, and
  each wrapper's unconditional `tabindex="0"` made better than one in ten of
  the page's stops a dead end announced as a group with nothing inside it to
  do. `ScrollRegion` now measures: the server still renders the stop, so a
  reader without scripting keeps it, and a `ResizeObserver` withdraws it only
  while there is nothing to scroll. The stop returns at 320px, where the same
  tables really do overflow — the point is to honour WCAG 2.1.1, not to tidy
  the tab order past it.

Four end-to-end tests cover these, including the 320px case, so the fix cannot
quietly become a regression in the other direction.

### Gap sweep 7 (completed tree)

Two angles over the tree at `6f3e387`: regressions in the two commits sweep 6
produced, and what remained of the class sweep 6 kept finding — statements the
site makes about itself. Eight findings confirmed: one omission the new guard
was structurally unable to see, six older claims that are not true, and one
defect in code this branch had just added — the scroll lock that was not
scoped to the screen.

- **The heading guard could only fail in one direction, and the other one was
  already broken.** It checked that every claimed heading is rendered, so a
  heading left out was invisible to it — and one was. `Open questions` is a
  real `h2` on 23 of the 27 topics, rendered by a `Callout` with `as="h2"`, and
  no list ever claimed it, so searching its wording matched nothing in the
  headings. The index claims it now, and the guard checks both directions for
  the two templated kinds. Two details had to be right for that to work: the
  callout puts its tone glyph in an `aria-hidden` span *inside* the heading, so
  the parser now drops what assistive technology drops, and the four
  subheadings under "How the passage is interpreted" are the same on all
  eighteen passages, so they are left out for the same reason the chrome is —
  indexing them would match every passage on "the conditionalist reading".
- **`/scripture/` claimed to be something it is not.** "Every Scripture
  reference used anywhere in the case" is drawn only from what each section
  records in `primaryPassages` and `relatedPassages`; references written into
  the prose as `<Scripture reference="…" />` never reach it. Hebrews 12:26-29
  is quoted three times on `/case/biblical-patterns/fire-consumes/` and has no
  row at all, and the Genesis 1:26-27 row reports one appearance where two
  parts quote it in full. The wording now says what the index is, and says
  plainly that a verse quoted in passing may not have a row. **Making the claim
  true instead — walking the MDX bodies and merging what they cite — would add
  rows and change published counts, which is the author's call, not a
  refinement. It is the recommendation attached to this sweep.**
- **`/glossary/` had rotted exactly as `/passages/` had**, describing itself as
  running "from annihilationism to the second death" when it runs from
  *aionios* to *Unquenchable Fire*. Both bookends are read off the registry now,
  the fix `/passages/` already had.
- **`/original-document/` published a page count the site contradicts twice
  over**, saying the material was reorganised into thirty-nine pages where the
  case hub says thirty-seven parts and forty entries. Thirty-nine is neither.
- **The 404 promised something the site says elsewhere is not true.** "Every
  part of the original document is published somewhere here" is contradicted by
  `/original-document/`'s own section headed "What is deliberately not
  published", and by `/privacy/`. It now says nothing has been *lost*, and
  points to where the withheld material is listed.
- **`/about/` named three problems and called them four**, above four bullets.
  The fourth — that a single argument could not be found inside a fifty-two page
  file — is now named with the others.
- **`ScrollRegion`'s docstring became false when the component changed.** It
  said the MDX pipeline gets the same treatment, and after the `tabindex`
  became conditional it no longer does, because a rehype pass emits HTML rather
  than a component that can measure itself. The docstring says so, with the
  condition under which that would need revisiting.
- **The new scroll lock was not scoped to the screen.** The print block hides
  dialogs without clearing their `open` attribute, so `:has()` would still have
  matched while printing with an overlay open.

Considered and left alone: `/start/what-is-conditional-immortality/` says it
clears away "four things it is regularly mistaken for" and carries three
headed sections. The fourth is addressed in prose inside the second, so the
count is defensible and rewording it would be an editorial preference rather
than a correction.

### Gap sweep 8 (completed tree)

Two angles over the tree at `0398656`: code paths no test exercises, and
whether the branch's own documentation tells the truth about the branch.
Nineteen findings confirmed — four in the code, fifteen in the documentation,
which by then was the least accurate thing in the tree.

The correction form is the serious one, and it fails in the way this whole
audit is about: the promise was in the docstring, and nobody had checked it.

- **The form did not work without JavaScript, on the site that promises it
  does.** The API route's own comment says "It works without JavaScript. A
  form-encoded POST is answered with a 303 redirect back to the corrections
  page." It was answered with a redirect to a page that says nothing.
  `/corrections/` was statically prerendered and read its query string in the
  browser inside a Suspense boundary — deliberately, so the route could stay
  static. A static page cannot vary by query string, so the server sent the
  same bytes to everyone: `curl` proves `/corrections/?submitted=1` and
  `/corrections/` are byte-identical. A reader without scripting submitted a
  correction, was redirected back, and saw a page that looked untouched. No
  confirmation, no error, and the `?section=S04` every section page's feedback
  link carries dropped from the hidden field, so the author received
  corrections with no page attached. The natural response to silence is to
  send it again; five times, and the rate limit locks them out for ten
  minutes. The page resolves its own query string on the server now, which
  costs this route its prerendering — the same price `/search/` already pays,
  for the same reason.
- **A storage failure was reported to that reader as their own mistake.** Both
  a schema rejection and a failed write redirected to `?submitted=0`, which
  says the values could not be accepted and to check the wording. A reader
  whose text was fine was told to fix it and resend, into a failure that would
  repeat identically. The scripted path had always drawn the distinction; only
  the redirect threw it away. There is a third state now.
- **The client and server validators disagreed, and discarded whole
  corrections over an optional field.** The form's comment calls them mirrors
  of the server schema. The browser accepted anything non-space either side of
  an `@`; the server used Zod's ASCII-only rule, so `josé@münchen.de` passed
  every check the reader could see and then returned a 400 naming a field they
  did not have to fill in — with Zod's raw string, on a form whose brief is
  prose "phrased for a reader rather than for a log", and with no field marked,
  so focus never moved. Both sides now call the same predicates, which live in
  the dependency-free vocabulary module because the client cannot import Zod.
- **Two appendix headings could not be linked or found.** `Callout` put its
  `id` on the `aside` rather than the heading, and `extractHeadings` reads
  markdown only, so the level-2 callout each appendix opens with — the caveat
  saying the page proves nothing about what Scripture teaches — had no id at
  all and "On this page" began at the second heading. The id is on the heading
  now, and a test fails if a level-2 callout lacks one or is missing from the
  extracted headings.

Deliberately bounded: the thirty level-3 callouts across twenty-four pages get
the same id treatment and stay out of "On this page". Listing every aside
would change what a contents list is for, which is an editorial decision
rather than a correction.

Two consequences of that fix were caught by the chain rather than a sweep, and
both were about measuring the right thing:

- **The link check called every feedback link broken.** It walks built HTML
  files, and `/corrections/` no longer produces one, so 290-odd links to it
  failed. It already carries a list of routes that legitimately have no static
  file — `/search/`, `/og`, the download handlers — and `/corrections/` has
  joined it for the same reason. The `#form` anchor those links end in is no
  longer covered by that check, so an end-to-end assertion covers it instead.
- **An axe route was failing intermittently on a contrast ratio nothing
  renders.** `/sources/` reported 4.14:1 on the filter panel at the mobile
  viewport, against a 4.5:1 threshold. The settled colours give 6.26:1; axe was
  sampling 83% of the way through the panel's Tier 3 `reveal-fade`, and the
  implied alpha was identical to three decimal places on all three channels,
  which is compositing rather than a colour. The suite now waits for arrival
  animations to finish before measuring. That is the honest measurement, not a
  softened one: the settled state is the only state a reader ever sees, and
  the intermittency was hiding whether the route passed at all.

The documentation findings are recorded in the commit that fixes them. The
worst was that the README still carried the sentence sweep 6 disproved —
"Search runs in the browser and no query is transmitted" — because that sweep
corrected `/privacy/`, `/search/`, the index builder and the implementation
report, and missed the one place left. The second worst was in this document:
it said the ranking-baseline correction moved 25 of 30 queries when 25 are
byte-identical and five moved, a figure carried over from a measurement taken
with the wrong limit and repeated in the pin's own docstring.

### Gap sweep 9 (completed tree)

One angle over the tree at `aec0c5e`, aimed at the four newest and least
reviewed changes. Three findings confirmed, and two of them are the sweep-8
fix being incomplete in the way this run keeps producing: the defect was
addressed where it was described rather than where it was felt.

- **The answer was moved off screen rather than supplied.** The redirects
  carried no fragment, so a reader without scripting landed at the top of a
  page whose status message sits at y=2090 on an 812px viewport — two and a
  half screens down. The first screen was the unchanged top of the corrections
  page, which is the exact thing the fix was written to prevent, and
  `aria-live` announced nothing either because the message is present at load
  rather than inserted. **The three tests added alongside could not see it:
  Playwright's `toBeVisible` asks for a non-empty box, not for anything in the
  viewport, so all three passed with the message two thousand pixels away.**
  The status region has a stable id now, the redirects point at it, and the
  tests assert `toBeInViewport`. Driven with scripting off: the browser lands
  at `scrollY: 2011` with the message at `top: 80`.
- **A failed submission dropped the context it told the reader to resend
  with.** `FAILURE_REDIRECT` was a constant, so a reader who arrived from
  `?section=S04&heading=the-text&type=broken-link`, was told "the values sent
  could not be accepted… send it again", and did — sent it from a form that
  had silently reset to no section, no heading, and "factual correction". The
  retry reached the author with no page attached and the wrong label: the
  original harm, reappearing on the one path where a reader is explicitly
  *told* to try again. Failure redirects are built from the submitted body
  now, and the round trip is asserted end to end.
- **The animation wait went to sixteen of the eighteen axe tests and missed
  the two that animate.** `settle()` was called in the route loop; the two
  dialog tests called axe directly, sampling the nav sheet at 8% and the search
  panel at 17% of a 200ms transition — the regime that produced the false
  reading it was written to remove, on the only two tests where something is
  deliberately animated into view.

Also corrected while in there: `extractHeadings` was seeding its slugger with
callout ids, which would have made a later markdown heading of the same slug
come out `open-questions-1` where the rendered page says `open-questions`.
Unreachable from any content in the tree, and the link check would have caught
it, but the function's stated contract is to agree with `rehype-slug`
character for character.

### Gap sweep 10 (completed tree)

Two angles over the tree at `d714155`: the newest changes, and the whole diff
read as a pull request to approve or reject. Seven findings confirmed. The
first is the fourth consecutive instance of one pattern, and by now the pattern
is the finding.

- **The confirmation was fixed for the reader without scripting and left
  broken for the reader with it.** The status region sits above the form. A
  scriptless submission navigates, so the redirect's `#submission-status`
  fragment carries the reader to it. A scripted submission intercepts the
  event: nothing navigates, nothing scrolls, and the receipt renders a full
  screen *above* the reader — measured at 987px above the top of an 812px
  viewport, with the reader still looking at the Send button and their text
  gone from the textarea. Same defect as sweep 9's, opposite direction, on the
  path most readers take. Every outcome was affected: success, rejection,
  storage failure and rate limit.

  **And the test that covers it is the assertion sweep 9's own commit message
  called insufficient.** `toBeVisible` was upgraded to `toBeInViewport` in the
  three scriptless tests and left alone in the scripted one. Focus now moves to
  the result once it settles, which scrolls it into view and gives a keyboard
  reader somewhere to carry on from; the test asserts both.
- **The rate-limit page was the third failure path, and still threw the context
  away.** Sweep 9 rebuilt two of the three no-JS failures from the submitted
  body and missed the 429, whose only way back was a bare `/corrections/`. On
  the one path that most explicitly says "try again", the retry arrived with no
  page attached and relabelled.
- **"As they left it" was not true.** The docstring promised the failure
  redirect returns the reader to the form they came from as they left it; the
  message, source address, name, email and consent choice are all gone.
  Carrying an eight-thousand-character correction through a query string would
  put it in browser history and every proxy log on the way, so the honest fix
  is the copy: the failure messages now say the text was not kept, and the
  docstring says what it does.
- **Correcting the search index cost `/start/compare-the-views/` its
  findability.** Four of the labels removed as phantom headings were not
  phantoms at all — they are the row headers of the comparison table, real text
  on the page — and deleting them without moving them into the body dropped the
  one page whose whole job is that comparison from the first page of results
  for "resurrection" and "ect" to fifteenth. All seven row labels are in the
  body now. This is the third legitimate regeneration of the ranking baseline,
  and it puts the page back where it belongs.
- **Promoting the appendix callouts to level 2 drew a rule inside the box.**
  `.prose-article h2` gives headings a bottom border and padding; the callout's
  own utilities overrode the margins and contested nothing else, so both
  appendices gained a full-width line under the caution label — and the same
  passage rendered differently on `/full-case/`, where it demotes back to `h3`,
  on a page whose footer invites readers to report exactly that. Stated for
  every level rather than the one that showed it.
- **`settle()` waited for nothing on the route it was written for.** The
  `/sources/` filter panel is a client-only control that mounts after
  hydration, so `document.getAnimations()` was empty every time and the wait
  returned before the panel existed. The route's pass was still decided by a
  race. It now waits for the revealing elements to reach full opacity first.
- Smaller: a status-id constant exported for the server to use that nothing
  imported, beside a literal in the server that had to match it; half a print
  selector matching a class the codebase never sets, pinned in place by its own
  test; an unused prop; and two code comments that described behaviour the code
  does not have.

The focus fix then put `/corrections/` 77 bytes over its first-load budget, on
a route that had 201 bytes of headroom. The budget was not widened. The five
status branches in the submit handler each set the status and the detail and
returned; they now go through one `settle` call that also moves focus, which
removed the separate effect and the render-guard ref along with the
duplication. 679,930 bytes against 680,000, and the shorter path is the better
one regardless.

### Gap sweep 11 (completed tree)

The pattern recurred a sixth time, and the sweep was aimed at finding it.

- **Paging the search results moved focus somewhere with no pixels in it.**
  `FocusOnArrivalLink` declined to scroll and left it to the router, which was
  right on `/watch/` only by coincidence: the player sits near the top, and
  the router scrolls to the top of the document. On `/search/` the heading,
  the form and the filters fill the first 840px, so at 375px wide the results
  section begins below an 812px fold. Focus went there and its ring went with
  it, the count line — the only evidence the page had changed — was bisected by
  the fold with the top half of the letters showing, and the first result sat
  75px past it. **The assertion was `toBeFocused`: presence of focus standing
  in for perceivability, the same substitution as the two before it.** The
  three sibling assertions had been upgraded to `toBeInViewport` and this one
  had not.

  Scrolling the element in by hand does not fix it — the router resets the
  scroll after the navigation commits and undoes it, which the upgraded test
  then caught. The href carries a fragment now, which is what the router
  honours; it lands on `scroll-padding-top` clear of the header, and makes a
  page of results something a reader can link to. Both call sites assert
  `toBeInViewport`.
- Also removed: a print selector for a class nothing in the tree sets.

Everything else the sweep measured came back sound, including every other
place this branch moves focus — the correction form at every outcome and both
viewports, all four no-JS redirect landings, the 429 retry, the transcript
timestamps, video activation, the skip link, both dialogs — each landing clear
of the sticky header.

The second angle walked nine complete reader journeys in a browser rather than
reading code, at both viewports and in both motion preferences, and found five
things ten code-focused sweeps had not:

- **Printing silently dropped the contents of every collapsed disclosure**,
  while `/accessibility/` told the reader that "disclosures are opened so that
  nothing is lost inside a collapsed section". The print block reverts
  `display` on the children, and the browser's own stylesheet collapses
  `::details-content`, which no rule on the children can reach. Measured, a
  disclosure 49px tall on paper whose content is 3,902px, 4,848 characters and
  four tables. The stylesheet carried a comment asserting this could not
  happen and describing exactly what it would look like if it did. The
  pseudo-element is overridden now, and a test prints the page and fails if a
  disclosure carries only its summary.

  The motion contract had the same false premise, and forbade every
  `::details-content` rule on the strength of it — so the fix failed the guard
  written to protect the thing the fix protects. It now says what its own name
  always meant: nothing may collapse the pseudo-element, and print must
  actively un-collapse it. That is a stronger gate than the one it replaces,
  which could be satisfied by a stylesheet that simply never mentioned it.
- **A transcript timestamp did nothing once the video was playing.** The start
  offset is read when play is pressed, so in the order a reader actually uses
  the page — press play, watch, scroll down, click a timestamp — the iframe
  was rebuilt with a byte-identical source. The video carried on where it was
  while the page pulled the reader back up to the player, and nothing said the
  seek had not happened. One control did two different things depending on
  invisible prior state, and failed silently in the commoner order.
- **Filtering the Scripture index left forty-four book links pointing at
  hidden sections.** Forty-three of them moved nothing, added a fragment to
  the address bar, and said nothing about why.
- **A filter matching nothing left two headings counting references that were
  not there** — "Old Testament, 64 references" above an empty space.
  `/search/` answers the same situation in prose; this one now does too.
- **Escape in the search panel destroyed the query instead of closing the
  panel.** A search field consumes the first Escape to clear itself, so a
  reader who had typed something lost it and kept the panel, needing a second
  press to leave — and the behaviour changed precisely when there was
  something to lose. **This reverses a decision recorded in the test suite**,
  that the clearing is the platform's affordance and the dialog should not
  fight it. Driven as a reader uses it, the dismissal is worth more than the
  clear, and it is what the ARIA authoring practices describe. The
  accessibility statement says what the one line of script is for.

The same sweep confirmed 2,715 fragment links across 120 routes with none
broken, the full 38-page previous and next chain, all three search paths, and
no console error on any journey.

### Gap sweep 12 (completed tree)

Two angles over the tree at `e1d672f`: the newest work read for the recurring
pattern, and the two readers the site makes explicit promises to and that code
review cannot simulate — someone printing, and someone with scripting off.
Eleven findings.

The pattern recurred a seventh time, in the seek added one sweep earlier:

- **The seek was modelled as a value, not a request.** React bails out when the
  next state equals the current one, so the frame was never rebuilt whenever
  the requested offset was the one already held. That is two of the commonest
  requests there are: the 0:00 chapter, which matches the initial state, and
  pressing any timestamp a second time to hear a passage again. Both did
  nothing, silently, while the page scrolled the reader back to the player.
  **The test written for the fix excluded the broken case by hand** — its
  comment reads "the opening chapter starts at zero, which appends nothing".
  A seek now carries a request count that keys the frame.
- **And the test still could not see it.** Rewritten to count `load` events, it
  passed against a deliberately reverted build; the only honest observable is
  node identity, because a repeat seek produces a byte-identical `src`. It
  marks the element and looks for the mark afterwards, and was confirmed to
  fail against the reverted build before being accepted.

Two more from the same angle: **the Scripture headings still counted the
unfiltered index** for every filter that matches something — "New Testament,
144 references" above two rows — where the previous fix had only handled the
zero case; and the new empty-state prose sat outside every live region, so a
screen-reader user heard the count and not the way out.

The print and no-JS reader found five things ten code sweeps had not:

- **The play button silently did nothing without scripting**, on the home page
  and `/watch/`: an 830x466 control producing no request, no iframe and no
  explanation. It is a link to the video now, upgraded in place once the script
  that can load the player has run.

  The first attempt rendered a link and swapped it for a button at hydration,
  which fixed the reported defect and introduced a subtler one: the swap
  replaces the DOM node, so a reader already focused on the poster loses focus
  to the body. The keyboard-reachability test caught it as a flake in the very
  next chain — the probe it had written onto the element went with the element.
  One element throughout, with the click intercepted when it can be, has
  neither problem, and is the shape the search trigger already uses.
- **`/corrections/` printed a page and a half of dead form controls** —
  a select, a textarea, three text fields, three radios and "Send submission" —
  under a statement promising interactive controls are removed from the printed
  copy. Forms are dropped from print now, and the page prints the address to
  visit instead.
- **`/watch/` printed three pages of chapter navigation** addressing a player
  the same stylesheet removes, and `/changelog/` printed a "Changes by part"
  nav. Both against the same claim. They were the only two navigation panels
  that printed.
- **A glossary term label was left on the page before its list.** Print kept
  headings with what follows them but not `dt`.

Considered and left: one external link on `/watch/` prints as
"rethinkinghell.com (https://rethinkinghell.com/)", because the link text is
the host and print appends the address. The claim that destinations are
printed after the link text is true, the duplication is mild, and the sibling
link where it matters — `youtu.be` — genuinely gains the video id from it.

### Gap sweep 13 (completed tree)

Two angles over the tree at `b934a5d`: the pattern in the newest work, and a
gap in the suite's own shape — `test:e2e` and `test:a11y` run Chromium only,
while this branch leans on `:has()`, `::details-content`, `scrollbar-gutter`,
`@starting-style` and `allow-discrete`. Four findings.

- **A Firefox reader was printing empty boxes, and every gate read green.**
  The print fix forces `content-visibility: visible` on `::details-content`.
  Measured in all three engines: Chromium 3,902px and WebKit 3,733px with the
  rule against 49px without it, and Firefox 52px either way. Firefox sees the
  selector — an author `background-color` on that pseudo-element applies — and
  declines `content-visibility` on it specifically, with `visible`, with
  `auto`, and with `display` alongside. No engine prints correctly without the
  rule, so this was never "Firefox is already fine". Two pages carry a closed
  disclosure with real content: 5,612 characters and four tables between them,
  under a statement that nothing is lost inside a collapsed section.

  The `open` attribute is the one lever that measures the same everywhere, and
  no selector can set an attribute, so a `beforeprint` handler opens closed
  disclosures and restores them afterwards. The CSS stays and does the work
  where scripting is off.

  **The gate could not have caught this in any engine.** It asserts the rule is
  present in the stylesheet, which it is. A new print suite measures rendered
  output on both affected pages in Chromium, Firefox and WebKit, and runs in
  CI beside the others.

  The handler sits in the root layout, so every route carries it, and 585 of
  those bytes put `/corrections/` over its first-load budget. That budget was
  raised by a kilobyte rather than worked around, with the reason recorded
  beside it. The earlier increase in this branch was refused and the bytes
  found in the code instead; this one is shared infrastructure fixing a
  correctness bug on every page, which is the kind of growth a budget exists
  to surface and then permit once it has been argued for.
- **The poster link threw away the moment the reader asked for.** Its `href`
  was a constant, so everything that follows it as a link rather than running
  its handler — Ctrl or middle click, "open in a new tab", dragging it, the
  address shown in the status bar — offered the video from the beginning,
  while a plain click on the same element in the same state started at the
  requested moment. Thirty-eight of the thirty-nine timestamps disagreed with
  their own poster. The href tracks the requested offset now.

  Two things had to be right for that: the offset is read after hydration, so
  the route stays prerendered, and it is updated on every seek rather than
  once at mount, because a timestamp is a soft navigation that never remounts
  the player. The first attempt did only the former and measured unchanged.
- **`/watch/` printed a sentence promising two things paper does not carry** —
  a player at the top of the page and a per-moment link, both removed by the
  print stylesheet. The printed copy names the video's address instead.
- **A narrowed Scripture index printed with no number on it at all.** Hiding
  the stale reference counts was right on screen, where the status line says
  how many are showing; that line lives in the filter panel, which print
  drops. The rule is scoped to screen.

Everything else the cross-engine sweep measured came back equivalent, and it
is worth recording what that covered: the `:has()` scroll lock holds in all
three (stripping it lets 1,364-1,600px of background scroll through);
`@starting-style` enter animations, `scroll-padding-top`, `:focus-visible`
rings, native dialog focus and Escape, search end to end, the no-JS correction
form and the video poster are identical everywhere. Firefox lacking
`text-wrap: pretty` and the Chromium-only exit transition cost a reader
nothing. WebKit not tabbing to links is Safari's own preference, not a site
defect.

### Gap sweep 14 (completed tree)

Two angles over the tree at `ea67178`. The pattern recurred a ninth time, and
this time it was in the print fix from one sweep earlier — along with both
tests written to guard it.

- **The print handler never closed what it opened.** A real print fires two
  signals, `beforeprint` and the media-query change, and the component
  subscribes to both on purpose because engines differ over which they send.
  The open pass reassigned its record rather than adding to it, so the second
  signal found everything already open, collected nothing, and replaced the
  record with an empty one. Restoring then closed nothing. Measured through
  Chromium's real print pipeline: a disclosure at 52px before, 4,073px after,
  and every subsequent print left it that way. Its own docstring stated the
  requirement it broke — "a reader who prints and carries on reading should
  find the page as they left it". `/search/`'s filter panel was affected too:
  a reader who collapsed it and printed found it open afterwards, permanently.
- **The new print suite could not see it, by construction.** It drove only
  `emulateMedia`, which dispatches no `beforeprint` — the one signal that
  works in isolation — and never looked at the page again afterwards. It now
  drives both signals and asserts the disclosures return to how it found them.
  Confirmed failing against the reverted handler in Chromium and Firefox
  before being accepted.
- **Its content assertion could not fail either.** `textContent` reads the
  whole subtree whether or not any of it is laid out, so a disclosure printing
  29 characters of summary measured 4,848. Both pages cleared the threshold in
  the broken state; only the height check was doing anything. It reads
  `innerText` now, which measures 29 against 5,050. **The "5,612 characters"
  quoted as evidence in the previous sweep's commit message was that same
  inert number.**
- **The poster href and a plain click disagreed again, after Back.** The href
  derives from state written on mount and on each seek; the click reads the
  address bar live. They agree only while history moves forward. Pressing Back
  after a timestamp left the href pointing at the moment the reader had just
  undone — the divergence the previous sweep closed, with the polarity
  reversed. The offset resyncs on `popstate`, and the guard follows the reader
  back rather than only forward.

The second angle exercised what no earlier sweep had: state that persists or
accumulates, across tabs, reloads and the browser's own Back and Forward. Nine
findings, and unlike the recent sweeps these are mostly not from this branch's
own fixes.

- **A second tab destroyed the first tab's reading record.** The record was
  written from memory rather than from storage, so a tab that had loaded
  before any reading held an empty list; one click there replaced four
  recorded parts with one, and the first tab then reported "you have opened 1
  of 40". Storage is the shared thing, so it is read before it is written, and
  a `storage` listener keeps a second tab from showing a stale count.
- **Search filters reapplied themselves after a soft navigation.** The
  checkboxes and the book select are uncontrolled defaults, which React sets
  once and never reapplies. On a URL carrying no filters the query field
  updated and the controls did not: 81 unfiltered results under a ticked
  "Objections", a ticked "Key texts" and a selected book, with the disclosure
  holding the last two closed. Pressing Search then applied three filters the
  reader never asked for. The form is keyed on the parameters it was rendered
  from, so the defaults mean what they say.
- **The search index was downloaded twice, 1.2MB instead of 610kB.** Two
  prewarm calls arrive inside one gesture — `pointerenter`, then the anchor's
  `focus`, eight milliseconds apart on a tap — and the guard was React state
  that had not committed between them. Every touch tap and every Ctrl+K paid
  it. The guard is a ref now.
- **The correction form kept saying "Received" over text it had not sent.** A
  submit stopped by the client validators never reaches the handler that sets
  the status, so the banner from the previous successful submission stayed
  above the new inline error. The outcome is cleared when a submit is
  attempted.
- **Reading progress claimed records it had not kept, and counted parts that
  are not there.** With storage full the panel reported a part as opened and
  the next load reported none; the count came from stored ids rather than ids
  the page can mark, so four valid-looking ids of which one was present read
  "4 of 40 parts, each one marked below" above a single marker, and
  forty-five read "45 of 40". The write reports failure, and the count is
  bounded by the page.

Three findings are recorded and deliberately not implemented:

- **Back does not rewind the video.** After a seek, Back returns the URL to
  the previous `?t=` while the player keeps playing where it was. Reported as
  the two disagreeing; on consideration `?t=` means "start here", not
  "currently at", and no reader expects Back to scrub a video they are
  watching. The href and the click were made to agree, which was the real
  defect; rewinding on history navigation would be a new behaviour, not a
  correction.
- **Back from a transcript timestamp does not restore the reader's place**
  in the transcript, leaving them at the player. Real, and worth fixing, but
  the fix is in scroll restoration around a query-and-fragment navigation —
  the same mechanism two earlier sweeps had to correct twice — and getting it
  wrong again costs more than the annoyance does.
- **Back from a filtered Scripture index restores the scroll offset but not
  the filter**, so the reader lands somewhere unrelated in a much longer page.
  The honest fix is to put the filter in the URL, which is a design change to
  a progressive enhancement rather than a correction to one.

### Gap sweep 15 (completed tree)

Two angles over the tree at `856da6f`: the pattern in the previous sweep's
fixes, and the last unswept surface — everything the site serves that is not
an HTML page. Instances ten and eleven of the pattern, and eight findings on
the handlers.

Both new instances were in the previous sweep's own fixes, and both had tests
that could not see them:

- **One dropped request ended search for the whole session.** The ref that
  stopped the index being fetched twice was set before the request and released
  nowhere, so after a failure the guard rejected every retry — while the pane
  said "Reopen search to try again" and the code comment promised the next
  keystroke retries. Measured: one aborted fetch, then reopening, hovering,
  focusing, typing and navigating produced no further request at all; a hard
  reload proved the index and the network were fine. **The test written for the
  double fetch asserts the count is 1 on the success path, which is exactly
  what a permanently latched guard produces.** The guard is released on the
  only path that leaves no index, and a test now fails the first fetch and
  requires the second to work.
- **The form key was not injective.** Joined with commas, searching for the
  phrase `hell,objection` produced the same key as searching `hell` with the
  Objections filter on, so the form did not remount and the reader got the
  filtered form over unfiltered results — the same defect, the same 81
  results, that the key was added to prevent. **And its test used two
  `page.goto` calls, which are full loads: it passed identically with the key
  deleted.** The key is a `JSON.stringify` of the parameters, extracted so its
  injectivity is a unit test rather than a browser one, and the end-to-end
  check now drives a real soft navigation.
- The progress count was bounded by page membership but not deduplicated, so
  one id stored forty-five times still read "45 of 40 parts" — the sentence the
  previous commit said it had retired, under a test named for an invariant the
  code did not hold.

The handlers, none of which any page test touches:

- **The transcript altered the published wording, on both surfaces that
  promise it did not.** Paragraphs were split on every full stop, including the
  ones inside numbers and domains, so "about 0.00001%" became a paragraph
  ending "about 0." followed by an orphan "00001%," and "rethinking hell.com"
  became "rethinking hell. com". Sentences now end where terminal punctuation
  is followed by a space, and a chapter that stops mid-sentence keeps its
  fragment attached. The test is the whole promise: every chapter's paragraphs,
  rejoined, equal the published cue text exactly.
- **`/og` returned no HTTP response at all for an Arabic title** — the socket
  closed with nothing written, which is worse than an error. `ImageResponse`
  streams, so the failure lands after the handler returns and a guard around
  the constructor catches nothing; the bytes are buffered now and a card that
  cannot be drawn is answered with the plain one.
- **`/og` claimed it "never contacts a third party" and does.** The renderer
  fetches a font from Google and an emoji sprite from a CDN for scripts its
  bundled subset lacks. True of every card this site emits, false in general,
  and `title` comes from a query string. The claim now says which is which.
- **The search index was re-downloaded in full on every visit** — 610kB each
  time, 1.8MB for three — because `must-revalidate` had no validator to
  revalidate against, while `/privacy/` called it "a single file downloaded the
  first time you open search". It carries an ETag and an hour of freshness.
- **The content security policy allowed a host the site never uses.**
  `i.ytimg.com` was permitted for YouTube thumbnails that the click-to-load
  poster deliberately does not load — its own comment says so — against the
  header's statement that the only external origin ever contacted is YouTube's
  privacy-enhanced domain.

Recorded, not implemented: `/og` will put arbitrary text on a card branded with
the site and the author, which is a property of every open card renderer and
would need an allowlist of published titles to close; route-handler responses
are served uncompressed, which is a deployment concern rather than a code one;
and the site ships no favicon, so every tab request costs a 404. Each is
written up with its measurement.

### Gap sweep 16 (follow-up branch)

The pattern recurred a twelfth time, in the transcript fix from the sweep
before, and it is the clearest instance of the whole run.

- **The trailing-fragment merge deleted a third of the transcript's paragraph
  breaks.** The comment describes moving a stray word into the sentence it came
  from. The code tested the last *paragraph* and merged the last *two
  paragraphs* — and 35 of the 39 chapters end without terminal punctuation,
  because a chapter boundary is a timestamp, so it fired almost everywhere. The
  transcript went from 112 paragraphs to 79, twenty-one chapters became a
  single unbroken block, and one paragraph reached 195 words where the captions
  gave two. Every word was still present, which is the promise the code exists
  to keep; the reflow a reader can follow was gone. It now merges only when the
  stray sentence is the whole of the last paragraph: 100 paragraphs, seven
  single-block chapters, longest 127 words, and every word still present.
- **The test could not tell three implementations apart.** Shipped, described,
  and "collapse the entire chapter into one paragraph" all passed every
  assertion, because the new checks were rejoin-equality, which is blind to
  grouping, and a fixture that returns a single paragraph — so the test named
  for attaching a fragment "to the sentence before it" passed on output where
  no preceding paragraph survived. The tests now assert exact paragraph arrays,
  including a chapter that ends mid-sentence with the fragment sharing its
  paragraph, and were confirmed to fail against both wrong implementations
  before being accepted.

The same sweep widened past the branch's own diff to the two things every
route inherits: the words the site counts itself in, and the Scripture it
quotes.

- **Four verses were misquoted, in the one file whose docstring says that
  cannot happen.** `web-text.ts` opens by explaining that every full Scripture
  display renders from this corpus because "no author ever types a verse by
  hand, which removes any possibility of a misquoted or misremembered passage
  reaching a page". Four of them had lost the space after a comma or a full
  stop — `sorcerers,idolaters` (Revelation 21:8), `denarii,and he grabbed`
  (Matthew 18:28), `commandments,that they may` (Revelation 22:14) and
  `Gehenna.Yes, I tell you` (Luke 12:5) — reaching eight routes under an
  attribution naming the World English Bible. The project's own migration
  ledger carries the correct text for the one verse it covers; the other three
  need no second copy of the Bible, because punctuation is never immediately
  followed by a letter in running prose. That is the whole class, so the guard
  is the class: no quotation in the corpus may run punctuation into the next
  word, carry a doubled space, or put a space before punctuation. It was
  confirmed failing against each defect before being accepted.
- **The site gave readers two different totals under one noun.** The homepage,
  the 404, `/start/` and the header nav all send a reader to "thirty-seven
  parts". The hub's own first sentence defines them — three roadblocks and
  thirty-four numbered arguments, "with a preface and two appendices alongside
  them" — and then, three screens down, headed its list "All 40 parts", said
  "Everything in the forty parts", and counted progress "of 40 parts". Both
  numbers are true and the unit test pins both; what could not stand is the one
  word carrying both, so a reader given 37 and shown 40 had no way to tell
  which was wrong. "Parts" now always means the 37. The 40 entries are pages,
  which is what the hub already called them in "Twelve pages, in this order"
  and "each page is". Guarded end to end: no route may say "40 parts".
- **And the progress panel's two numbers came from two sources.** "You have
  opened X of Y pages from this list. Each one is marked as Opened below" took
  Y from a registry prop and X from the DOM, so the sentence was true by
  coincidence rather than by construction — the previous sweep had bounded and
  deduplicated the numerator and left the denominator on the other source.
  Both are now measured from the rendered list, which makes X ≤ Y hold
  structurally. Distinct ids, not nodes: the hub lists an essential-path
  section twice, so counting markers would have read "of 52 pages".

Everything else the sweep measured on this branch came back clean: all 118 OG
cards render in a mean 54ms with none hitting the fallback and the Arabic title
now answering 200; the index ETag is deterministic across processes and the
browser transfers 0 bytes on the second and third visits; releasing the fetch
guard in `catch` recovers in 61ms without bringing the double fetch back; and
removing `i.ytimg.com` from the policy refuses nothing, because no code, no
rendered page and no `next/image` call ever referenced it.

### Gap sweep 17 (follow-up branch)

Four independent finders. The sweep was not clean, and its largest finding is
the one the site's own promise names.

**The Scripture index did not hold what the pages set out.** `/scripture/` is
offered as "Every reference used anywhere in the case, with links to the
sections that treat it". It is built only from each section's declared
`primaryPassages` and `relatedPassages`; nothing reads the bodies. Eleven full
Scripture blocks are set out on a page that declares neither list entry for
them, and for seven the section is already on the row through a containing
reference it does declare — S04 sets out Matthew 25:46 and declares
Matthew 25:31-46, S22 sets out three parts of 1 Corinthians 15 and declares the
chapter — so a reader looking those up finds the page. Five are not covered at
all: RB2 sets out Genesis 1:26-27 and declares nothing in Genesis, RB3 quotes
1 Corinthians 15:24-26 and Hebrews 9:27 and declares nothing in either book, and
S28 quotes Revelation 2:7 and Revelation 22:1-5 while declaring only
Revelation 22:14-15. Those five are declared now, and the gate is coverage
rather than string equality, so the seven legitimate sub-ranges cost nothing and
a sixth cannot appear. Confirmed failing against each of the five.

The declaration moved one pinned ranking outcome: S28's document gained two
Revelation references, raising its score for "Revelation 14:11" from 439.567909
to 451.773203. Same total, same order, same matched fields and terms, and the
other 29 queries byte-identical. `ranking-invariants.test.ts` permits exactly
this — "correcting what is *indexed* legitimately moves it" — and requires the
diff inspected and explained, which until now meant reading a thirty-query
failure through a test reporter. `packages/ci-search/scripts/ranking-baseline.ts`
prints it per query and per row. It reports and does not write: rewriting the
snapshot reformatted 4,000 lines of JSON and turned one moved score into a
3,322-line diff, so the file was edited by hand, one line.

**The privacy page contradicted itself, two bullets apart.** The lede said "the
only information the site ever receives is what you deliberately type into the
correction form" and the last bullet of "The short version" repeated it, while
the bullet immediately above said the full results page "is an ordinary form, so
its term travels in the address", and the detailed section three screens down
said the term "reaches the server answering the request as any address does,
where it may appear in ordinary request logs". Both cannot be true, and a reader
who reads only the summary — which is what a summary is for — concludes that
typing into the site's search box sends nothing anywhere. The lede now names
both things the server receives, and the bullet says the form is the only place
the site *asks* for anything.

**`/accessibility/` undercounted what scripting-off costs.** It said "Three
features degrade rather than disappear" and named three that do. A fourth does —
the video becomes a link that opens on YouTube in a new tab rather than a player
that loads in place — and three panels are absent altogether, each behind an
`if (!mounted) return null`: the filters above the source library and the
Scripture index, and the reading-progress panel on the case map. None of the
four was named. The page now says which four degrade and which three are
missing, and adds the part a reader actually needs: every list those panels
would have narrowed is rendered complete, so their absence hides nothing. That
is what the new end-to-end test measures.

**A live region was created together with its message.** The recovery sentence
on `/scripture/` — the one naming the way out when a filter matches nothing —
carried its own `aria-live` and entered the DOM in the same mutation as its
text. A region must already be in the accessibility tree for a change inside it
to be announced, so a screen-reader user heard the count fall to zero and then
silence: exactly the silence the sentence was added to end. Its comment claimed
it was "inside a live region" when it was a sibling of one. The search dialog in
the same branch does this correctly and says so in its own comment. Both
sentences now sit inside one region mounted from the first render.

**The disclosure decision was documented three ways, two of them false.**
`docs/motion-brief.md` still said "the only configuration that opens correctly
is the one where no rule targets `::details-content` at all" and "print needs no
pseudo-element override because nothing collapses one", and `globals.css` still
said "print needs no workaround because nothing collapses them" — while the same
branch added the override and made the contract test require it. The brief was
edited in this diff, so the section was in scope and was left stale on a binding
document whose stated purpose is to answer "why not add X" for the next person.
All three agree now, and the brief lists the fourth test file that holds the line
and says why it cannot be in the fast suites.

**And the guard for it had been narrowed to three literal values.** Rewriting it
to permit the print override pinned it to `block-size`,
`content-visibility: hidden` and `overflow: hidden` by name, so `overflow: clip`
and `content-visibility: auto` — which collapse or clip the pseudo-element
identically — walked straight past. It is stated as the outcome now: outside
`@media print` no rule may target the pseudo-element at all, which is the
configuration Chromium 148 needs, and inside print the only rule on it must
un-collapse it. Confirmed failing against both values that used to slip through.

#### Four tests that could not fail, and one that raced

- **The no-scripting correction-form block never posted anything.** All five
  tests navigate to hand-written URLs, so they measure how `/corrections/` reads
  a query string and nothing about the redirect that produces it. Each passes
  against the defect it is named for: drop the fragment from `SUCCESS_REDIRECT`
  and the test supplies it itself; collapse the two failure outcomes into one
  and the test still visits both by hand; delete the echo loop entirely and the
  test still types `section=S04&heading=the-text&type=broken-link` itself.
  Reaching them meant posting a real submission through the rate limiter and the
  store, which is why they were written this way. The construction is a property
  of a string, so it moved to `api/feedback/redirects.ts` — a Next route module
  may export only its handlers, which is what made it untestable in place — and
  eight unit tests now hold it, including that the message, the name and the
  email never appear in a redirect.
- **The second-tab reading test could not see its own defect.** Its premise is a
  tab whose in-memory list is empty while storage holds four ids, but it seeded
  storage from the *other* tab, which fires `storage` — and the listener added
  in the same change resyncs the list before the click lands. A version that
  wrote from memory produced the same five ids and passed. Split in two: one
  test holds the cross-tab resync the listener exists for, the other seeds from
  the page under test, where no event fires and only a read-merge-write can
  produce five.
- **`content.spec.ts` measured a printed disclosure with `textContent`**, which
  reads the whole subtree whether or not any of it is laid out — the identical
  mistake `print.spec.ts` documents, in its own comment, as having "passed
  against exactly the defect this file exists to catch". Corrected there in the
  sweep before and left here. Now `innerText`, plus the rendered height.
- **`print.spec.ts` drove both print signals at once**, so either subscription
  could be deleted and whichever survived did the whole job. The component
  subscribes twice because the engines disagree about which signal they send,
  and Firefox is the reason. Now one test per signal per route, plus a third
  firing both, which is the re-entry case the restore guard exists for.
- **And the poster-link test raced the router.** `TranscriptTimestamp` fires the
  seek event synchronously from the link's `onNavigate`, so the poster's href is
  rebuilt from React state before the address bar has changed; the test asserted
  the href and then pressed Back, which depends on the address. It failed once in
  a full run with the page on `about:blank`, history still holding one entry. It
  waits for the URL now. Same shape as everything else in this list: an
  assertion on one surface, a dependency on another.

Two smaller things, both structural rather than reproducible. `/og`'s recovery
path awaited inside its `catch`, so a fault in the renderer itself — rather than
in the requested glyphs — would reject out of the handler and reproduce the
dropped socket the buffering was added to end; the last resort renders nothing at
all now. And P00 went on listing `sprinkle-introduction` in `sourceIds` after
that source was corrected to `citedBy: []` with the note that "it was listed
against P00, whose text never mentions it" — the only such disagreement among 33
sources, invisible because nothing renders `CaseSection.sourceIds`, and checked
in both directions now rather than one.

### Gap sweep 18 (follow-up branch)

Four finders again, one of them pointed at sweep 17's own commit. It found ten
things there, and it was right about nine. This sweep is **not clean**, and the
list of what remains open is at the end rather than absent.

#### Sweep 17's own residue

- **`covers()` tested intersection where it meant containment**, so a narrower
  declaration covered a wider display. S13 declares Hebrews 12:29 and sets out
  Hebrews 12:26-29 in full — its own summary line calls 12:26-29 a primary
  passage — so `/scripture/` held a row for the single verse and none for the
  three before it, and the check written the same hour to catch exactly that was
  green against it. The same slip in the other direction let a declared single
  verse stand for a whole chapter on the page. Containment now, and S13 declares
  what it sets out. This is the sixth instance of the finding it was written for,
  which means the count in that commit was five of six.
- **The same check skipped both appendices.** It read bodies from the `case`
  collection, and APP1 and APP2 live in `appendices/` — 189 and 202 lines,
  rendered through the same `SectionPage`, carrying `<Cite>` and `<Scripture>`
  blocks. `sources-cited.test.ts` skips them too, and states the premise:
  "the two appendices are built from structured data and have no body to read".
  It then asserts `caseSections.length - 2` to hold the premise in place. Both
  checks covered 38 of the 40 pages that can drift. `sectionCollection()` now
  answers where a body lives, and the size assertion is pinned to the registry:
  `BODIES.size > 30` was true of 38 and true of 40, so it could not tell them
  apart.
- **The privacy fix left the third instance standing** — the one the commit
  message itself names, three screens down: "the corrections form is the only
  place this site receives information from you, and it receives only what you
  type into it". Contradicted by the search term two sections above and by the
  part identifier that arrives with the link, described in the very next bullet.
  **And the rewritten summary bullet was still false**: "the only place the site
  asks you for anything", one bullet below "the full results page is an ordinary
  form, so its term travels in the address". A form with a field asking for a
  search term is the site asking. All three now say the same thing — what the
  site keeps on purpose — and a new end-to-end test counts the forms that submit
  to this origin and fails if a third appears, which is the moment the page needs
  rewriting. Nothing read privacy prose before, which is why three copies drifted
  and two survived a commit aimed at them.
- **`/accessibility/` still undercounted.** Sweep 17 corrected "three features
  degrade" to four and named three panels that disappear; a fourth control does,
  on the same page as one of them — the print button on the case map, behind the
  same `if (!mounted) return null`. The new test asserted only the three the copy
  named, so it could not fail against the identical undercount it was added to
  prevent. Four now, and the test asserts the button too.
- **Both reading-progress tests raced the panel.** `page.goto` resolves at
  `load`; the panel's one effect both seeds the in-memory list and registers the
  `storage` listener. Neither test waited for it, so a seed that landed first was
  picked up by the seeding read — which makes the cross-tab test pass with the
  listener deleted and the merge test pass against the memory-built write it
  names. Both wait for "No pages opened yet" now. The sibling file had just been
  given this exact fix; this one had not.
- **The `::details-content` guard had two evasions left.** Its rule matched
  `::details-content\s*\{`, so `details::details-content, .x { … }` was not
  matched at all, and its deny-list of five values let `max-height: 0`,
  `display: none`, `visibility: hidden` and `contain: strict` through. Every
  deny-list here has been short, so it is an allow-list now: enumerate every rule
  whose selector names the pseudo-element, require exactly one, require it to sit
  inside `@media print`, and require its declarations to be exactly
  `content-visibility: visible !important`. Confirmed failing against all four
  values above and against `overflow: clip` appended to the good rule.
- One finding was **wrong**: that the ranking-baseline reporter at
  `packages/ci-search/scripts/ranking-baseline.ts` is behind no gate, because `packages/ci-search/tsconfig.json` does not include it. The app's
  `tsc --noEmit` does compile it — it reported `TS2339` on `import.meta.dir` from
  that path, which is why the file uses `import.meta.url`.
- One is **recorded rather than fixed**: the both-signals print test cannot fail
  against removing the re-entry guard, because `opened` is a `const` Set that is
  never replaced and `openAll` skips anything already open, so the second call is
  a no-op either way. The failure the guard's comment describes cannot reproduce
  against the code as written. Both comments now say that, rather than leaving a
  test to imply coverage it does not have.

#### Elsewhere

- **`/search/` applied two filters it never validated.** `type` was checked
  against the allowed set; `group` and `book` were passed through, and an
  unrecognised value excludes every document. `?q=hell&book=matthew` — the
  canonical name is `Matthew` — returned "No results for hell" with advice about
  the wording, above a filter panel forced open because a book was selected and a
  select showing "Any book" because no option matched. Nothing on screen said a
  filter was on, and pressing Search cleared it, so the failure looked
  intermittent. Links go stale unaided too: `referencedBooks` is derived from the
  passages actually cited, so the last reference to a book leaving the case turns
  every shared URL naming it into a silent zero. Both are filtered against what
  the controls can offer, with `Object.hasOwn` rather than `in`, so
  `?group=constructor` is not a group.
- **`/corrections/?section=` was unbounded on the way in and bounded only on the
  way out.** The value fills a hidden field and the schema caps it at 16
  characters, so a longer one made every submission from that URL fail: with
  scripting, on a banner reading "Not recorded. Form: Too big", naming no control
  on the page because the rejected value is in the address bar; without it, on
  the message telling the reader to check wording that was never the problem,
  with their text gone. A section id is only ever put there by this site and
  always a real one, so it is checked against the registry now, and the heading is
  bounded where the schema bounds it.
- **`/topics/`'s bookends had rotted**, the third instance of a class this repo
  has fixed twice. Its description said the index runs "from Gehenna and Hades to
  the second death" while it runs from annihilationism to weeping and gnashing of
  teeth, with Gehenna tenth of twenty-seven. `/passages/` and `/glossary/` read
  theirs off the registry for exactly this reason; `/topics/` does now too. It is
  the `<meta name="description">`, so it is what a search result carries.
- **Two navigation surfaces promised what `/scripture/` disclaims.** The page
  says the index is drawn from the references each part records as its own, and
  that a verse quoted only in passing may not have a row — corrected in an
  earlier sweep. The narrow-screen menu still said "Every reference in the case"
  and `/start/` still said "Every reference used anywhere in the case". Both now
  say what the page says.
- `packages/ci-content/src/case/index.ts` described the essential path as sparing
  a reader "reading all thirty-nine". The registry holds forty. This ledger
  already records "thirty-nine" as a number that is neither of the two the site
  uses.

#### Found, evidenced, and left

These are real and are not fixed. Each needs an editorial or architectural
decision that belongs to the author, not to a refinement pass.

- **Every section page prints "Related sections and passages" twice**, once from
  the MDX body — which `docs/authoring-brief.md` mandates — and once from
  `section.relatedSections`. All 40 carry both. On 17 pages the first copy is
  plain text with no links while the registry copy below renders the same
  entries as working links; on 9 the two lists disagree about membership (S10's
  prose ends with a link to S01, which the registry list omits while adding S07).
  Resolving it means deciding which of the two is authoritative, and either
  removing a mandated heading from 40 bodies or reconciling 9 disagreements by
  hand.
- **Three passage records take their identity from the first range they quote**,
  so 16 links whose label names a later range land on a page headed as a
  different passage: `/objections/revelation-after-20-15/` offers "Revelation
  22:14-15" and "Revelation 22:1-5" and both arrive at "Revelation 21:1-8".
  Nothing is missing from the destination. Fixing it means deciding what a
  passage page is called when it treats several ranges.
- **`findPassageByReference` matches `additionalReferences` by exact string
  only**, and its range fallback tests the record's primary span, so
  1 Corinthians 15:24-26 and 15:26 do not resolve to the page that quotes
  15:20-28 in full. Two `/scripture/` rows therefore carry no passage link
  against that page's promise that references worked through at length have one,
  and two sections get no link back from prose that sets the passage out.
- **`/passages/second-peter-3-7-13/` omits S11 and S29** from "Where this passage
  appears in the case", though both declare 2 Peter 3:9 and S29 declares it as a
  primary text. `usedInSections` is hand-maintained and only checked for
  resolvable ids.
- **33 topic principal passages are labelled "Listed in the Scripture index" and
  have no row there.** The index walks section passage lists only;
  `topic.principalPassages` is a second source of references it never reads. The
  honest fix is either to index them — which changes what the "Where it is used"
  column means, since a topic is not a section — or to stop making the claim.
- **Five hyperlinks in the migration ledger route to `/sources/` with
  `citationStatus: 'verified'` and have no source record**, against
  `/original-document/`'s published statement that each hyperlink was given one.
  Adding the records needs access dates and rights status that only the author
  can supply, and the ledger is generated: its header says to edit the generator.
- `/topics/image-of-god/` lists S31 under both "Where this is argued in the case"
  and "Objections that turn on this"; S31 is an objection, so the second is its
  place. The only such overlap in 27 topics.
- `/corrections/` labels a link "Report an accessibility problem" and points it
  at `/accessibility/`, where the identically worded link points back at the
  form. Every other entry in that block describes its destination.
- Four breadcrumb group labels are plural where the headings they lead to are
  singular ("Key Texts" arrives at "Key Text"). `sections.test.ts` pins the crumb
  as a literal, so it holds the mismatch in place rather than catching it.
- `/sources/` tells a reader "No part of the case cites it directly" for four
  sources they may have reached from a topic page that lists them. Strictly true
  — a topic is not a part of the case — and it does not read that way.
- `/start/case-map/` characterises a six-entry list as pages that "set up the
  question, clear away obstacles, or work through an illustration"; S09 does none
  of the three.
- 44 of 150 `relatedSections` edges are one-way, along with 51 `relatedTerms` and
  14 `relatedPassages`. This may be deliberate, but nothing states a policy either
  way, and the reader-visible effect is that "Related" frequently offers no route
  back.

### Gap sweep 19 (follow-up branch)

One finder, pointed at sweep 18's commit. Six findings, all substantiated, all in
that commit or in what it claimed to have fixed. **Not clean.**

- **`sources-cited.test.ts` was never updated, and both the commit message and
  this ledger said it was.** The commit added `sectionCollection()` and explained
  that two checks covered 38 of the 40 pages that can drift; it then fixed one of
  them. The other still reads the `case` collection and still asserts
  `caseSections.length - 2`, which does not merely record the stale premise but
  blocks the fix, because correcting the reader makes the count 40. Both
  appendices cite `welch-source-document` inline, so nothing there could have
  failed against that source dropping `APP1` or `APP2` from `citedBy` — the
  heading "Sources cited on this page" would have rendered above an empty list on
  a page whose body cites it. Both checks read all forty now.
- **The sibling guard kept the floor the commit had just removed.** Fifteen lines
  above, `BODIES.size` was pinned to the registry with the reason written out:
  a floor was true of 38 and true of 40, so it could not tell them apart. The
  guard against a syntax migration emptying the loop was left as
  `displayed.length > 20` against a corpus of 189 blocks — true of any 21 of
  them, so 38 of the 40 pages could stop matching and it stayed green. It counts
  the blocks written against the blocks parsed now, per page, and was confirmed
  failing when a single body's `reference=` was renamed.
- **`?heading=` was clamped, not checked**, on the line below the `?section=`
  fix and under a comment beginning "Both are checked here, where they enter".
  `.slice(0, 128)` is the schema's bound, so a longer value was silently
  truncated to a prefix that resolves to no heading and stored anyway — where
  the section id was dropped rather than mangled. It is checked against the
  headings that section actually has now.
- **And the privacy page did not know about it.** Three sentences there and one
  on `/corrections/` said a submission carries what you type plus the part
  identifier — "which is listed below", "nothing more" — while `headingId`
  arrives from the address, is submitted and is persisted. The end-to-end test
  that navigates to `?section=S04&heading=the-text` asserts the hidden field
  carries it. All four now name both, and the new form-counting test could not
  have caught this: it reads the set of form actions, not what is stored.
- **The `::details-content` guard bounded the print block by its opening brace.**
  `@media print` is the last block in `globals.css`, so "after `printAt`" was
  true of anything appended at the end — including the rule itself lifted out of
  the block and left to apply on screen, which is the failure the guard exists
  for and which `globals.css` claims the guard prevents. Simulated against the
  real stylesheet, that edit left every assertion green. Bounded by the block's
  closing brace now, and confirmed failing against exactly that edit.
- `/passages/[slug]/` still says "Every reference the argument makes is listed in
  the Scripture index", the third copy of a sentence corrected in two other
  places by the previous commit. It is the `usedInSections.length === 0`
  fallback and unreachable today, since all 18 passages have a citing section; it
  becomes visible the first time one does not. Corrected anyway.

Checking the heading fix turned up something the finding had assumed the other
way: **no link on this site puts a heading in the address at all.** Nothing in
`src` emits `?heading=`, and the route's failure redirect only echoes what was
submitted, which comes from the hidden field, which comes from `?heading=`. So
`headingId` is plumbed end to end — schema, form, route, store — and no surface
produces it. Two end-to-end tests asserted the field survived a value,
`the-text`, that is not a heading of S04 and that the site could never have
emitted; they use a real one now, and the validation stands, because a
hand-typed address can still reach the field. The privacy and corrections copy
says what is true: a heading anchor is read if the address carries one, and no
link puts one there. Whether to wire per-heading feedback links or drop the
field is a decision for the author, and is left.

Also recorded: the new form-counting test reads only sitemap routes plus the
three extras, so `/download/handout.html` and the 404 page are never fetched; it
runs no script, so a form inside the search dialog's mounted branch is invisible;
it compares a set of actions, so a second form posting to `/api/feedback/`
changes nothing; and it does not read `formaction`. None is violated today.

### Gap sweep 20 (follow-up branch)

One finder, pointed at sweep 19's commit. Four findings, all inside it. **Not
clean.** Every one was green rather than red, which is the point.

- **The assertion carrying the previous fix's message was a tautology.** It
  compared `bodies.flatMap(displayedIn).length` against
  `Σ new Set(displayedIn(body)).size`, and `displayedIn` already deduplicates,
  so the two sides are the same number for any implementation. Measured: it
  held at 0 = 0 with the matcher returning nothing, and at 38 = 38 with 151 of
  the 189 blocks dropped. The corpus-wide count the commit message advertised
  was never asserted at all; only the per-page "at least one" loop was live, so
  S06's thirteen blocks could go down to one. `matchedIn` keeps the repeats now,
  and the check is written-equals-parsed per page. Confirmed failing when one
  block on one page stops matching.
- **The sibling test ten lines below still sliced to the end of the file**, the
  exact construct replaced above it under a seven-line comment explaining why it
  is wrong. `@media print` is the last block in `globals.css`, so both of its
  `!important` disclosure rules could be lifted out and appended after the
  closing brace — where they force every disclosure and its children open on
  screen, site-wide — and both assertions stayed green. The brace scan is a
  shared helper now, used by both, and confirmed failing against that edit. The
  scan itself was checked against the real stylesheet: no brace inside a quoted
  string, none inside a `url()`.
- **The privacy and corrections lists are exhaustive claims and omitted three
  stored fields.** The route persists an id, a status and `createdAt` alongside
  what the reader types. `createdAt` is load-bearing: the retention promise on
  the same page — deleted within twenty-four months of being resolved — is
  measured against a timestamp the reader was told was not kept. Both lists name
  all three now. The commit that rewrote them to add `headingId` had not
  re-derived them from `StoredSubmission`.
- **And the heading check put a filesystem read on the request path.**
  `/corrections/` renders per request, and `loadSection` does five things where
  one was wanted: `readFileSync` with no memo, then eleven chained whole-body
  regexes, a reading-time count and two registry walks, for bodies averaging
  8.5kB — to answer one question about a set of ids. Every other caller is
  statically generated. The ids cannot change without a rebuild, so they are
  computed once per section per process now.

Checked and clean by the same finder: reading both appendices for the first time
exposed no `citedBy` disagreement in either direction, `extractHeadings` matches
`github-slugger` on all 40 bodies with zero mismatches, and the `/passages/`
sentence rewritten last sweep is accurate.

### Gap sweep 21 (follow-up branch)

One finder, pointed at sweep 20's commit. Four findings, all inside it. **Not
clean.** The first is the worst kind: a false claim introduced by the sweep that
was correcting false claims.

- **"The arrival time is what the retention promise is measured against" is not
  true.** The promise on both pages is deletion "within twenty-four months of
  being **resolved**", and no resolution timestamp is stored: `status` is typed
  `'new'`, written as the literal `'new'`, and nothing in the repository ever
  rewrites the record. `reviewedAt` exists in the schema and no code path writes
  it. So the clock the promise names does not start anywhere, and the sweep that
  added `createdAt` to the published lists justified it with a sentence that is
  false. Both pages now say what the three fields are for and claim nothing
  about which one measures the promise. **That the promise cannot presently be
  administered from the stored record at all is a real finding and is left**: it
  needs either a resolution timestamp or a different promise, and both are the
  author's call.
- **`scales presses down, and only slightly` sliced to the end of the file.**
  It took the first `scale:` after the first `.pressable`, so deleting the press
  affordance outright left it reading `scale: 0.98` off `.overlay-panel`, an
  unrelated Tier 3 arrival, and passing under the message "the press affordance
  has no scale". Read out of the rule now, and confirmed failing when the rule
  is deleted. This is the third end-of-file slice found in this one file, the
  previous two having been fixed the sweep before under a comment explaining the
  hazard.
- **The second print assertion was pinned to nothing.** Its neighbour is pinned
  to an exact selector, with a comment saying why; this one matched a bare
  `display: revert !important` anywhere in the block, so moving the declaration
  onto `.site-footer > *` left it green while the children of a collapsed
  disclosure kept `display: none` on paper — the regression the test is named
  for. Pinned to its selector, and confirmed failing against that move.
- **The corpus floor was carried over verbatim** at `> 150` against 189 blocks:
  the same shape as the `> 20` it replaced and the `BODIES.size > 30` two tests
  above, both of which this file's own comments condemn. The per-page equality
  cannot compensate, because both its sides derive from the same `<Scripture`
  token, so a page that stops writing them scores 0 = 0 and the coverage check
  iterates nothing for it. Deleting the blocks from RB2, RB3 and S06 — two of
  them the pages this file's header names as its motivating failures — leaves
  154 and clears the floor. The count is recorded now, and changing it is part
  of making a content decision.

The memo added last sweep is correct, with one caveat recorded: its docblock
says the ids cannot change without a rebuild, which is false under `next dev`,
where every other page picks up an MDX edit on the next request.

### Gap sweep 22 (follow-up branch)

Widened: the newest commit, plus a rule-by-rule audit of the one file that had
produced three unbounded slices across two sweeps. Eight findings, most of them
verified by mutation rather than by reading. **Not clean.**

Fixed:

- **`status` was described as "its place in the queue" on both pages.** It is a
  write-once literal: typed `'new'`, written `'new'`, and nothing in the
  repository ever reads or rewrites the store. It records no place and no
  ordering, and `id` and `createdAt` do all of the finding, answering and
  deleting on their own. The sweep before rewrote the second half of that
  sentence to remove a false claim about `createdAt` and left an untrue
  description of `status` in the first half of the same sentence.
- **A submitted field was reaching a log line.** `console.info` carried
  `submission.type`, which is one of the three required fields on the form,
  against this route's own stated rule — "log statements carry the generated id
  and the outcome, nothing else" — and against `/privacy/`'s promise that
  submission contents are never written to a log. The id alone now.
- **The corpus pin aborted the check it was added to protect.** `toBe(189)` sat
  before the per-page matcher loop, and a failing `toBe` ends the test, so every
  legitimate content change would have skipped the assertion the test exists
  for. It runs last now.
- **A floor of the shape this suite has replaced three times.**
  `durations.length >= REQUIRED.length - 2` was 4 against 5 live duration
  tokens, so deleting `--motion-reveal` left the whole file green while three
  arrival animations resolved to an invalid duration and never ran — nothing
  else names that token, because `REQUIRED` omits it and the Tier 3 test matches
  the *usage*, which survives the declaration. The exact set is asserted now.
- **Two tests in that file assert nothing at all.** Both iterate `reduceBlocks`
  with every expectation inside the loop, and the stylesheet contains no
  `reduce` block — movement is opted into under `no-preference` rather than out
  of under `reduce` — so they execute zero assertions and pass by vacuity. That
  is correct for the design and was invisible. A named test now records it and
  fails the moment a `reduce` block appears, at which point the two loops start
  meaning something.

Found, evidenced and left:

- **The Tier 1 feedback-timing test is satisfied by a different rule.** Verified
  by mutation: deleting `a,` from the Tier 1 selector list leaves all six
  selector assertions true, because a bare `a {` — the prose-link colour rule
  twenty-five lines above — sits inside the same slice, as does comment prose
  containing the letter. Prose links, the most numerous interactive element on
  the site, would silently lose their transition. The same test's slice is
  bounded by `indexOf('@layer components')`, which on a rename returns `-1` and
  grows the scope from 5,477 to 30,833 characters, pulling in the print block.
- **The press-scale test is rule-bounded but location-blind.** Moving
  `.pressable:active` out of the `no-preference` block is not caught by it or by
  the movement-confinement test, which inspects only `transition` declarations
  and the moved rule has none. A reader who asked for reduced motion would get
  an instant jump to 97% on every press, which is exactly what the comment
  beside that rule says its placement prevents.
- **`toBe(189)` is outside the authoring loop.** The maintenance guide's
  procedure for adding a quotation enumerates every other file to touch and ends
  at `bun run content:validate`, which does not run vitest. An author follows the
  documented loop, sees green, and meets the pin only in CI, with the
  explanation living in a comment in a test file the guide never names.
- **Four tests read the un-stripped stylesheet**, so a declaration deleted and
  left quoted in the comment explaining its removal keeps them green. Not
  currently exploited, but that is this file's documented authoring habit.

## 11. PR #5 compatibility

PR #5 (Pretext quick-search excerpts) merged into `main` after this branch
was cut, and the two touch the same search surfaces. `origin/main` was merged
into this branch rather than copied from, so PR #5's behaviour arrives
exactly as it shipped.

**Conflicts and resolutions** (three files, both intents kept whole):

- `search-dialog.tsx`: only the import block conflicted; the bodies
  interleave. Main's prewarm-on-intent, `QuickSearchResults` rows and excerpt
  candidates compose with this branch's `aria-expanded` wiring, the
  deterministic Ctrl/Cmd+K toggle, the shared `DialogCloseButton`, the token
  radius, the described-by status region and the tabular footer count. The
  `Highlighted` import was dropped because main moved row rendering into
  `QuickSearchResults`.
- `playwright.config.ts`: this branch's `accessibility-mobile` project sits
  alongside main's three `geometry-*` projects; the project-inventory
  comment lists all seven.
- `package.json`: `test:a11y` runs both accessibility projects; main's
  `test:browser` aggregate gains `accessibility-mobile`.

**Contracts verified on the merged tree**: Pretext stays behind its
intent-gated lazy load and never blocks results; the excerpt fitter's
fallback path and the server-rendered `/search/` page are untouched by this
branch; ranking behaviour is held by PR #5's own `ranking-baseline` and
invariants suites, which pass unchanged; the geometry suite runs in all
three engines (Playwright WebKit is reported as Playwright WebKit, not
Safari, per `docs/pretext-text-geometry.md`). No merge order remains: this
branch now contains `main`, so PR #6 merges cleanly on top of PR #5.

**Merged-tree verification** (after the merge commit): `CI=1 bun run
validate` exit 0 with a clean tree; `test:e2e` 308 tests, 0 failures;
`test:a11y` 64 tests (63 + 1 axe timing flake retried green), 0 failures;
`test:text-geometry` 69 tests across Chromium, Firefox and Playwright WebKit
(67 + 2 WebKit flaky passes from that suite's own retry budget), 0 failures.
Total automated coverage at that merge commit: 1,267 tests. The finished
branch carries 1,342; section 10 has the breakdown.

**Review threads**: the automated review on the first commit raised two P2
findings (permalink loss on demoted headings; component-rendered headings
not demoted). Both had already been found by this branch's own adversarial
review and fixed in `3fa2727`/`d1a9adc`; each thread carries a reply naming
the resolving commit and is resolved.
