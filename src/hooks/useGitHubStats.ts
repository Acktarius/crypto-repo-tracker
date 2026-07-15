import { useEffect, useState } from 'react';
import { fetchRateLimit, fetchRepoStats } from '../lib/github';
import type { CoinConfig, CoinStats, RateLimitInfo } from '../types';

export interface UseGitHubStatsResult {
  stats: Record<string, CoinStats>;
  rateLimit: RateLimitInfo | null;
  loading: boolean;
  lastGlobalUpdate: number | null;
}

/**
 * Derive coin state from repo states.
 * Prefer success when any repo ok — one flaky stats call shouldn't mark the coin Error.
 */
function deriveState(repos: CoinStats['repos']): CoinStats['state'] {
  if (repos.length === 0) return 'empty';
  if (repos.some((r) => r.state === 'rate-limited')) return 'rate-limited';
  if (repos.some((r) => r.state === 'ok')) return 'ok';
  if (repos.some((r) => r.state === 'loading')) return 'loading';
  if (repos.every((r) => r.state === 'empty')) return 'empty';
  if (repos.every((r) => r.state === 'not-found')) return 'not-found';
  if (repos.some((r) => r.state === 'error')) return 'error';
  return 'ok';
}

function aggregate(
  repos: CoinStats['repos'],
): Pick<CoinStats, 'commits30d' | 'commits180d'> {
  return {
    commits30d: repos.reduce(
      (s, r) =>
        s + (r.state === 'ok' || r.state === 'empty' ? r.commits30d : 0),
      0,
    ),
    commits180d: repos.reduce(
      (s, r) =>
        s + (r.state === 'ok' || r.state === 'empty' ? r.commits180d : 0),
      0,
    ),
  };
}

function loadingStats(coin: CoinConfig): CoinStats {
  return {
    commits30d: 0,
    commits180d: 0,
    repoCount: coin.repos.length,
    repos: coin.repos.map((r) => ({
      repo: r,
      commits30d: 0,
      commits180d: 0,
      state: 'loading',
    })),
    lastUpdated: null,
    state: 'loading',
  };
}

/**
 * One fetch pass when the coin/repo set changes. No manual refresh loop.
 */
export function useGitHubStats(coins: CoinConfig[]): UseGitHubStatsResult {
  const [stats, setStats] = useState<Record<string, CoinStats>>({});
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStats(Object.fromEntries(coins.map((c) => [c.id, loadingStats(c)])));

      const rl = await fetchRateLimit().catch(() => null);
      if (cancelled) return;
      if (rl) setRateLimit(rl);

      // Sequential: stay well inside the 60/hr unauthenticated REST budget.
      for (const coin of coins) {
        if (cancelled) return;
        const repoResults: CoinStats['repos'] = [];
        for (const repo of coin.repos) {
          if (cancelled) return;
          repoResults.push(await fetchRepoStats(repo));
        }
        if (cancelled) return;
        const totals = aggregate(repoResults);
        setStats((prev) => ({
          ...prev,
          [coin.id]: {
            ...totals,
            repoCount: repoResults.length,
            repos: repoResults,
            lastUpdated: Date.now(),
            state: deriveState(repoResults),
          },
        }));
      }

      if (!cancelled) {
        setLastGlobalUpdate(Date.now());
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [coins]);

  return {
    stats,
    rateLimit,
    loading,
    lastGlobalUpdate,
  };
}
