import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { Providers } from './providers';
import { cormorant } from '@/lib/fonts';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Stay.bg - Намери стая без посредник',
    template: '%s | Stay.bg',
  },
  description:
    'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
  applicationName: 'Stay.bg',
  keywords: [
    'стая под наем',
    'апартамент под наем',
    'квартира',
    'наем София',
    'наем Пловдив',
    'наеми България',
    'без посредник',
    'room rental bulgaria',
    'apartment rental bulgaria',
  ],
  category: 'Real Estate',
  classification: 'Rental marketplace',
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: appUrl,
    languages: {
      'bg-BG': `${appUrl}/bg`,
      'en-US': `${appUrl}/en`,
      'x-default': `${appUrl}/bg`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  authors: [{ name: 'Stay.bg Team' }],
  creator: 'Stay.bg Team',
  publisher: 'Stay.bg',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  openGraph: {
    title: 'Stay.bg - Намери стая без посредник',
    description:
      'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
    url: `${appUrl}/bg`,
    siteName: 'Stay.bg',
    locale: 'bg_BG',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Stay.bg - P2P платформа за наем',
        type: 'image/png',
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Stay.bg - Намери стая без посредник',
    description:
      'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
    images: ['/og-image.png'],
    creator: '@staybg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className={cormorant.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
