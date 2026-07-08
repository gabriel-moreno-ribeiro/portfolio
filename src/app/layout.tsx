import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gabriel.',
  description: 'Fixer & Builder.',
  openGraph: {
    title: 'Gabriel.',
    description: 'Fixer & Builder.',
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
      <body>{children}</body>
    </html>
  )
}
