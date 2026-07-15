import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRateLimit, fetchRepoStats } from '../lib/github';
import type { CoinConfig, CoinStats, RateLimitInfo } from '../types';

export interface UseGitHubStatsResult {
  stats: Record<string, CoinStats>;
  rateLimit: RateLimitInfo | null;
  refreshing: boolean;
  refresh: () => void;
  refreshCoin: (id: string) => void;
  lastGlobalUpdate: number | null;
}

/**
 * Derive an overall coin state from its repo states.
 * Priority: rate-limited > error > not-found > empty > loading > ok
 */
function deriveState(repos: CoinStats['repos']): CoinStats['state'] {
  if (repos.length === 0) return 'empty';
  if (repos.some((r) => r.state === 'rate-limited')) return 'rate-limited';
  if (repos.some((r) => r.state === 'error')) return 'error';
  if (repos.every((r) => r.state === 'not-found')) return 'not-found';
  if (repos.every((r) => r.state === 'empty')) return 'empty';
  if (repos.some((r) => r.state === 'loading')) return 'loading';
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

export function useGitHubStats(coins: CoinConfig[]): UseGitHubStatsResult {
  const [stats, setStats] = useState<Record<string, CoinStats>>({});
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState<number | null>(null);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;
  const inflight = useRef<Set<string>>(new Set());
  const seqRef = useRef(0);

  const updateCoinStats = useCallback(
    (id: string, repos: CoinStats['repos']) => {
      const totals = aggregate(repos);
      setStats((prev) => ({
        ...prev,
        [id]: {
          ...totals,
          repoCount: repos.length,
          repos,
          lastUpdated: Date.now(),
          state: deriveState(repos),
        },
      }));
    },
    [],
  );

  const loadCoin = useCallback(
    async (coin: CoinConfig, seq: number) => {
      if (inflight.current.has(coin.id)) return;
      inflight.current.add(coin.id);
      // Set loading state immediately.
      setStats((prev) => ({
        ...prev,
        [coin.id]: {
          commits30d: 0,
          commits180d: 0,
          repoCount: coin.repos.length,
          repos: coin.repos.map((r) => ({
            repo: r,
            commits30d: 0,
            commits180d: 0,
            state: 'loading',
          })),
          lastUpdated: prev[coin.id]?.lastUpdated ?? null,
          state: 'loading',
        },
      }));

      const repoResults = await Promise.all(
        coin.repos.map((r) => fetchRepoStats(r)),
      );

      if (seq !== seqRef.current) {
        inflight.current.delete(coin.id);
        return;
      }
      updateCoinStats(coin.id, repoResults);
      inflight.current.delete(coin.id);
    },
    [updateCoinStats],
  );

  const refreshAll = useCallback(async () => {
    if (refreshing) return;
    const seq = ++seqRef.current;
    setRefreshing(true);
    const rl = await fetchRateLimit().catch(() => null);
    if (seq !== seqRef.current) {
      setRefreshing(false);
      return;
    }
    if (rl) setRateLimit(rl);
    // If exhausted, still try per-repo — the per-repo responses will carry the
    // rate-limit state so coins show a clear rate-limited banner.
    await Promise.all(coinsRef.current.map((c) => loadCoin(c, seq)));
    if (seq === seqRef.current) {
      setLastGlobalUpdate(Date.now());
      setRefreshing(false);
    }
  }, [refreshing, loadCoin]);

  const refreshCoin = useCallback(
    async (id: string) => {
      const coin = coinsRef.current.find((c) => c.id === id);
      if (!coin) return;
      const seq = seqRef.current;
      await loadCoin(coin, seq);
    },
    [loadCoin],
  );

  // Initial load + when the set of coins changes identity.
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Poll rate limit info every 60s while idle (cheap endpoint).
  useEffect(() => {
    const t = setInterval(async () => {
      if (refreshing) return;
      const rl = await fetchRateLimit().catch(() => null);
      if (rl) setRateLimit(rl);
    }, 60000);
    return () => clearInterval(t);
  }, [refreshing]);

  return {
    stats,
    rateLimit,
    refreshing,
    refresh: refreshAll,
    refreshCoin,
    lastGlobalUpdate,
  };
}
