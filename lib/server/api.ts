import 'server-only';

import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

import { auth } from '@/lib/auth';

type ErrorBody = {
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
}

export function apiOk<TData>(data: TData, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiCreated<TData>(data: TData) {
  return apiOk(data, { status: 201 });
}

export function apiNoContent() {
  return new Response(null, { status: 204 });
}

export async function parseJsonBody<TInput>(
  request: Request,
  schema: ZodSchema<TInput>,
): Promise<TInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  return schema.parse(body);
}

export function parseSearchParams<TInput>(
  request: Request,
  schema: ZodSchema<TInput>,
): TInput {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  return schema.parse(params);
}

export async function getCurrentUser(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session?.user ?? null;
}

export async function requireCurrentUser(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'You must be signed in.');
  }

  return user;
}

export async function handleApiRoute(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.status, {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof ZodError) {
      return errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.issues,
      });
    }

    console.error(error);

    return errorResponse(500, {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong.',
    });
  }
}

function errorResponse(
  status: number,
  error: ErrorBody['error'],
): NextResponse<ErrorBody> {
  return NextResponse.json({ error }, { status });
}
