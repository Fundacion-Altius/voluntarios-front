/**
 * Unit tests for receive-handoff endpoint
 * Tests the session establishment on tenant hosts
 */

import { GET, POST } from './route';
import { NextResponse } from 'next/server';
import { verifyHandoffToken, isAuthHost } from '@/lib/authState';
import { encode } from 'next-auth/jwt';

// Mock the dependencies
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(),
}));

jest.mock('@/lib/authState', () => ({
  verifyHandoffToken: jest.fn(),
  isAuthHost: jest.fn(),
}));

describe('receive-handoff endpoint', () => {
  const mockRequest = (url: string, headers?: Record<string, string>) => {
    return new Request(url, {
      headers: headers || {},
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NODE_ENV;
  });

  describe('GET method', () => {
    it('should return 400 for missing token parameter', async () => {
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/receive-handoff');
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('missing_token');
    });

    it('should return 400 for invalid token', async () => {
      (verifyHandoffToken as jest.Mock).mockReturnValue(null);
      
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=invalid-token');
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('invalid_token');
    });

    it('should return 400 for expired token', async () => {
      const expiredPayload = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        authToken: 'test-token',
        csrfToken: 'test-csrf',
        expires: Date.now() - 1000, // 1 second ago
      };
      (verifyHandoffToken as jest.Mock).mockReturnValue(expiredPayload);
      
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=expired-token');
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('token_expired');
    });

    it('should return 400 when on auth host', async () => {
      const validPayload = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        authToken: 'test-token',
        csrfToken: 'test-csrf',
        expires: Date.now() + 5 * 60 * 1000,
      };
      (verifyHandoffToken as jest.Mock).mockReturnValue(validPayload);
      (isAuthHost as jest.Mock).mockReturnValue(true);
      
      const request = mockRequest('http://localhost:3000/api/auth/receive-handoff?token=valid-token', {
        host: 'localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('on_auth_host');
    });

    it('should create session and redirect for valid token', async () => {
      const validPayload = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          user_type: 'staff',
        },
        authToken: 'test-auth-token',
        csrfToken: 'test-csrf-token',
        expires: Date.now() + 5 * 60 * 1000,
      };
      
      (verifyHandoffToken as jest.Mock).mockReturnValue(validPayload);
      (isAuthHost as jest.Mock).mockReturnValue(false);
      (encode as jest.Mock).mockResolvedValue('test-session-token');
      
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=valid-token&return_to=/admin/dashboard', {
        host: 'fundacionaltius.localhost:3000',
      });
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toBe('/admin/dashboard');
      
      // Verify session cookie is set
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('next-auth.session-token=test-session-token');
      expect(setCookie).toContain('Path=/');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');
      
      // Verify encode was called with correct payload
      expect(encode).toHaveBeenCalledWith({
        token: 'test-auth-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          user_type: 'staff',
        },
        name: 'Test User',
        email: 'test@example.com',
        sub: 'user-123',
        role: 'admin',
        user_type: 'staff',
        csrfToken: 'test-csrf-token',
        authToken: 'test-auth-token',
      });
    });

    it('should set CSRF token cookie if present', async () => {
      const validPayload = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        authToken: 'test-auth-token',
        csrfToken: 'test-csrf-token',
        expires: Date.now() + 5 * 60 * 1000,
      };
      
      (verifyHandoffToken as jest.Mock).mockReturnValue(validPayload);
      (isAuthHost as jest.Mock).mockReturnValue(false);
      (encode as jest.Mock).mockResolvedValue('test-session-token');
      
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=valid-token', {
        host: 'fundacionaltius.localhost:3000',
      });
      const response = await GET(request);
      
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('next-auth.csrf-token=test-csrf-token');
    });

    it('should use secure cookies in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const validPayload = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        authToken: 'test-auth-token',
        csrfToken: 'test-csrf-token',
        expires: Date.now() + 5 * 60 * 1000,
      };
      
      (verifyHandoffToken as jest.Mock).mockReturnValue(validPayload);
      (isAuthHost as jest.Mock).mockReturnValue(false);
      (encode as jest.Mock).mockResolvedValue('test-session-token');
      
      const request = mockRequest('http://fundacionaltius.klaruk.com/api/auth/receive-handoff?token=valid-token', {
        host: 'fundacionaltius.klaruk.com',
      });
      const response = await GET(request);
      
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('Secure');
    });

    it('should handle errors gracefully', async () => {
      (verifyHandoffToken as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const request = mockRequest('http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=valid-token');
      const response = await GET(request);
      
      expect(response.status).toBe(302);
      const url = new URL(response.headers.get('location') || '');
      expect(url.searchParams.get('error')).toBe('session_creation_failed');
    });
  });

  describe('POST method', () => {
    it('should handle POST requests the same as GET', async () => {
      const validPayload = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        authToken: 'test-auth-token',
        csrfToken: 'test-csrf-token',
        expires: Date.now() + 5 * 60 * 1000,
      };
      
      (verifyHandoffToken as jest.Mock).mockReturnValue(validPayload);
      (isAuthHost as jest.Mock).mockReturnValue(false);
      (encode as jest.Mock).mockResolvedValue('test-session-token');
      
      const request = new Request('http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=valid-token&return_to=/admin/dashboard', {
        method: 'POST',
        headers: { host: 'fundacionaltius.localhost:3000' },
      });
      const response = await POST(request);
      
      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toBe('/admin/dashboard');
    });
  });
});
