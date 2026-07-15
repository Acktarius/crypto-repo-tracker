import { AlertCircle, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEFAULT_COINS } from '../data/defaults';
import type { CoinConfig } from '../types';
import { Modal } from './Modal';

interface Props {
  coin: CoinConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, repos: string[]) => void;
  onReset: (id: string) => void;
}

export function EditReposModal({
  coin,
  open,
  onClose,
  onSave,
  onReset,
}: Props) {
  const [repos, setRepos] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (coin) {
      setRepos([...coin.repos]);
      setInput('');
      setError('');
    }
  }, [coin]);

  if (!coin) return null;

  const addRepo = () => {
    const v = input.trim();
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
    setInput('');
    setError('');
  };

  const removeRepo = (repo: string) => {
    setRepos((prev) => prev.filter((r) => r !== repo));
  };

  const handleSave = () => {
    onSave(coin.id, repos);
    onClose();
  };

  const handleReset = () => {
    onReset(coin.id);
    const def = DEFAULT_COINS.find((d) => d.id === coin.id);
    setRepos(def ? [...def.repos] : []);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit repos · ${coin.symbol}`}
      subtitle={coin.name}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-base-400">
            Add repository
          </label>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
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
          {error && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error-400">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          <p className="mt-1.5 text-xs text-base-500">
            Tip: press Enter to add. Use the full owner/name path from GitHub.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-base-400">
              Tracked repos ({repos.length})
            </span>
            {!coin.custom && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-base-400 transition-colors hover:text-accent-300"
              >
                <RotateCcw size={11} /> Reset to default
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {repos.map((repo) => (
              <div
                key={repo}
                className="flex items-center gap-2 rounded-lg border border-base-700/60 bg-base-900/60 px-3 py-2 text-sm"
              >
                <a
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-base-200 transition-colors hover:text-accent-300"
                >
                  {repo}
                </a>
                <button
                  onClick={() => removeRepo(repo)}
                  className="ml-auto rounded p-1 text-base-500 transition-colors hover:bg-error-500/10 hover:text-error-400"
                  aria-label={`Remove ${repo}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {repos.length === 0 && (
              <p className="rounded-lg border border-dashed border-base-700 px-3 py-3 text-center text-xs text-base-500">
                No repos yet. Add at least one above.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-base-700 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-base-700 px-4 py-2 text-sm text-base-300 transition-colors hover:bg-base-800 hover:text-base-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-base-950 transition-colors hover:bg-accent-400"
          >
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
