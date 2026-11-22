/**
 * Browser API wrapper. Same-origin by default (`/api/...` on Vercel).
 * Optional `window.GOORGANIC_API_URL` overrides the origin. Never put secrets here.
 */

export function getApiBase() {
  if (typeof window === 'undefined' || !window.GOORGANIC_API_URL) return '';
  return String(window.GOORGANIC_API_URL).replace(/\/$/, '');
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, headers?: Record<string, string> }} [options]
 */
export async function apiRequest(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  /** @type {RequestInit} */
  const init = {
    method: options.method || 'GET',
    credentials: 'include',
    headers
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${getApiBase()}${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}
