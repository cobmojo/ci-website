# Authoring brief

Binding rules for anyone (or any agent) writing content for this site. Read this
before writing a single line of prose.

## 1. The source is canonical for the argument, not for the facts

The source document is `My case for Conditional Immortality.docx` by Phil Welch.
An extracted, paragraph-numbered plain-text rendering lives at the path given in
your task. Paragraph markers look like `[374]` and correspond to
`sourceParagraphIds` in the registry (`p374`).

- Preserve every substantive proposition, argument, objection, response,
  Scripture reference, illustration and caveat in your assigned range.
- You may reorganise, retitle and rewrite for clarity and grammar.
- You may **not** invent an argument, a citation, a statistic, a Greek or Hebrew
  claim, a historical consensus, or a quotation.
- If the source asserts something the evidence does not support, state the
  narrower claim the evidence does support and add a caveat. Do not delete it.

## 2. Scripture quotation policy

This site quotes Scripture at reference-work scale, which standard
incidental-quotation allowances do not cover.

- **Full passage displays use the World English Bible (WEB)**, which is public
  domain.
- **You never type Scripture text.** Write only the reference:
  `<Scripture reference="Mark 9:47-48" />`. The component renders the verified
  WEB text from `packages/ci-content/src/scripture/web-text.ts` and labels the
  translation itself. This removes any possibility of a misquoted verse.
- If a reference is missing from the corpus the build fails with a clear error.
  Add it to `scripts/conditional-immortality/fetch-scripture.ts` and re-run that
  script. Do not hand-write the text.
- The source document quotes ESV, NIV and NKJV heavily. **Do not reproduce those
  renderings at length.** Where the argument turns on a specific modern
  rendering, quote only the handful of words at issue, name the translation, and
  explain the difference in your own prose.
- Never present an AI-generated rendering as a translation. If the author offers
  his own suggested rendering, label it as his suggestion, in his words.

## 3. Quoting other works

- Public-domain works (Irenaeus, Ignatius, Augustine, Aquinas, Edwards) may be
  quoted with a precise locator.
- Works in copyright (Joseph Dear, MacArthur, Fudge, journal articles) get a
  short excerpt at most, always attributed, usually paraphrase plus citation.
- Never leave a bare URL in prose. Cite through the source library id.

## 4. Presenting the opposing view

Every page that touches a disputed passage must state the eternal conscious
torment reading **before** answering it, and state it in the strongest form its
own defenders would recognise.

- No caricatures, no straw men, no "obviously".
- Do not use a conditionalist source as your only account of what ECT teaches.
- Do not suggest that defenders of the traditional view are uncaring, dishonest,
  or deceived.

## 5. Style

- Plain language. Direct sentences. Moderate paragraphs.
- **No em dashes.** Use commas, colons, or separate sentences.
- Expand "conditional immortality" and "eternal conscious torment" on first use,
  then CI and ECT are fine.
- Keep Hades, Sheol, Gehenna and the lake of fire distinct. Never let "hell" do
  the work of all four.
- Never say CI means there is no hell, that the wicked "just disappear", or that
  judgment is painless or instant.
- Do not imply all conditionalists agree on every detail.
- Label speculation as speculation and inference as inference.
- Preserve hedges. Do not upgrade "may", "appears" or "probably" into certainty.
- No hype, snark, sarcasm, scare quotes as ridicule, or sensational capitals.
- Use "Scripture", capitalised.

## 6. Article structure (MDX bodies)

Use `##` for top-level sections and `###` beneath. Do **not** write an `<h1>`;
the template supplies it. The default information model, adapted as the material
requires rather than forced:

1. `## In brief`
2. `## The primary passage` (or passages)
3. `## Why ECT interpreters cite this passage`
4. `## The conditionalist reading`
5. `## The argument step by step`
6. `## What this argument establishes` (with `### What it does not establish by itself`)
7. Open question or caveat, only where genuinely needed
8. `## Related sections and passages`
9. `## Sources and notes`

Not every page needs every heading. A page with no disputed passage does not
need an ECT section. Follow the material.

## 7. Components available in MDX

```mdx
<Scripture reference="Mark 9:47-48" translation="WEB" licenseId="web-public-domain">
Text of the passage.
</Scripture>

<Callout tone="caution" title="Historical uncertainty" as="h3">
Prose.
</Callout>

<Callout tone="question" title="Open question" as="h3">…</Callout>
<Callout tone="author" title="From the author" as="h3">…</Callout>

<Cite id="dear-bible-teaches-annihilationism" locator="page 121" />

<Greek text="ἀπόλλυμι" transliteration="apollumi" gloss="destroy, ruin, lose" />
<Hebrew text="חֶרְפָּה" transliteration="cherpah" gloss="reproach, shame" />

<Compare>
  <ECTReading>…</ECTReading>
  <CIReading>…</CIReading>
</Compare>

<Details summary="Full parsing">…</Details>
```

`<Details>` is for genuinely supplementary material only: long primary-source
quotations, full parsing, extended technical notes. Never put a load-bearing
step of the argument inside it.

## 8. Length

Aim for substance over padding. A core biblical argument page will usually run
900 to 1,800 words. A short supporting page may run 400 to 700. Do not pad, and
do not compress a section so far that a substantive claim from the source is
lost.

## 9. Absolutely forbidden

- Placeholder text of any kind: TODO, TBD, lorem ipsum, "coming soon", "to be
  written", `[...]`, or an empty section.
- The author's personal email address or phone number.
- Naming the people who left comments in the private source document.
- Fabricated page numbers, dates, or quotations.
