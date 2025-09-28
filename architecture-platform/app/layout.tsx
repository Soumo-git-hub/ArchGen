import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import '../styles/enhanced-components.css'

export const metadata: Metadata = {
  title: 'ArchGen - Architecture Generator',
  description: 'Generate production-ready system architectures with visual diagrams',
  generator: 'ArchGen',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=1" sizes="any" />
        <link rel="icon" href="/favicon.ico?v=1" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico?v=1" />
        <meta name="msapplication-TileImage" content="/favicon.ico" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
