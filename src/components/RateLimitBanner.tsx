import { AlertTriangle, KeyRound, X } from 'lucide-react';
import { formatResetCountdown } from '../lib/format';
import type { RateLimitInfo } from '../types';

interface Props {
  rateLimit: RateLimitInfo | null;
  onAddToken: () => void;
  onDismiss: () => void;
  dismissed: boolean;
}

export function RateLimitBanner({
  rateLimit,
  onAddToken,
  onDismiss,
  dismissed,
}: Props) {
  if (!rateLimit?.exhausted || dismissed) return null;
  const hasToken = false; // token presence handled implicitly; banner always offers to add one

  return (
    <div className="flex items-center gap-3 rounded-xl border border-warning-500/30 bg-warning-500/10 px-4 py-3 text-sm text-warning-400 animate-fade-in">
      <AlertTriangle size={16} className="shrink-0" />
      <div className="flex-1">
        <span className="font-medium">GitHub API rate limit reached.</span>{' '}
        <span className="text-warning-400/80">
          Commit counts may be incomplete until{' '}
          {formatResetCountdown(rateLimit.resetAt)}.
        </span>
      </div>
      {!hasToken && (
        <button
          onClick={onAddToken}
          className="inline-flex items-center gap-1.5 rounded-lg border border-warning-500/40 px-2.5 py-1.5 text-xs font-medium text-warning-400 transition-colors hover:bg-warning-500/10"
        >
          <KeyRound size={12} /> Add token
        </button>
      )}
      <button
        onClick={onDismiss}
        className="rounded-lg p-1 text-warning-400/60 transition-colors hover:text-warning-400"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
