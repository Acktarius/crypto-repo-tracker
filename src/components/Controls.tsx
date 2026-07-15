import { ArrowDownUp, Plus, RotateCcw, Search } from 'lucide-react';
import type { SortKey } from '../types';

interface Props {
  query: string;
  onQuery: (q: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onAddCoin: () => void;
  onResetAll: () => void;
  resultCount: number;
  totalCount: number;
}

const sortLabels: Record<SortKey, string> = {
  '30d': '30-day commits',
  '180d': '6-month commits',
  name: 'Name',
};

export function Controls({
  query,
  onQuery,
  sort,
  onSort,
  onAddCoin,
  onResetAll,
  resultCount,
  totalCount,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative flex-1 lg:max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-500"
        />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by name or symbol…"
          className="w-full rounded-xl border border-base-700 bg-base-850 py-2.5 pl-9 pr-9 text-sm text-base-100 placeholder:text-base-500 transition-colors focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-base-500 hover:text-base-200"
            aria-label="Clear search"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-xs text-base-400 sm:inline">
          {resultCount}/{totalCount} coins
        </span>

        {/* Sort */}
        <div className="relative inline-flex items-center">
          <ArrowDownUp
            size={14}
            className="pointer-events-none absolute left-2.5 text-base-500"
          />
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="appearance-none rounded-xl border border-base-700 bg-base-850 py-2.5 pl-8 pr-8 text-sm text-base-200 transition-colors hover:border-base-600 focus:border-accent-500/60 focus:outline-none"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <option key={k} value={k} className="bg-base-850">
                {sortLabels[k]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onResetAll}
          className="inline-flex items-center gap-1.5 rounded-xl border border-base-700 bg-base-850 px-3 py-2.5 text-sm text-base-200 transition-colors hover:border-base-600 hover:text-base-100"
          title="Reset all coins and repos to defaults"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={onAddCoin}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-2.5 text-sm font-medium text-base-950 transition-colors hover:bg-accent-400"
        >
          <Plus size={16} />
          Add coin
        </button>
      </div>
    </div>
  );
}
