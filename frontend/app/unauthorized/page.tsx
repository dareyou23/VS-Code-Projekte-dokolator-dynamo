'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Zugriff verweigert
          </h2>
          <p className="text-gray-600 mb-8">
            Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
          </p>
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Zur Startseite
            </Link>
            <Link
              href="/login"
              className="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Neu anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
