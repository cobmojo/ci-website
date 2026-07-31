import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import ReactDOM from 'react-dom'
import { PrintDisclosures } from '@/components/content/print-disclosures'
import { SiteFooter } from '@/components/navigation/site-footer'
import { SiteHeader } from '@/components/navigation/site-header'
import { SmoothAnchorScroll } from '@/components/navigation/smooth-anchor-scroll'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.homepageTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.homepageTitle,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.homepageTitle,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#f7f4ed',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

/**
 * The two faces that draw the first screen, fetched alongside the stylesheet
 * rather than after it.
 *
 * Without this the six `@font-face` rules are only discovered once CSS has
 * parsed, so the first paint uses the fallback and the real faces swap in
 * around 350–430ms — re-measuring every line of text and moving the header,
 * the navigation and the hero with it. Measured cold against the production
 * build, that swap was the whole of a 0.126 CLS on the homepage and 0.131 on
 * `/scripture/`, both past the 0.1 that counts as good.
 *
 * Only the two upright latin faces. They cover essentially all above-the-fold
 * text; the italic and latin-ext subsets rarely appear there, and preloading
 * all six would only make them compete with the CSS and with each other.
 *
 * `crossOrigin` is required even same-origin: a font preloaded without it is
 * fetched a second time by the CSS, which makes the preload worse than none.
 *
 * `ReactDOM.preload` rather than a rendered `<link>`: React hoists a rendered
 * one into `<head>` *and* leaves it in place, so the tag is emitted twice.
 *
 * Nothing about the typography changes — same files, same faces, same metrics,
 * so the text-geometry contract is untouched.
 */
const PRELOADED_FONTS = [
  '/fonts/SourceSerif4-latin-normal.woff2',
  '/fonts/Inter-latin-normal.woff2',
] as const

export default function RootLayout({ children }: { children: ReactNode }) {
  for (const href of PRELOADED_FONTS) {
    ReactDOM.preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  }

  return (
    <html lang={siteConfig.language}>
      <body className="flex min-h-dvh flex-col">
        {/* Renders nothing. Applies smooth scrolling to in-page anchor
            navigation only, which cannot be expressed in CSS without also
            capturing the router's scroll-to-top. See the component. */}
        <SmoothAnchorScroll />
        <PrintDisclosures />
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        {/* `tabIndex={-1}` is what makes the skip link actually move focus.
            Without it the browser only moves the scroll position, so the next
            Tab press returns to the header the reader was trying to skip. */}
        {/* `measure-prose` caps paragraphs and definitions at a readable
            measure wherever they sit inside a full-width container. It only
            ever narrows a box that would otherwise run too wide, so layouts
            that are already capped are unaffected. */}
        <main id="main-content" tabIndex={-1} className="measure-prose flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
