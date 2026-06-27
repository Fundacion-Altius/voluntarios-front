const HOST = process.env.NEXT_PUBLIC_API_URL;

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function withAuth(options: RequestInit = {}): RequestInit {
  const headers = new Headers(options.headers);
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  if (_authToken) {
    headers.set('Authorization', `Bearer ${_authToken}`);
  }
  return {
    ...options,
    credentials: 'include',
    headers,
  };
}

export async function apiPost(
  path: string,
  body: unknown
): Promise<Response> {
  return fetch(`${HOST}${path}`, withAuth({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export async function apiPut(
  path: string,
  body: unknown
): Promise<Response> {
  return fetch(`${HOST}${path}`, withAuth({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export async function apiDelete(path: string): Promise<Response> {
  return fetch(`${HOST}${path}`, withAuth({
    method: 'DELETE',
  }));
}

export async function apiGet(path: string): Promise<Response> {
  return fetch(`${HOST}${path}`, withAuth());
}
