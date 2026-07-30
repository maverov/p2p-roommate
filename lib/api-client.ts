/**
 * Thin client for this app's REST API.
 *
 * Every route returns `{ data }` on success and `{ error: { code, message } }`
 * on failure (see `lib/server/api.ts`), so callers get the payload directly and
 * failures surface as a typed `ApiError` that React Query can render.
 */

type ApiSuccessBody<TData> = { data: TData };

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

type RequestOptions = {
  body?: unknown;
  signal?: AbortSignal;
  /** Forwarded to fetch; defaults to `no-store` because all API routes are dynamic. */
  cache?: RequestCache;
};

async function request<TData>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  { body, signal, cache = 'no-store' }: RequestOptions = {},
): Promise<TData> {
  const response = await fetch(path, {
    method,
    signal,
    cache,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as TData;
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessBody<TData>
    | ApiErrorBody
    | null;

  if (!response.ok) {
    const error = payload && 'error' in payload ? payload.error : null;

    throw new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.details,
    );
  }

  if (!payload || !('data' in payload)) {
    throw new ApiError(response.status, 'MALFORMED_RESPONSE', 'Unexpected server response.');
  }

  return payload.data;
}

export const apiClient = {
  get: <TData>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<TData>('GET', path, options),
  post: <TData>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<TData>('POST', path, { ...options, body }),
  patch: <TData>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<TData>('PATCH', path, { ...options, body }),
  delete: <TData = void>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<TData>('DELETE', path, options),
};

type QueryValue = string | number | boolean | Date | null | undefined;

/**
 * Serialises a filter object into a query string, dropping empty values so
 * absent filters never reach the server as `""` (which Zod would reject).
 */
export function buildSearchParams(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    searchParams.set(key, value instanceof Date ? value.toISOString() : String(value));
  }

  return searchParams.toString();
}
