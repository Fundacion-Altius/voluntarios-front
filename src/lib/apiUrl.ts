const ENV_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return ENV_API;
  }
  // Browser: always same-origin so the Next BFF can attach Authorization from
  // the host-only NextAuth session (tenant *.localhost / *.klaruk.com). Direct
  // calls to :3001 would skip that handoff and 401 with a logged-in UI.
  return `${window.location.protocol}//${window.location.host}`;
}
