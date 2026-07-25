const ENV_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return ENV_API;
  }
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') {
    return ENV_API;
  }
  return `${window.location.protocol}//${window.location.host}`;
}
