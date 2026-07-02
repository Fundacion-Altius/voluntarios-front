import { createClient } from '@hey-api/client-fetch';
import { getAuthToken, getCSRFToken } from '@/app/lib/csrf';
import { getAPIUrl } from './utils';

export const client = createClient({
  baseUrl: getAPIUrl(),
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
