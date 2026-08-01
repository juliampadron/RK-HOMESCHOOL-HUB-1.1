import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-rk-green">
          Renaissance Kids Homeschool Hub
        </h1>
        <p className="text-lg text-gray-600">
          Light up learning through the arts.
        </p>
        <nav className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/parent-assistant"
            className="px-5 py-2 rounded-lg bg-rk-orange text-white font-semibold hover:bg-opacity-90 focus-visible:ring-2 focus-visible:ring-rk-orange"
          >
            Parent Assistant
          </Link>
          <Link
            href="/student-helper"
            className="px-5 py-2 rounded-lg bg-rk-blue text-white font-semibold hover:bg-opacity-90 focus-visible:ring-2 focus-visible:ring-rk-blue"
          >
            Student Helper
          </Link>
          <Link
            href="/games/solfege-staircase"
            className="px-5 py-2 rounded-lg bg-rk-yellow text-gray-900 font-semibold hover:bg-opacity-90 focus-visible:ring-2 focus-visible:ring-rk-yellow"
          >
            Solfège Staircase
          </Link>
          <Link
            href="/resources"
            className="px-5 py-2 rounded-lg bg-rk-green text-white font-semibold hover:bg-opacity-90 focus-visible:ring-2 focus-visible:ring-rk-green"
          >
            Resource Catalog
          </Link>
        </nav>
      </div>
    </main>
  );
}
