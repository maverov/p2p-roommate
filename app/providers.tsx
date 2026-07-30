'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { makeQueryClient } from '@/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session / per server render — never a module singleton.
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
