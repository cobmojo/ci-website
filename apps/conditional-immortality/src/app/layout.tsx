import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/navigation/site-footer'
import { SiteHeader } from '@/components/navigation/site-header'
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={siteConfig.language}>
      <body className="flex min-h-dvh flex-col">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        {/* `tabIndex={-1}` is what makes the skip link actually move focus.
            Without it the browser only moves the scroll position, so the next
            Tab press returns to the header the reader was trying to skip. */}
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
