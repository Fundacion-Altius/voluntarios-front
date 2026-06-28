import { createClient } from '@hey-api/client-fetch';
import { getAuthToken, getCSRFToken } from '@/app/lib/csrf';

export const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
});

client.interceptors.request.use((request) => {
  const authToken = getAuthToken();
  if (authToken) {
    request.headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (request.method !== 'GET') {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      request.headers.set('X-CSRF-Token', csrfToken);
    }
  }

  return request;
});
