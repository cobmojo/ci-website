import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site-config'

/**
 * Social preview image.
 *
 * Rendered on this server from the query string, with no remote font fetch and
 * no external asset of any kind, so generating a card never contacts a third
 * party. The design is the same calm editorial surface as the site: warm paper,
 * a navy heading, one copper rule. No fire, no gradient, no photograph.
 *
 * Typography deliberately uses whatever font the image renderer provides. A
 * remote font request would be a third-party call at render time, and shipping
 * a font binary here would be duplicated weight for a 1200 by 630 image whose
 * job is to be legible in a link preview.
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

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url)

  const rawTitle = searchParams.get('title')?.trim()
  const title = (rawTitle && rawTitle.length > 0 ? rawTitle : siteConfig.homepageTitle).slice(
    0,
    MAX_TITLE,
  )
  const category = searchParams.get('category')?.trim().slice(0, MAX_CATEGORY) ?? ''

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
