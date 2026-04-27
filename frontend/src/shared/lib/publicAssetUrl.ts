/**
 * Resolves a stored API-relative path (`/api/uploads/...`) for <img> and CSS url().
 * In dev, Vite proxies `/api` to the backend. In prod, set VITE_API_URL if the API is on another host.
 */
export function publicAssetUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (path.startsWith('/api') && base) {
    return `${base}${path}`;
  }
  return path;
}
