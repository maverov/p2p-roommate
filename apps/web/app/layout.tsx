import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'], 
  display: 'swap' 
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Stay.bg - Намери стая без посредник',
  description: 'P2P платформа за наем на стаи и апартаменти в България. Директен контакт между наематели и наемодатели.',
  keywords: ['стая под наем', 'апартамент под наем', 'квартира', 'наем София', 'наем Пловдив'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),

  openGraph: {
    title: 'Stay.bg',
    description: 'Намери стая без посредник',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    siteName: 'Stay.bg',
    locale: 'bg_BG',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Stay.bg - P2P платформа за наем',
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Stay.bg',
    description: 'Намери стая без посредник',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}