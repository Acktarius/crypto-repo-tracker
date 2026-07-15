import { AlertCircle, Pin, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    symbol: string;
    name: string;
    repos: string[];
    logoUrl?: string;
  }) => void;
}

export function AddCoinModal({ open, onClose, onAdd }: Props) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [repos, setRepos] = useState<string[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSymbol('');
      setName('');
      setLogoUrl('');
      setRepos([]);
      setRepoInput('');
      setError('');
    }
  }, [open]);

  const addRepo = () => {
    const v = repoInput.trim();
    if (!v) return;
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(v)) {
      setError('Use the owner/name format, e.g. bitcoin/bitcoin');
      return;
    }
    if (repos.some((r) => r.toLowerCase() === v.toLowerCase())) {
      setError('That repo is already in the list.');
      return;
    }
    setRepos((prev) => [...prev, v]);
    setRepoInput('');
    setError('');
  };

  const handleSubmit = () => {
    if (!symbol.trim()) {
      setError('Symbol is required.');
      return;
    }
    if (!name.trim()) {
      setError('Coin name is required.');
      return;
    }
    if (repos.length === 0) {
      setError('Add at least one repository.');
      return;
    }
    onAdd({
      symbol: symbol.trim(),
      name: name.trim(),
      repos,
      logoUrl: logoUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add custom coin"
      subtitle="Custom coins are pinned to the top of your dashboard"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-base-400">
              Symbol
            </label>
            <input
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setError('');
              }}
              placeholder="SOL"
              className="w-full rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 placeholder:text-base-500 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-base-400">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Solana"
              className="w-full rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 placeholder:text-base-500 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-base-400">
            Logo URL <span className="text-base-500">(optional)</span>
          </label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…/logo.png"
            className="w-full rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 placeholder:text-base-500 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-base-400">
            Repositories
          </label>
          <div className="flex gap-2">
            <input
              value={repoInput}
              onChange={(e) => {
                setRepoInput(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRepo();
                }
              }}
              placeholder="owner/name"
              className="flex-1 rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 placeholder:text-base-500 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
            <button
              onClick={addRepo}
              className="inline-flex items-center gap-1 rounded-xl bg-base-700 px-3 py-2 text-sm text-base-100 transition-colors hover:bg-base-600"
            >
              <Plus size={15} /> Add
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            {repos.map((repo) => (
              <div
                key={repo}
                className="flex items-center gap-2 rounded-lg border border-base-700/60 bg-base-900/60 px-3 py-2 text-sm"
              >
                <span className="truncate text-base-200">{repo}</span>
                <button
                  onClick={() =>
                    setRepos((prev) => prev.filter((r) => r !== repo))
                  }
                  className="ml-auto rounded p-1 text-base-500 transition-colors hover:bg-error-500/10 hover:text-error-400"
                  aria-label={`Remove ${repo}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-error-400">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-base-700 pt-4">
          <span className="inline-flex items-center gap-1 text-xs text-accent-300">
            <Pin size={11} /> Pinned to top
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-base-700 px-4 py-2 text-sm text-base-300 transition-colors hover:bg-base-800 hover:text-base-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-base-950 transition-colors hover:bg-accent-400"
            >
              Add coin
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
