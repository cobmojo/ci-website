import { ESSENTIAL_PATH, getSection, PRINCIPAL_CLAIMS } from '@ci/content/case'
import { escapeHtml } from '@/lib/plain-text'
import { encodeQr, qrSvg } from '@/lib/qr'
import { siteConfig } from '@/lib/site-config'

/**
 * A printable one-page handout.
 *
 * Standalone by design: one file, no stylesheet, no script, no image request,
 * no font request. It has to survive being emailed round a study group and
 * printed on someone else's machine, so everything it needs is inside it.
 *
 * The QR code is generated here by `@/lib/qr`, an encoder written for this
 * site. It carries the canonical site URL and nothing else.
 */
export const dynamic = 'force-static'

/**
 * The handout cannot use the application's Tailwind theme, so the palette is
 * restated here as custom properties. These values are the same tokens the
 * site uses; the QR code itself is pure black on white, because contrast
 * matters more than palette when a camera is trying to read it.
 */
const STYLES = `
  :root {
    --paper: #ffffff;
    --panel: #eee9df;
    --ink: #1c242b;
    --ink-muted: #4c5763;
    --ink-subtle: #57606d;
    --navy: #233a4d;
    --copper: #7d4f22;
    --border: #d4ccbe;
  }
  @page { size: A4; margin: 13mm; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0 auto;
    max-width: 190mm;
    padding: 10mm;
    background: var(--paper);
    color: var(--ink);
    font-family: Georgia, 'Times New Roman', 'Source Serif 4', serif;
    font-size: 10.5pt;
    line-height: 1.42;
  }
  h1, h2, h3, .eyebrow, .meta, .path, .url {
    font-family: 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif;
  }
  h1 { margin: 0 0 2mm; font-size: 19pt; line-height: 1.15; color: var(--navy); }
  h2 {
    margin: 0 0 2mm;
    font-size: 11pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--copper);
  }
  .eyebrow {
    margin: 0 0 1.5mm;
    font-size: 8.5pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--copper);
  }
  .lede { margin: 0; font-size: 10.5pt; color: var(--ink-muted); }
  header { border-bottom: 1.5pt solid var(--navy); padding-bottom: 4mm; margin-bottom: 5mm; }
  section { margin-bottom: 5mm; }
  ol { margin: 0; padding-left: 6mm; }
  li { margin-bottom: 2mm; }
  .claims li { margin-bottom: 2.4mm; }
  .claims strong { font-weight: 700; }
  .path { list-style: none; padding: 0; column-count: 2; column-gap: 8mm; font-size: 9.5pt; }
  .path li { margin-bottom: 1.6mm; break-inside: avoid; }
  .path .id { display: inline-block; min-width: 11mm; color: var(--ink-subtle); font-weight: 600; }
  .path .route { display: block; margin-left: 11mm; color: var(--ink-subtle); font-size: 8.5pt; word-break: break-all; }
  footer {
    display: flex;
    gap: 6mm;
    align-items: center;
    border-top: 1pt solid var(--border);
    padding-top: 4mm;
    background: var(--panel);
    padding: 4mm;
    border-radius: 2mm;
  }
  footer svg { display: block; width: 38mm; height: 38mm; }
  .url { margin: 0 0 1.5mm; font-size: 13pt; font-weight: 700; color: var(--navy); word-break: break-all; }
  .meta { margin: 0; font-size: 9pt; color: var(--ink-subtle); }
  .no-qr { margin: 0 0 2mm; font-size: 9pt; color: var(--ink-muted); }
  @media print {
    body { padding: 0; max-width: none; }
    footer { background: none; border: 1pt solid var(--border); }
    a { color: var(--ink); text-decoration: none; }
  }
`

function claimsHtml(): string {
  return PRINCIPAL_CLAIMS.map(claim => `<li>${escapeHtml(claim.title)}</li>`).join('\n      ')
}

function readingPathHtml(): string {
  return ESSENTIAL_PATH.map(id => {
    const section = getSection(id)
    if (!section) return ''
    return [
      '<li>',
      `<span class="id">${escapeHtml(section.id)}</span> `,
      `<span>${escapeHtml(section.title)}</span>`,
      `<span class="route">${escapeHtml(section.route)}</span>`,
      '</li>',
    ].join('')
  })
    .filter(Boolean)
    .join('\n      ')
}

function qrBlock(): string {
  const matrix = encodeQr(siteConfig.url)
  if (!matrix) {
    return [
      '<div>',
      `<p class="no-qr">The address of this site is printed in full below. It is longer than a`,
      ` QR code of this size can carry, so please type it in rather than scan it.</p>`,
      '</div>',
    ].join('')
  }
  return qrSvg(matrix, {
    title: `QR code for ${siteConfig.url}`,
    moduleSize: 4,
    quietZone: 4,
  })
}

function buildHandout(): string {
  const title = `${siteConfig.name}: one-page handout`

  return `<!doctype html>
<html lang="${escapeHtml(siteConfig.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(siteConfig.description)}">
<meta name="robots" content="noindex, follow">
<style>${STYLES}</style>
</head>
<body>
  <header>
    <p class="eyebrow">One-page handout</p>
    <h1>${escapeHtml(siteConfig.name)}</h1>
    <p class="lede">${escapeHtml(siteConfig.description)}</p>
  </header>

  <section>
    <h2>The six claims this case rests on</h2>
    <ol class="claims">
      ${claimsHtml()}
    </ol>
  </section>

  <section>
    <h2>The essential reading path, twelve pages in order</h2>
    <ol class="path">
      ${readingPathHtml()}
    </ol>
  </section>

  <footer>
    ${qrBlock()}
    <div>
      <p class="url">${escapeHtml(siteConfig.url)}</p>
      <p class="meta">
        Scan the code or type the address. Every claim above is argued in full on the site, with
        the passages quoted, the sources named and the traditional reading stated from its own
        defenders first. Corrections are welcome at ${escapeHtml(siteConfig.url)}/corrections/
      </p>
    </div>
  </footer>
</body>
</html>
`
}

export function GET(): Response {
  return new Response(buildHandout(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-disposition': 'inline; filename="conditional-immortality-handout.html"',
    },
  })
}
