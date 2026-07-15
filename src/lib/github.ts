import type { RateLimitInfo, RepoState, RepoStats } from '../types';

const API_ROOT = 'https://api.github.com';

/**
 * Optional GitHub token from localStorage. Not required for a one-shot load
 * of a handful of repos (regular REST limit: 60/hr unauthenticated).
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
  link?: string | null;
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
    const link = res.headers.get('link');

    if (res.status === 403 || res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body?.message ||
        (rateLimit?.exhausted
          ? 'GitHub API rate limit exceeded.'
          : 'GitHub API rate limit reached. Try again later.');
      return { data: null, status: res.status, rateLimit, error: msg, link };
    }
    if (res.status === 404) {
      return {
        data: null,
        status: 404,
        rateLimit,
        error: 'Repository not found.',
        link,
      };
    }
    if (res.status === 409) {
      return {
        data: null,
        status: 409,
        rateLimit,
        error: 'Repository is empty or unavailable.',
        link,
      };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        status: res.status,
        rateLimit,
        error: body?.message || `Request failed (${res.status})`,
        link,
      };
    }
    const data = (await res.json()) as T;
    return { data, status: res.status, rateLimit, link };
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
    return { ok: false, error: 'Rate limited — try again later.' };
  return { ok: r.data !== null };
}

/**
 * Count commits since `sinceISO` with a single request:
 * `per_page=1` + parse `rel="last"` from the Link header.
 * Includes merge commits (GitHub Insights "excluding merges" will be a bit lower).
 */
async function countCommitsSince(
  repo: string,
  sinceISO: string,
): Promise<FetchResult<number>> {
  const path = `/repos/${repo}/commits?since=${encodeURIComponent(sinceISO)}&per_page=1`;
  const r = await ghFetch<unknown[]>(path);
  if (r.data === null && r.status !== 200) {
    return { ...r, data: null };
  }

  const last = r.link?.match(/[?&]page=(\d+)>;\s*rel="last"/i);
  if (last) {
    return { ...r, data: Number(last[1]) };
  }

  // No pagination → 0 or 1 commit on this page.
  const n = Array.isArray(r.data) ? r.data.length : 0;
  return { ...r, data: n };
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Commit counts for 30d / 180d via the commits list API (accurate, 2 REST calls).
 */
export async function fetchRepoStats(repo: string): Promise<RepoStats> {
  const base: RepoStats = {
    repo,
    commits30d: 0,
    commits180d: 0,
    state: 'loading',
  };

  const [r30, r180] = await Promise.all([
    countCommitsSince(repo, daysAgoISO(30)),
    countCommitsSince(repo, daysAgoISO(180)),
  ]);

  if (
    r30.status === 403 ||
    r30.status === 429 ||
    r180.status === 403 ||
    r180.status === 429
  ) {
    return { ...base, state: 'rate-limited', error: r30.error || r180.error };
  }
  if (r30.status === 404 && r180.status === 404) {
    return { ...base, state: 'not-found', error: 'Repository not found.' };
  }
  if (r30.status === 409 || r180.status === 409) {
    return {
      ...base,
      state: 'empty',
      error: r30.error || r180.error,
    };
  }
  if (r30.data === null && r180.data === null) {
    return {
      ...base,
      state: 'error',
      error: r30.error || r180.error || 'Failed to load commits.',
    };
  }

  const c30 = r30.data ?? 0;
  const c180 = r180.data ?? 0;

  return {
    ...base,
    commits30d: c30,
    commits180d: c180,
    state: c30 === 0 && c180 === 0 ? 'empty' : 'ok',
  };
}

export type { RepoState };
