import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // tsconfig says `jsx: preserve` for Next; tests need the JSX compiled.
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': fromRoot('.'),
      'server-only': fromRoot('./test/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next*/**'],
  },
});
