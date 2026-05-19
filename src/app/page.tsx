import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import PageContent from '@/components/PageContent';

interface PageProps {
  searchParams: { ticker?: string };
}

export default function Home({ searchParams }: PageProps) {
  const ticker = searchParams.ticker?.toUpperCase().trim();

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap tracking-tight">
            Stock Pulse
          </h1>
          <SearchBar initialValue={ticker} />
          <nav className="ml-auto flex items-center gap-5 shrink-0">
            <Link href="/backtest" className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap transition-colors">
              Backtest
            </Link>
            <Link href="/ml" className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap transition-colors">
              ML Model
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageContent ticker={ticker} />
      </div>
    </main>
  );
}
