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
    default: 'RentBee - Намери стая без посредник',
    template: '%s | RentBee',
  },
  description:
    'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
  applicationName: 'RentBee',
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
  authors: [{ name: 'RentBee Team' }],
  creator: 'RentBee Team',
  publisher: 'RentBee',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  openGraph: {
    title: 'RentBee - Намери стая без посредник',
    description:
      'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
    url: `${appUrl}/bg`,
    siteName: 'RentBee',
    locale: 'bg_BG',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RentBee - P2P платформа за наем',
        type: 'image/png',
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'RentBee - Намери стая без посредник',
    description:
      'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
    images: ['/og-image.png'],
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
