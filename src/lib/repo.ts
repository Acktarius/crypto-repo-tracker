/**
 * Normalize a pasted GitHub URL or owner/name into `owner/name`.
 * Accepts e.g. https://github.com/ryo-currency/ryo-currency
 */
export function parseRepoSlug(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/\.git$/i, '').replace(/\/+$/, '');

  const url = s.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i,
  );
  if (url) return `${url[1]}/${url[2]}`;

  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(s)) return s;
  return null;
}
