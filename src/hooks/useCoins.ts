import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_COINS } from '../data/defaults';
import {
  CUSTOM_COLORS,
  loadCoins,
  makeCoinId,
  saveCoins,
} from '../lib/storage';
import type { CoinConfig } from '../types';

export interface UseCoinsResult {
  coins: CoinConfig[];
  /** coins with custom ones first, then defaults in original order */
  orderedCoins: CoinConfig[];
  addCoin: (input: {
    symbol: string;
    name: string;
    repos: string[];
    color?: string;
    logoUrl?: string;
  }) => CoinConfig;
  removeCoin: (id: string) => void;
  updateCoinRepos: (id: string, repos: string[]) => void;
  resetRepos: (id: string) => void;
  resetAllToDefaults: () => void;
  getCoin: (id: string) => CoinConfig | undefined;
}

function dedupeRepos(repos: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of repos) {
    const trimmed = r.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function useCoins(): UseCoinsResult {
  const [coins, setCoins] = useState<CoinConfig[]>(() => {
    const saved = loadCoins();
    if (saved?.length) {
      // Merge: keep saved, but ensure all defaults exist (in case defaults changed).
      const savedIds = new Set(saved.map((c) => c.id));
      const merged = [...saved];
      for (const d of DEFAULT_COINS) {
        if (!savedIds.has(d.id)) merged.push(d);
      }
      return merged;
    }
    return DEFAULT_COINS;
  });

  useEffect(() => {
    saveCoins(coins);
  }, [coins]);

  const orderedCoins = useMemo(() => {
    const custom = coins.filter((c) => c.custom);
    const def = coins.filter((c) => !c.custom);
    // Defaults keep their original order.
    const defOrdered = DEFAULT_COINS.map((d) =>
      def.find((c) => c.id === d.id),
    ).filter(Boolean) as CoinConfig[];
    // Any defaults not in DEFAULT_COINS (shouldn't happen) appended after.
    const knownIds = new Set(DEFAULT_COINS.map((d) => d.id));
    const extras = def.filter((c) => !knownIds.has(c.id));
    return [...custom, ...defOrdered, ...extras];
  }, [coins]);

  const addCoin = useCallback<UseCoinsResult['addCoin']>((input) => {
    const id = makeCoinId(input.symbol, input.name);
    const color =
      input.color ||
      CUSTOM_COLORS[Math.floor(Math.random() * CUSTOM_COLORS.length)];
    const coin: CoinConfig = {
      id,
      symbol: input.symbol.trim().toUpperCase(),
      name: input.name.trim(),
      repos: dedupeRepos(input.repos),
      custom: true,
      color,
      logoUrl: input.logoUrl?.trim() || undefined,
    };
    setCoins((prev) => [...prev, coin]);
    return coin;
  }, []);

  const removeCoin = useCallback((id: string) => {
    setCoins((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCoinRepos = useCallback((id: string, repos: string[]) => {
    setCoins((prev) =>
      prev.map((c) => (c.id === id ? { ...c, repos: dedupeRepos(repos) } : c)),
    );
  }, []);

  const resetRepos = useCallback((id: string) => {
    setCoins((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const def = DEFAULT_COINS.find((d) => d.id === id);
        return def ? { ...c, repos: def.repos } : c;
      }),
    );
  }, []);

  const resetAllToDefaults = useCallback(() => {
    setCoins(DEFAULT_COINS);
  }, []);

  const getCoin = useCallback(
    (id: string) => coins.find((c) => c.id === id),
    [coins],
  );

  return {
    coins,
    orderedCoins,
    addCoin,
    removeCoin,
    updateCoinRepos,
    resetRepos,
    resetAllToDefaults,
    getCoin,
  };
}
