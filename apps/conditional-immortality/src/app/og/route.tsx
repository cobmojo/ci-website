import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site-config'

/**
 * Social preview image.
 *
 * Rendered on this server from the query string. The design is the same calm
 * editorial surface as the site: warm paper, a navy heading, one copper rule.
 * No fire, no gradient, no photograph.
 *
 * Typography uses whatever font the image renderer provides, rather than a
 * font binary shipped for a 1200 by 630 image whose job is to be legible in a
 * link preview.
 *
 * This used to claim that generating a card "never contacts a third party".
 * That is true of every card this site emits, which are Latin text and curly
 * quotes, and false in general: the renderer fetches a font from Google and an
 * emoji sprite from a CDN when asked for a script or a glyph its bundled
 * subset lacks. `title` comes from a query string, so "in general" is the
 * standard that matters. The characters the site itself uses are the ones it
 * can promise for, and the promise is stated that way now.
 *
 * The renderer can also fail outright on some scripts — an unsupported OpenType
 * substitution format in Arabic closed the socket with no response at all —
 * so the card is generated inside a guard that answers with the plain site
 * card rather than nothing.
 */

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 } as const

/** Mirrors the semantic tokens in globals.css. */
const COLOURS = {
  paper: '#f7f4ed',
  paperRaised: '#fffdf8',
  ink: '#1c242b',
  inkMuted: '#4c5763',
  inkSubtle: '#57606d',
  navy: '#233a4d',
  copper: '#9a6431',
  copperDeep: '#7d4f22',
  border: '#d4ccbe',
} as const

const MAX_TITLE = 130
const MAX_CATEGORY = 48

function titleFontSize(length: number): number {
  if (length <= 34) return 82
  if (length <= 60) return 68
  if (length <= 90) return 56
  return 46
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  const rawTitle = searchParams.get('title')?.trim()
  const title = (rawTitle && rawTitle.length > 0 ? rawTitle : siteConfig.homepageTitle).slice(
    0,
    MAX_TITLE,
  )
  const category = searchParams.get('category')?.trim().slice(0, MAX_CATEGORY) ?? ''

  return draw(title, category)
}

/**
 * Render the card, and answer with the plain one if it cannot be drawn.
 *
 * The image has to be buffered for this to work at all. `ImageResponse`
 * streams, so the renderer's failure happens after the handler has returned
 * and a `try` around the constructor catches nothing: an Arabic title closed
 * the socket with no response written, which curl reports as no reply rather
 * than as an error. Awaiting the bytes moves the failure somewhere it can be
 * handled. The cards are around 35kB, so buffering one costs nothing worth
 * counting.
 */
async function draw(title: string, category: string): Promise<Response> {
  const headers = {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  }
  try {
    return new Response(await card(title, category).arrayBuffer(), { headers })
  } catch {
    return new Response(await card(siteConfig.homepageTitle, '').arrayBuffer(), { headers })
  }
}

function card(title: string, category: string): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: COLOURS.paper,
        padding: '72px 80px',
        border: `1px solid ${COLOURS.border}`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {category ? (
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: COLOURS.copperDeep,
              marginBottom: 26,
            }}
          >
            {category}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            width: 132,
            height: 7,
            backgroundColor: COLOURS.copper,
            marginBottom: 34,
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: titleFontSize(title.length),
            lineHeight: 1.18,
            color: COLOURS.navy,
            letterSpacing: -1,
            maxWidth: 980,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: `1px solid ${COLOURS.border}`,
          paddingTop: 26,
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: COLOURS.ink }}>{siteConfig.name}</div>
        <div style={{ display: 'flex', fontSize: 24, color: COLOURS.inkSubtle, marginTop: 8 }}>
          A biblical case by {siteConfig.author.name}
        </div>
      </div>
    </div>,
    {
      ...SIZE,
      headers: {
        'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
