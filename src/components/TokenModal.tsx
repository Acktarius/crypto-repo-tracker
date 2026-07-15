import { Check, Eraser, ExternalLink, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTokenPublic, setToken } from '../lib/github';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TokenModal({ open, onClose, onSaved }: Props) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const hasStored = !!getTokenPublic();

  useEffect(() => {
    if (open) {
      setValue(getTokenPublic() || '');
      setSaved(false);
      setCleared(false);
    }
  }, [open]);

  const handleSave = () => {
    setToken(value.trim() || null);
    setSaved(true);
    setCleared(false);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setToken(null);
    setValue('');
    setCleared(true);
    setSaved(false);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 600);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="GitHub token"
      subtitle="Optional — raises the rate limit from 60 to 5,000 requests/hour"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-base-400">
            Personal access token
          </label>
          <div className="relative">
            <KeyRound
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-500"
            />
            <input
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setSaved(false);
                setCleared(false);
              }}
              placeholder="ghp_… or github_pat_…"
              autoComplete="off"
              className="w-full rounded-xl border border-base-700 bg-base-900 py-2.5 pl-9 pr-3 font-mono text-sm text-base-100 placeholder:text-base-500 focus:border-accent-500/60 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <p className="mt-2 text-xs text-base-500">
            Kept only in this browser&apos;s localStorage (not encrypted). It is
            never sent anywhere except to api.github.com. A fine-grained token
            with public-repo read access is enough. Clear it anytime with the
            broom button.
          </p>
        </div>

        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent-300 transition-colors hover:text-accent-200"
        >
          Create a token on GitHub <ExternalLink size={11} />
        </a>

        <div className="flex items-center justify-between gap-2 border-t border-base-700 pt-4">
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasStored && !value.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-700 px-3 py-2 text-sm text-base-400 transition-colors hover:border-error-500/40 hover:bg-error-500/10 hover:text-error-400 disabled:cursor-not-allowed disabled:opacity-40"
            title="Remove token from this browser"
          >
            <Eraser size={14} />
            {cleared ? 'Cleared' : 'Clear'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-base-700 px-4 py-2 text-sm text-base-300 transition-colors hover:bg-base-800 hover:text-base-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!value.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-base-950 transition-colors hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saved ? (
                <>
                  <Check size={15} /> Saved
                </>
              ) : (
                'Save token'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
