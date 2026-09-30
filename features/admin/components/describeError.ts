import { ApiError } from '@/lib/api-client';

/** Admin tools surface the server's own message: it names the exact rule that was hit. */
export function describeError(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Try again.';
}
