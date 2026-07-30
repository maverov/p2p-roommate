import { Caveat, Cormorant_Garamond } from 'next/font/google';

// Brand serif, exposed as a CSS variable so `font-serif` resolves to it
// (wired up in styles/globals.css @theme).
export const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

// Handwritten accent script ("Made with ❤ in Bulgaria", hero taglines).
export const caveat = Caveat({
  subsets: ['latin', 'cyrillic'],
  weight: ['600'],
  display: 'swap',
});
