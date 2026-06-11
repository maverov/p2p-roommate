import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p className="text-gray-600 text-center">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2">
        Go home
      </Link>
    </main>
  );
}
