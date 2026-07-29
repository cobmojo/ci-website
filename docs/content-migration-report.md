# Content migration report

Moving `My case for Conditional Immortality.docx` to the web edition.

## The source

| | |
|---|---|
| Title | My case for Conditional Immortality/Annihilation (CI) instead of Eternal Conscious Torment (ECT) |
| Author | Phil Welch |
| Started | 1 March 2023 |
| SHA-256 | `d3e567fd5a945efb2280d058787e808c86109d5ae848744beffafd45cf09187a` |
| Size | 305,782 bytes |
| Imported | 29 July 2026 |

The checksum is recorded in `siteConfig.sourceDocument` and in
`LEDGER_SUMMARY`. If the source changes, the checksum differs and the audit
shows what moved.

## How it was read

The DOCX was opened as a ZIP and its WordprocessingML read directly, rather
than going through a DOCX-to-HTML conversion. Conversions routinely drop
comments, relationship targets, table structure and list nesting, and the
migration needed all four to prove nothing substantive was lost.

`scripts/conditional-immortality/import-source.ts` does this with no external
dependency: a small central-directory ZIP reader plus a WordprocessingML
walker. It was written independently of the exploratory extraction used to
scope the work, and reproduces it exactly, which is the strongest check
available that the parse is right.

## Element counts

| | Expected | Found |
|---|---|---|
| Paragraphs | | 997 (904 non-empty) |
| Tables | | 3 |
| Hyperlink relationships | 43 | **43** |
| Hyperlink instances | | 43 |
| Distinct external targets | | 36 |
| Embedded media | 8 | **8** |
| Editorial comments | 30 | **30** |

All three counts stated in the brief matched exactly.

## Migration ledger

1,034 entries, one per paragraph, table cell, image and hyperlink relationship.

| Treatment | Count |
|---|---|
| Mapped to a destination route | 943 |
| Private source only | 2 |
| Omitted as formatting only | 89 |
| **Unmapped** | **0** |

The 89 formatting-only entries are empty spacing paragraphs. The 2 private
entries are the title block carrying the author's personal email address and
phone number.

The build fails if any substantive element loses its destination. Exports:
`packages/ci-content/migration/migration-ledger.json`, the same as CSV, and
`source-inventory.json`.

## What was produced

| | |
|---|---|
| Case sections with full bodies | 40 of 40 |
| Words of authored prose | ~54,000 |
| Key passage pages | 18 |
| Topic pages | 27 |
| Glossary terms | 20 |
| Original-language notes | 8 |
| Source records | 33 |
| Revision records | 18 |
| Scripture index entries | 208 |
| Verified Scripture passages | 197 |
| Transcript cues | 279 |

## The S17 and S18 discrepancy

The source document's table of contents lists physical death before Jesus'
death; the body headings number them the other way. **The body headings are
canonical**: S17 is Jesus' death, S18 is physical death as a parallel to final
death.

Two internal cross-references in the source (paragraphs 401 and 551) say
"Section 18" while meaning Jesus' death. They are not reproduced with the wrong
number. Both pages carry a note recording the discrepancy, a revision record
documents it, and a unit test plus a build check prevent it reverting.

## Comment dispositions

All 30 comments are accounted for, grouped into 17 threads.

| Disposition | Threads |
|---|---|
| Incorporated into revised copy | 12 |
| Added as an open question | 2 |
| Addressed in a caveat | 1 |
| Added to internal research backlog | 1 |
| Preserved only in the private source archive | 1 |

Commenters are never named. The ledger records each author as a role label,
"The author" or "A reviewer". The real mapping stays in `private/source/`,
which no application code imports, and a unit test asserts that only those two
labels ever appear.

Three comments produced substantive corrections: the Aquinas quotation is an
objection he answers, not his own view; Edom's destruction is past so the smoke
language was never literal; and the same interpreters who read eternal life
qualitatively often read eternal punishment quantitatively.

The research-backlog item is the age of accountability. The source contains a
note wondering whether to address it and no developed argument, so there was
nothing to migrate and nothing was invented.

## Media dispositions

None of the eight images is republished. Where an image carried argument, the
argument was rebuilt as text, because a screenshot cannot be read by assistive
technology, searched, translated or checked.

| Asset | Treatment |
|---|---|
| Two Greek comparison screenshots | Rebuilt as text; both verses quoted in full, the parallel stated in words, page marked for specialist review |
| Outcome table | Rebuilt as a semantic table with a caption and scoped headers |
| Odds chart | Rebuilt as accessible SVG with an equivalent data table |
| Video thumbnail | Replaced by a restrained text poster; the site's identity is not built on flame imagery |
| QR code | Regenerated for the canonical site URL, print only; the old short link is retired |
| YouTube play button | Replaced with an original inline SVG |
| Document-outline toolbar icon | Omitted as authoring-tool debris |

The rebuilt anthropology tables in S10 deserve a note: the source conveyed alive
and dead by green and red text. That is unavailable to a screen reader, a
greyscale printer, or a reader with a colour vision deficiency. The colours were
read out of the DOCX XML directly (`38761d` alive, `ff0000` dead) so the
rebuilt tables carry the author's actual encoding as words in their own columns.

## Hyperlinks

All 43 relationships have a disposition. The 36 distinct external targets became
source records with an access date, a link status and a rights status. The one
`mailto:` link is recorded as redacted and replaced by the correction form.

Two links were retired rather than carried over: the TinyURL short link, which
pointed at the shared working document rather than this site, and the
document-outline instruction, which described a word processor feature.

## Editorial changes

Five claims withdrawn, four narrowed, three corrections accepted from the
source's own review thread, and two citation errors in the source corrected.
Each is recorded in `packages/ci-content/src/revisions/revisions.ts` and appears
publicly on the section page, in `/corrections/` and in the per-section
changelog. Full reasoning is in `docs/source-verification-report.md`.

Nothing difficult was quietly dropped. Material that could not be asserted was
narrowed to what the evidence supports, moved to an appendix, labelled as the
author's own interpretation, or recorded in the ledger as retained in the
private source record only. The two cases held back entirely from the public
site are the inference about Satan's motive for promoting eternal torment, which
impugns the motives of other Christians, and a passage the author himself
labelled a wild random thought without scriptural support.

## Privacy

The personal email address and phone number appear nowhere in the repository,
the built output, the search index, the sitemap or any download. A build-time
scanner enforces this by SHA-256 digest, so the values it protects are not
themselves stored in the code. It was verified by planting the real address in a
public file, confirming the scan failed, then removing it and confirming it
passed.

The raw DOCX is not committed and is not published. `/original-document/`
explains why and shows the migration statistics.

## Reproducing this

```bash
bun run source:import      # re-read the DOCX, rewrite the redacted archive
bun run content:audit      # regenerate the ledger exports and the report
bun run validate           # the full gate
```
