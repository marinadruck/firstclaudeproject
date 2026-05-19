import SearchBar from '@/components/SearchBar';
import Dashboard from '@/components/Dashboard';

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
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {ticker ? (
          <Dashboard ticker={ticker} />
        ) : (
          <div className="text-center py-28">
            <p className="text-3xl font-bold text-gray-800 mb-3">
              Track stock attention & sentiment
            </p>
            <p className="text-gray-500 mb-2">
              Enter a ticker symbol to see mention volume, sentiment, price history, and recent headlines.
            </p>
            <p className="text-sm text-gray-400">
              Try: AAPL · TSLA · NVDA · MSFT · GME
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
