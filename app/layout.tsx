/**
 * app/layout.tsx — Root layout for Buek.
 *
 * Responsibilities:
 *  - Sets HTML metadata (title, description) for SEO.
 *  - Loads Google Fonts (IM Fell English + Libre Baskerville)
 *    via <link> tags in <head>.
 *  - Applies the default body class `lighting-candlelight`
 *    which globals.css maps to a warm brown background.
 *  - Wraps all pages in the <html>/<body> shell.
 */
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Buek — PDF Book Reader',
  description: 'Read PDFs as a beautiful flip-book with ambient lighting and bookmarks.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="lighting-candlelight">{children}</body>
    </html>
  )
}
