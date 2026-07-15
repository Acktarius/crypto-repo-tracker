export interface CoinConfig {
  /** Stable id; for defaults this is the symbol lowercased, for custom ones a generated slug */
  id: string;
  symbol: string;
  name: string;
  /** Tracked GitHub repositories in owner/name form */
  repos: string[];
  /** true for user-added coins (pinned, removable) */
  custom: boolean;
  /** Brand color used for the logo fallback + accents */
  color: string;
  /** Logo URL (may be undefined -> fallback generated glyph) */
  logoUrl?: string;
}

export type RepoState =
  | 'loading'
  | 'ok'
  | 'error'
  | 'empty'
  | 'rate-limited'
  | 'not-found';

export interface RepoStats {
  repo: string;
  commits30d: number;
  commits180d: number;
  state: RepoState;
  error?: string;
}

export interface CoinStats {
  commits30d: number;
  commits180d: number;
  repoCount: number;
  repos: RepoStats[];
  lastUpdated: number | null;
  /** overall state derived from repo states */
  state: RepoState;
  error?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  used: number;
  /** epoch ms when the limit resets */
  resetAt: number | null;
  /** true when remaining is 0 or a request returned 403 secondary rate limit */
  exhausted: boolean;
}

export type SortKey = '30d' | '180d' | 'name';

export type CoinMap = Record<string, CoinConfig>;
