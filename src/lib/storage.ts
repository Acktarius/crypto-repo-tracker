import type { CoinConfig } from '../types';

const COINS_KEY = 'cdt:coins';
const TOKEN_KEY = 'cdt:github-token';

export function loadCoins(): CoinConfig[] | null {
  try {
    const raw = localStorage.getItem(COINS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CoinConfig[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCoins(coins: CoinConfig[]): void {
  try {
    localStorage.setItem(COINS_KEY, JSON.stringify(coins));
  } catch {
    /* ignore */
  }
}

export function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function saveToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Generate a stable id for a custom coin from its symbol/name. */
export function makeCoinId(symbol: string, name: string): string {
  const base = (symbol || name).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `custom-${base}-${Math.random().toString(36).slice(2, 7)}`;
}

/** A curated brand color used when a custom coin has no logo. */
export const CUSTOM_COLORS = [
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];
