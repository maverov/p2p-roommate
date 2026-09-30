import localFont from 'next/font/local';

/*
 * Self-hosted from `assets/fonts` (built by `scripts/subset-fonts.py`), so `next dev`
 * and builds never depend on reaching Google Fonts: a slow response there silently
 * shipped a fallback serif. Each file is one variable font with Latin and Cyrillic.
 */

// Brand serif, exposed as a CSS variable so `font-serif` resolves to it
// (wired up in styles/globals.css @theme).
export const cormorant = localFont({
  src: [
    { path: '../assets/fonts/CormorantGaramond.woff2', weight: '500 700', style: 'normal' },
    { path: '../assets/fonts/CormorantGaramond-Italic.woff2', weight: '500 700', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-cormorant',
  // Metrics-matched fallback while the font loads, as `next/font/google` did for serifs.
  adjustFontFallback: 'Times New Roman',
});

// Handwritten accent script (the footer's "Made with ❤ in Bulgaria").
export const caveat = localFont({
  src: [{ path: '../assets/fonts/Caveat-SemiBold.woff2', weight: '600', style: 'normal' }],
  display: 'swap',
  // Only the footer uses it: not worth a preload on every page.
  preload: false,
});
