'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = process.env.NODE_ENV === 'development'
    ? error.message
    : 'An unexpected error occurred. Please try again.';

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-6" role="alert" aria-live="assertive">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-gray-600 text-center">{message}</p>
      <button
        onClick={() => reset()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Try again
      </button>
    </main>
  );
}
