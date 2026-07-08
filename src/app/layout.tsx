import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gabriel — Fixer & Builder',
  description: 'Electrical engineer building things and fixing systems. Join me on a journey from curiosity to creation.',
  keywords: ['portfolio', 'engineer', 'builder', 'developer', 'IoT', 'robotics'],
  authors: [{ name: 'Gabriel' }],
  openGraph: {
    title: 'Gabriel — Fixer & Builder',
    description: 'Electrical engineer building things and fixing systems.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%2300d9ff'>G</text></svg>" />
      </head>
      <body>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  )
}
