import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gabriel Moreno Ribeiro — Builder & Founder',
  description: 'Co-Founder & CEO at HIBEEX. Full-stack engineer building financial AI for Brazilian SMBs. 39 olympiad medals, SAT 1510.',
  openGraph: {
    title: 'Gabriel Moreno Ribeiro — Builder & Founder',
    description: 'Co-Founder & CEO at HIBEEX. Full-stack engineer building financial AI for Brazilian SMBs.',
    type: 'website',
    url: 'https://gabrielmr.com',
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
