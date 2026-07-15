import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Clock,
  GitCommit,
  GitFork,
  Inbox,
  MoreVertical,
  Pencil,
  Pin,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { formatNumber, formatRelative } from '../lib/format';
import type { CoinConfig, CoinStats } from '../types';
import { CoinLogo } from './CoinLogo';

interface Props {
  coin: CoinConfig;
  stats: CoinStats | undefined;
  onEdit: (coin: CoinConfig) => void;
  onRemove: (id: string) => void;
  onResetRepos: (id: string) => void;
}

const stateMeta: Record<
  CoinStats['state'],
  { label: string; className: string; dot: string }
> = {
  loading: {
    label: 'Loading',
    className: 'text-base-300',
    dot: 'bg-base-400',
  },
  ok: {
    label: 'Live',
    className: 'text-success-400',
    dot: 'bg-success-500',
  },
  empty: {
    label: 'No commits',
    className: 'text-base-300',
    dot: 'bg-base-500',
  },
  error: {
    label: 'Error',
    className: 'text-error-400',
    dot: 'bg-error-500',
  },
  'rate-limited': {
    label: 'Rate limited',
    className: 'text-warning-400',
    dot: 'bg-warning-500',
  },
  'not-found': {
    label: 'Repo not found',
    className: 'text-error-400',
    dot: 'bg-error-500',
  },
};

export function CoinCard({
  coin,
  stats,
  onEdit,
  onRemove,
  onResetRepos,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const s = stats;
  const stateKey = s?.state ?? 'loading';
  const meta = stateMeta[stateKey];
  const isLoading = stateKey === 'loading';

  return (
    <div className="group relative flex flex-col rounded-2xl border border-base-700/80 bg-base-850/80 p-4 transition-all duration-200 hover:border-base-600 hover:bg-base-800/80 hover:shadow-lg hover:shadow-black/20">
      {/* Top row: identity */}
      <div className="flex items-start gap-3">
        <CoinLogo coin={coin} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base-100">{coin.symbol}</span>
            {coin.custom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-300">
                <Pin size={9} /> Pinned
              </span>
            )}
          </div>
          <p className="truncate text-sm text-base-400">{coin.name}</p>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1.5 text-base-400 transition-colors hover:bg-base-700 hover:text-base-100"
            aria-label="Coin actions"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-base-700 bg-base-800 py-1 shadow-xl shadow-black/40 animate-scale-in">
                <MenuItem
                  icon={<Pencil size={14} />}
                  label="Edit repos"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(coin);
                  }}
                />
                {coin.custom && (
                  <MenuItem
                    icon={<RotateCcw size={14} />}
                    label="Reset repos"
                    onClick={() => {
                      setMenuOpen(false);
                      onResetRepos(coin.id);
                    }}
                  />
                )}
                {coin.custom && (
                  <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Remove coin"
                    danger
                    onClick={() => {
                      setMenuOpen(false);
                      onRemove(coin.id);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatTile
          label="30d commits"
          value={s ? formatNumber(s.commits30d) : '—'}
          icon={<Activity size={13} />}
          loading={isLoading}
          highlight
        />
        <StatTile
          label="6mo commits"
          value={s ? formatNumber(s.commits180d) : '—'}
          icon={<GitCommit size={13} />}
          loading={isLoading}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <MiniStat
          icon={<GitFork size={12} />}
          label="Repos"
          value={String(coin.repos.length)}
        />
        <MiniStat
          icon={<Clock size={12} />}
          label="Updated"
          value={formatRelative(s?.lastUpdated ?? null)}
        />
      </div>

      {/* Status bar */}
      <div className="mt-3 flex items-center justify-between border-t border-base-700/60 pt-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.className}`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot} ${isLoading ? 'pulse-dot' : ''}`}
          />
          {meta.label}
        </span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-base-400 transition-colors hover:text-base-100"
        >
          {coin.repos.length} repo{coin.repos.length !== 1 ? 's' : ''}
          <ChevronDown
            size={13}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Expanded repo list */}
      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {coin.repos.map((repo) => {
            const rs = s?.repos.find((r) => r.repo === repo);
            return <RepoRow key={repo} repo={repo} rs={rs} />;
          })}
          {coin.repos.length === 0 && (
            <p className="text-xs text-base-400">No repos configured.</p>
          )}
        </div>
      )}

      {/* Error / rate-limit detail */}
      {s?.error && stateKey === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-xs text-error-400">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{s.error}</span>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  loading,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        highlight
          ? 'border-accent-500/20 bg-accent-500/5'
          : 'border-base-700/60 bg-base-900/40'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-base-400">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
          highlight ? 'text-accent-300' : 'text-base-100'
        } ${loading ? 'animate-pulse' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-base-400">
      <span className="text-base-500">{icon}</span>
      <span>{label}</span>
      <span className="ml-auto font-mono text-base-200 tabular-nums">
        {value}
      </span>
    </div>
  );
}

function RepoRow({
  repo,
  rs,
}: {
  repo: string;
  rs: CoinStats['repos'][number] | undefined;
}) {
  const state = rs?.state ?? 'loading';
  const dotMap: Record<string, string> = {
    ok: 'bg-success-500',
    empty: 'bg-base-500',
    loading: 'bg-base-400 animate-pulse',
    error: 'bg-error-500',
    'rate-limited': 'bg-warning-500',
    'not-found': 'bg-error-500',
  };
  return (
    <div className="flex items-center gap-2 rounded-lg bg-base-900/50 px-2.5 py-1.5 text-xs">
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotMap[state] ?? 'bg-base-500'}`}
      />
      <a
        href={`https://github.com/${repo}`}
        target="_blank"
        rel="noreferrer"
        className="truncate text-base-300 transition-colors hover:text-accent-300"
      >
        {repo}
      </a>
      <span className="ml-auto flex items-center gap-2 font-mono tabular-nums text-base-400">
        {state === 'empty' ? (
          <span className="inline-flex items-center gap-1 text-base-500">
            <Inbox size={11} /> 0
          </span>
        ) : state === 'error' || state === 'not-found' ? (
          <span className="text-error-400" title={rs?.error}>
            —
          </span>
        ) : state === 'rate-limited' ? (
          <span className="text-warning-400" title={rs?.error}>
            —
          </span>
        ) : (
          <>
            <span title="30d">{rs ? formatNumber(rs.commits30d) : '—'}</span>
            <span className="text-base-600">/</span>
            <span title="6mo">{rs ? formatNumber(rs.commits180d) : '—'}</span>
          </>
        )}
      </span>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-base-700 ${
        danger ? 'text-error-400 hover:bg-error-500/10' : 'text-base-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
