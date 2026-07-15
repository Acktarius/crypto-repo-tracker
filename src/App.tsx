import { Activity, Clock, Github, KeyRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AddCoinModal } from './components/AddCoinModal';
import { CoinCard } from './components/CoinCard';
import { Controls } from './components/Controls';
import { EditReposModal } from './components/EditReposModal';
import { RateLimitBanner } from './components/RateLimitBanner';
import { TokenModal } from './components/TokenModal';
import { useCoins } from './hooks/useCoins';
import { useGitHubStats } from './hooks/useGitHubStats';
import { formatRelative, formatResetCountdown } from './lib/format';
import type { CoinConfig, RateLimitInfo, SortKey } from './types';

function App() {
  const {
    orderedCoins,
    addCoin,
    removeCoin,
    updateCoinRepos,
    resetRepos,
    resetAllToDefaults,
  } = useCoins();
  const {
    stats,
    rateLimit,
    refreshing,
    refresh,
    refreshCoin,
    lastGlobalUpdate,
  } = useGitHubStats(orderedCoins);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('30d');
  const [addOpen, setAddOpen] = useState(false);
  const [editCoin, setEditCoin] = useState<CoinConfig | null>(null);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Filter + sort.
  const visibleCoins = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = orderedCoins;
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      const sa = stats[a.id];
      const sb = stats[b.id];
      const va = sa ? (sort === '30d' ? sa.commits30d : sa.commits180d) : -1;
      const vb = sb ? (sort === '30d' ? sb.commits30d : sb.commits180d) : -1;
      return vb - va;
    });
    // Always keep custom coins pinned at top, even after sort.
    sorted.sort((a, b) => Number(b.custom) - Number(a.custom));
    return sorted;
  }, [orderedCoins, query, sort, stats]);

  const handleResetAll = () => {
    if (
      confirm(
        'Reset all coins and repo mappings to defaults? Custom coins will be removed.',
      )
    ) {
      resetAllToDefaults();
      setBannerDismissed(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-950">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-accent-500/5 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-base-100">
                Crypto Dev Tracker
              </h1>
              <p className="text-sm text-base-400">
                GitHub development activity for crypto projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RateIndicator
              rateLimit={rateLimit}
              lastUpdate={lastGlobalUpdate}
              onAddToken={() => setTokenOpen(true)}
            />
          </div>
        </header>

        {/* Rate-limit banner */}
        <div className="mb-4">
          <RateLimitBanner
            rateLimit={rateLimit}
            onAddToken={() => setTokenOpen(true)}
            onDismiss={() => setBannerDismissed(true)}
            dismissed={bannerDismissed}
          />
        </div>

        {/* Controls */}
        <div className="mb-6">
          <Controls
            query={query}
            onQuery={setQuery}
            sort={sort}
            onSort={setSort}
            onAddCoin={() => setAddOpen(true)}
            onResetAll={handleResetAll}
            onRefresh={refresh}
            refreshing={refreshing}
            resultCount={visibleCoins.length}
            totalCount={orderedCoins.length}
          />
        </div>

        {/* Grid */}
        {visibleCoins.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCoins.map((coin) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                stats={stats[coin.id]}
                onEdit={(c) => setEditCoin(c)}
                onRemove={removeCoin}
                onResetRepos={resetRepos}
                onRefresh={refreshCoin}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-base-800 pt-6 text-xs text-base-500 sm:flex-row">
          <span>
            Commit counts via the GitHub Search API. Windows cap at 1,000
            results per repo.
          </span>
          <a
            href="https://docs.github.com/en/rest/search#search-commits"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-base-300"
          >
            <Github size={12} /> GitHub API docs
          </a>
        </footer>
      </div>

      {/* Modals */}
      <AddCoinModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addCoin}
      />
      <EditReposModal
        coin={editCoin}
        open={!!editCoin}
        onClose={() => setEditCoin(null)}
        onSave={updateCoinRepos}
        onReset={resetRepos}
      />
      <TokenModal
        open={tokenOpen}
        onClose={() => setTokenOpen(false)}
        onSaved={() => {
          refresh();
          setBannerDismissed(false);
        }}
      />
    </div>
  );
}

function RateIndicator({
  rateLimit,
  lastUpdate,
  onAddToken,
}: {
  rateLimit: RateLimitInfo | null;
  lastUpdate: number | null;
  onAddToken: () => void;
}) {
  if (!rateLimit) return null;
  const pct = rateLimit.limit
    ? (rateLimit.remaining / rateLimit.limit) * 100
    : 0;
  const low = rateLimit.remaining <= 5 && !rateLimit.exhausted;
  const exhausted = rateLimit.exhausted;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-xs text-base-400">
          API: {rateLimit.remaining}/{rateLimit.limit}
          {exhausted && (
            <span className="ml-1 text-warning-400">
              · {formatResetCountdown(rateLimit.resetAt)}
            </span>
          )}
        </div>
        <div className="text-[11px] text-base-500">
          Updated {formatRelative(lastUpdate)}
        </div>
      </div>
      <button
        onClick={onAddToken}
        className="inline-flex items-center gap-1.5 rounded-xl border border-base-700 bg-base-850 px-3 py-2 text-xs text-base-300 transition-colors hover:border-base-600 hover:text-base-100"
        title="Add a GitHub token to raise your rate limit"
      >
        <KeyRound size={13} />
        Token
      </button>
      <div className="hidden lg:block">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-base-800">
          <div
            className={`h-full transition-all duration-500 ${
              exhausted
                ? 'bg-warning-500'
                : low
                  ? 'bg-warning-500'
                  : 'bg-accent-500'
            }`}
            style={{ width: `${exhausted ? 100 : pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-700 py-16 text-center">
      <Clock size={28} className="text-base-600" />
      <p className="mt-3 text-sm text-base-300">
        {query ? `No coins match "${query}".` : 'No coins to display.'}
      </p>
      <p className="mt-1 text-xs text-base-500">
        {query
          ? 'Try a different search term.'
          : 'Add a custom coin to get started.'}
      </p>
    </div>
  );
}

export default App;
