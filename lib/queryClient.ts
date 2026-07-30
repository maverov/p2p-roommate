import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api-client';

/**
 * Creates a fresh cache. Must be called per request on the server — a shared
 * module-level client would leak one user's data into another user's render.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Auth/permission/not-found failures will never succeed on retry.
          if (error instanceof ApiError && error.status < 500) {
            return false;
          }

          return failureCount < 1;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
