import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DLCF Musical Competition Registration',
  description:
    'Register for the DLCF Musical Competition, Saturday October 3, 2026, part of the DLCF National Campus Congress (October 1 to 4, 2026).',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'),
  openGraph: {
    title: 'DLCF Musical Competition Registration',
    description:
      'Register for the DLCF Musical Competition, Saturday October 3, 2026, part of the DLCF National Campus Congress.',
    type: 'website',
    images: [
      {
        url: '/choir/flyer-congress.jpeg',
        width: 720,
        height: 1080,
        alt: 'DLCF National Campus Congress flyer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DLCF Musical Competition Registration',
    description: 'Register for the DLCF Musical Competition, Saturday October 3, 2026.',
    images: ['/choir/flyer-congress.jpeg'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}