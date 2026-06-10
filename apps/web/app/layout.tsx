import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'P2P Roommate - Find Your Perfect Roommate',
  description: 'Discover and connect with verified roommates. Secure, affordable, and hassle-free rental matching.',
  keywords: ['roommate', 'rental', 'housing', 'apartment sharing'],
  metadataBase: new URL('http://localhost:3000'),
  
  // Open Graph for social sharing
  openGraph: {
    title: 'P2P Roommate',
    description: 'Find your perfect roommate',
    url: 'http://localhost:3000',
    siteName: 'P2P Roommate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'P2P Roommate Platform',
      },
    ],
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'P2P Roommate',
    description: 'Find your perfect roommate',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
