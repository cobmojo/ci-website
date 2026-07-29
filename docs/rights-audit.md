# Rights audit

Every category of third-party material used on this site, and the basis on
which it is used. Reviewed 29 July 2026.

## 1. Bible translations

**Finding.** The source document quotes the ESV, NIV and NKJV extensively. Those
are copyrighted translations. Publishers permit limited quotation in ordinary
works, but a site of this kind is a Scripture reference work: it displays whole
passages, on dozens of pages, as its primary content. That is well outside what
incidental-quotation allowances are written to cover, and it is not a judgement
call this project should make on its own behalf.

**Decision.** All full passage displays render the **World English Bible**, a
public-domain modern English revision of the American Standard Version released
into the public domain by Rainbow Missions, Inc.

**Implementation.** 197 passages were retrieved once and stored in
`packages/ci-content/src/scripture/web-text.ts`. The `<Scripture>` component
takes only a reference and renders from that corpus, so:

- No author ever types a verse. A misquotation is structurally impossible.
- The translation and rights line is generated, never hand-written.
- A reference absent from the corpus **fails the build** with an actionable
  message rather than rendering nothing.

**Where a modern rendering matters.** Several arguments turn on a specific
modern wording, most importantly 2 Thessalonians 1:9 where NKJV, ESV and NIV
diverge. In those cases the page quotes only the few words at issue, names the
translation, and explains the difference in the site's own prose. It does not
reproduce the surrounding verse from the copyrighted text.

**Licensed alternatives.** `/scripture/` and passage pages link out to Bible
Gateway so a reader can consult translations this site cannot reproduce.

**Status: cleared.**

## 2. Public-domain historical works

Irenaeus (*Against Heresies*), Ignatius (*Magnesians*), Augustine
(*Enchiridion*, Nicene and Post-Nicene Fathers, 1887), Aquinas (*Summa
Theologica*) and Jonathan Edwards are all quoted from public-domain editions,
each with a precise locator (book, chapter, section, article, or volume and
page).

Two cautions are recorded on the pages themselves rather than buried here:

- The Ignatian corpus survives in longer and shorter recensions, so the
  Magnesians quotation is presented as recension-dependent.
- The Aquinas passage usually quoted for infinite punishment is an objection he
  states and then answers. The circulating English wording is a popular variant
  rather than a standard translation, and the page says so.

**Status: cleared, public domain.**

## 3. Works in copyright

| Work | Treatment |
|---|---|
| Joseph Dear, *The Bible Teaches Annihilationism* | Distributed free as a PDF by its author. Quoted briefly with page locators; otherwise paraphrased. |
| John MacArthur, *The Truth About Hell* (sermon) | One short excerpt, attributed, quoted for criticism and commentary so the traditional position is stated in its own words. |
| Edward Fudge, *The Fire That Consumes* | Referenced only. Not quoted. |
| Rethinking Hell articles | Linked, with one short attributed excerpt where an observation is genuinely theirs. |
| Themelios / Gospel Coalition article | Linked only. |
| Ed Elliott, Medium article | One short attributed sentence, quoted specifically in order to decline its unverified figure. |
| John Wenham, *The Case for Conditional Immortality* | Linked only. |

Every source record carries a `rightsStatus` from a fixed vocabulary
(`public-domain`, `cleared`, `permission-needed`, `quoted-briefly`,
`paraphrased`, `link-only`), and the build fails if one is missing.

**Status: cleared. No work in copyright is reproduced at length.**

## 4. The source document

`My case for Conditional Immortality.docx` by Phil Welch, SHA-256
`d3e567fd5a945efb2280d058787e808c86109d5ae848744beffafd45cf09187a`.

The author is the site's author, so the underlying material is his to publish.
Two things nonetheless prevent publishing the file as-is:

1. It opens with a personal email address and phone number.
2. It contains 30 private editorial comments by named third parties who did not
   consent to publication.

**Decision.** The raw DOCX is **not** published and is not committed to the
repository. A redacted plain-text rendering lives in `private/source/` for
traceability. `/original-document/` explains the position and the migration
statistics. A sanitised public source edition remains possible once a rights and
privacy review of the comment threads is completed; it is not published today.

**Status: source cleared; raw file withheld pending review.**

## 5. Embedded media

All eight assets from the DOCX are accounted for in
`packages/ci-content/src/migration/media.ts`. None is republished as an image.

- Two Greek comparison screenshots: replaced with real text. An argument that
  exists only inside a screenshot cannot be read, searched or checked.
- Two outcome charts: rebuilt as a semantic table and an accessible SVG.
- Video thumbnail: the author's own, but a restrained text poster is used
  instead so the site's identity is not built on flame imagery.
- QR code: regenerated for the canonical site URL; the old short link is retired.
- YouTube play button: replaced with an original inline SVG.
- Document-outline toolbar icon: omitted as authoring-tool debris.

**Status: cleared.**

## 6. The video and its transcript

The featured video is the author's own. Its transcript is the **manually created
English caption track he published with it**, retrieved from the public
timed-text endpoint on 29 July 2026, not a machine transcription and not a
reconstruction. 279 cues with their published timings.

The embed uses `youtube-nocookie.com` and is not contacted at all until the
reader presses play.

**Status: cleared.**

## 7. Fonts

Source Serif 4 and Inter, both SIL Open Font License 1.1, which permits
redistribution and self-hosting. The `.woff2` files are vendored into
`apps/conditional-immortality/public/fonts/`. No font is fetched from a third
party at runtime or at build time.

**Status: cleared.**

## 8. Downloadable artefacts

`/download/` offers the printable case, the transcript, the bibliography and a
printable handout. Each is generated from material already cleared above. The
transcript is the author's own captions; the bibliography is factual citation
data; the handout contains only site copy and a generated QR code.

**Status: cleared.**

## Outstanding

Nothing blocks publication. Two items are recorded as future work rather than
defects:

1. A sanitised public edition of the source document, once the comment threads
   have been reviewed for consent.
2. Archive links for the external sources that do not yet have one, so citations
   survive link rot.
