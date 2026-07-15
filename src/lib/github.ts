import type { RateLimitInfo, RepoState, RepoStats } from '../types';

const API_ROOT = 'https://api.github.com';

/**
 * A GitHub personal access token read from localStorage (user-supplied, optional).
 * Stored under the key set in storageKeys.token so it survives reloads.
 */
function getToken(): string | null {
  try {
    return localStorage.getItem('cdt:github-token') || null;
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem('cdt:github-token', token.trim());
    else localStorage.removeItem('cdt:github-token');
  } catch {
    /* ignore */
  }
}

export function getTokenPublic(): string | null {
  return getToken();
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

interface FetchResult<T> {
  data: T | null;
  status: number;
  rateLimit: RateLimitInfo | null;
  error?: string;
}

async function ghFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<FetchResult<T>> {
  try {
    const res = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers || {}) },
    });
    const rateLimit = parseRateLimit(res.headers);
    if (res.status === 403 || res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body?.message ||
        (rateLimit?.exhausted
          ? 'GitHub API rate limit exceeded.'
          : 'GitHub API rate limit reached. Try again later or add a token.');
      return { data: null, status: res.status, rateLimit, error: msg };
    }
    if (res.status === 404) {
      return {
        data: null,
        status: 404,
        rateLimit,
        error: 'Repository not found.',
      };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        status: res.status,
        rateLimit,
        error: body?.message || `Request failed (${res.status})`,
      };
    }
    const data = (await res.json()) as T;
    return { data, status: res.status, rateLimit };
  } catch (e) {
    return {
      data: null,
      status: 0,
      rateLimit: null,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

function parseRateLimit(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const used = headers.get('x-ratelimit-used');
  const reset = headers.get('x-ratelimit-reset');
  if (limit === null && remaining === null) return null;
  return {
    limit: limit ? Number(limit) : 0,
    remaining: remaining ? Number(remaining) : 0,
    used: used ? Number(used) : 0,
    resetAt: reset ? Number(reset) * 1000 : null,
    exhausted: remaining ? Number(remaining) === 0 : false,
  };
}

export async function fetchRateLimit(): Promise<RateLimitInfo | null> {
  const r = await ghFetch<{
    rate: { limit: number; remaining: number; used: number; reset: number };
  }>('/rate_limit');
  if (r.data?.rate) {
    return {
      limit: r.data.rate.limit,
      remaining: r.data.rate.remaining,
      used: r.data.rate.used,
      resetAt: r.data.rate.reset * 1000,
      exhausted: r.data.rate.remaining === 0,
    };
  }
  return r.rateLimit;
}

/** Validate that a repo exists and is accessible. */
export async function checkRepo(
  repo: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await ghFetch<{ id: number }>(`/repos/${repo}`);
  if (r.status === 404)
    return { ok: false, error: 'Repository not found or not accessible.' };
  if (r.status === 403 || r.status === 429)
    return { ok: false, error: 'Rate limited — try again or add a token.' };
  return { ok: r.data !== null };
}

/**
 * Fetch commit counts for a repo in the last 30 and 180 days using the
 * search API. The search API caps total_count at 1000, which is fine for
 * our windows but is noted in the UI via the "capped" flag when hit.
 */
export async function fetchRepoStats(repo: string): Promise<RepoStats> {
  const base: RepoStats = {
    repo,
    commits30d: 0,
    commits180d: 0,
    state: 'loading',
  };

  const now = Date.now();
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d180 = new Date(now - 180 * 24 * 60 * 60 * 1000).toISOString();

  // Run both queries in parallel.
  const [r30, r180] = await Promise.all([
    ghFetch<{ total_count: number; incomplete_results: boolean }>(
      `/search/commits?q=repo:${repo}+author-date:>=${d30}&per_page=1`,
      { headers: { Accept: 'application/vnd.github.cloak-preview+json' } },
    ),
    ghFetch<{ total_count: number; incomplete_results: boolean }>(
      `/search/commits?q=repo:${repo}+author-date:>=${d180}&per_page=1`,
      { headers: { Accept: 'application/vnd.github.cloak-preview+json' } },
    ),
  ]);

  // Rate limited on either -> whole repo is rate-limited.
  if (
    r30.status === 403 ||
    r30.status === 429 ||
    r180.status === 403 ||
    r180.status === 429
  ) {
    return { ...base, state: 'rate-limited', error: r30.error || r180.error };
  }
  // 404 on the repo itself.
  if (r30.status === 404 && r180.status === 404) {
    return { ...base, state: 'not-found', error: 'Repository not found.' };
  }

  const err = r30.error || r180.error;
  if (err && !r30.data && !r180.data) {
    return { ...base, state: 'error', error: err };
  }

  const c30 = r30.data?.total_count ?? 0;
  const c180 = r180.data?.total_count ?? 0;

  return {
    ...base,
    commits30d: c30,
    commits180d: c180,
    state: c30 === 0 && c180 === 0 ? 'empty' : 'ok',
  };
}

export type { RepoState };
