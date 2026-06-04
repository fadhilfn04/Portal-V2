import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import Providers from './providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.peduatel.id'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Portal PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia',
    template: '%s | Portal PeduaTel',
  },
  description:
    'Portal resmi berita, kegiatan, dan informasi bagi pensiunan Telkom Indonesia. Tetap terhubung, tetap aktif, tetap bermakna.',
  keywords: [
    'PeduaTel', 'pensiunan Telkom', 'P2Tel', 'berita pensiunan',
    'portal komunitas', 'Telkom Indonesia', 'Dana Pensiun Telkom',
  ],
  authors: [{ name: 'PeduaTel' }],
  creator: 'PeduaTel',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Portal PeduaTel',
    title: 'Portal PeduaTel — Persatuan Pensiunan Telekomunikasi Indonesia',
    description:
      'Portal resmi berita, kegiatan, dan informasi bagi pensiunan Telkom Indonesia.',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal PeduaTel',
    description: 'Portal resmi berita dan informasi pensiunan Telkom Indonesia.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1a3c6e' },
    { media: '(prefers-color-scheme: dark)',  color: '#1a3c6e' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-neutral-25 text-neutral-900 antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          richColors
          expand
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-inter)',
              borderRadius: '10px',
            },
          }}
        />
      </body>
    </html>
  )
}
