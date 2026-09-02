/**
 * Unit tests for tenant-handoff endpoint
 * Tests the OAuth callback handler on the auth host
 */

import { GET, POST } from './route';
import { NextResponse } from 'next/server';
import { verifySignedState, createHandoffToken, isAuthHost } from '@/lib/authState';
import { getToken } from 'next-auth/jwt';

// Mock the dependencies
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('@/lib/authState', () => ({
  verifySignedState: jest.fn(),
  createHandoffToken: jest.fn(),
  isAuthHost: jest.fn(),
  getAuthHost: jest.fn(() => 'http://localhost:3000'),
}));

describe('tenant-handoff endpoint', () => {
  const mockRequest = (url: string, headers?: Record<string, string>) => {
    return new Request(url, {
      headers: headers || {},
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
  });

  describe('GET method', () => {
    it('should return 400 for missing state parameter', async () => {
      const request = mockRequest('http://localhost:3000/api/auth/tenant-handoff');
      const response = await GET(request);
      
      expect(response.status).toBe(302); // Redirect
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('missing_state');
    });

    it('should return 400 for invalid state parameter', async () => {
      (verifySignedState as jest.Mock).mockReturnValue(null);
      
      const request = mockRequest('http://localhost:3000/api/auth/tenant-handoff?state=invalid-state');
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('invalid_state');
    });

    it('should return 400 when not on auth host', async () => {
      (verifySignedState as jest.Mock).mockReturnValue({ tenant: 'fundacionaltius', returnTo: '/admin/dashboard' });
      (isAuthHost as jest.Mock).mockReturnValue(false);
      
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/tenant-handoff?state=valid-state', {
        host: 'fundacionaltius.localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('not_auth_host');
    });

    it('should return 400 when no session found', async () => {
      (verifySignedState as jest.Mock).mockReturnValue({ tenant: 'fundacionaltius', returnTo: '/admin/dashboard' });
      (isAuthHost as jest.Mock).mockReturnValue(true);
      (getToken as jest.Mock).mockResolvedValue(null);
      
      const request = mockRequest('http://localhost:3000/api/auth/tenant-handoff?state=valid-state', {
        host: 'localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('no_session');
    });

    it('should create handoff token and redirect to tenant host for valid state and session', async () => {
      const mockSession = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        user_type: 'staff',
        authToken: 'test-auth-token',
        csrfToken: 'test-csrf-token',
      };
      
      (verifySignedState as jest.Mock).mockReturnValue({ tenant: 'fundacionaltius', returnTo: '/admin/dashboard' });
      (isAuthHost as jest.Mock).mockReturnValue(true);
      (getToken as jest.Mock).mockResolvedValue(mockSession);
      (createHandoffToken as jest.Mock).mockReturnValue('test-handoff-token');
      
      const request = mockRequest('http://localhost:3000/api/auth/tenant-handoff?state=valid-state', {
        host: 'localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('fundacionaltius.localhost:3000/api/auth/receive-handoff');
      expect(location).toContain('token=test-handoff-token');
      expect(location).toContain('return_to=/admin/dashboard');
      
      // Verify createHandoffToken was called with correct payload
      expect(createHandoffToken).toHaveBeenCalledWith({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          user_type: 'staff',
        },
        authToken: 'test-auth-token',
        csrfToken: 'test-csrf-token',
        expires: expect.any(Number),
      });
    });

    it('should handle OAuth errors', async () => {
      const request = mockRequest('http://localhost:3000/api/auth/tenant-handoff?error=access_denied&error_description=User+denied', {
        host: 'localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('access_denied');
      expect(url.searchParams.get('error_description')).toBe('User denied');
    });

    it('should handle errors gracefully', async () => {
      (verifySignedState as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const request = mockRequest('http://localhost:3000/api/auth/tenant-handoff?state=valid-state', {
        host: 'localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('handoff_failed');
    });
  });

  describe('POST method', () => {
    it('should handle POST requests the same as GET', async () => {
      const mockSession = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      (verifySignedState as jest.Mock).mockReturnValue({ tenant: 'fundacionaltius', returnTo: '/admin/dashboard' });
      (isAuthHost as jest.Mock).mockReturnValue(true);
      (getToken as jest.Mock).mockResolvedValue(mockSession);
      (createHandoffToken as jest.Mock).mockReturnValue('test-handoff-token');
      
      const request = new Request('http://localhost:3000/api/auth/tenant-handoff?state=valid-state', {
        method: 'POST',
        headers: { host: 'localhost:3000' },
      });
      const response = await POST(request);
      
      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('fundacionaltius.localhost:3000/api/auth/receive-handoff');
    });
  });
});
