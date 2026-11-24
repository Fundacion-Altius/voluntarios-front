import NextAuth, { type NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { oauthFromEnv } from '@/lib/oauthFromEnv';
import { createSignedState, verifySignedState, isAuthHost, getAuthHost } from '@/lib/authState';
import { parseTenantSlugFromHost } from '@/lib/tenantHost';

declare module 'next-auth' {
  interface Session {
    csrfToken?: string;
    authToken?: string;
    user_type?: string;
  }
  interface User {
    role?: string;
    authToken?: string;
    user_type?: string;
  }
}

type Credentials = Record<string, string> | undefined;

function userFromPrefilledCredentials(credentials: NonNullable<Credentials>) {
  return {
    id: credentials.user_id || credentials.email,
    email: credentials.email,
    name: credentials.name,
    role: credentials.role,
    user_type: credentials.user_type,
    csrfToken: credentials.csrfToken,
    authToken: credentials.authToken,
  };
}

function hasPrefilledSession(credentials: NonNullable<Credentials>): boolean {
  return Boolean(credentials.name && credentials.role && credentials.authToken);
}

function forwardedHostOf(req: any): string | undefined {
  if (typeof req?.headers?.host === 'string') return req.headers.host;
  const forwarded = req?.headers?.['x-forwarded-host'];
  return forwarded ? String(forwarded) : undefined;
}

async function loginWithBackend(credentials: NonNullable<Credentials>, req: any) {
  const forwardedHost = forwardedHostOf(req);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(forwardedHost ? { 'X-Forwarded-Host': forwardedHost } : {}),
    },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok || !data.user) return null;

  return {
    id: data.user.user_id || data.user.id,
    email: data.user.email,
    name: data.user.display_name || data.user.name,
    role: data.user.role,
    user_type: data.user.user_type,
    csrfToken: data.csrfToken,
    authToken: data.authToken,
  };
}

async function authorizeCredentials(credentials: Credentials, req: any) {
  if (!credentials?.email) return null;
  if (hasPrefilledSession(credentials)) return userFromPrefilledCredentials(credentials);
  if (!credentials.password) return null;
  return loginWithBackend(credentials, req);
}

function handoffUrlFor(urlObj: URL, baseUrl: string, state: string): string {
  const handoffUrl = new URL('/api/auth/tenant-handoff', baseUrl);
  handoffUrl.searchParams.set('state', state);
  // Preserve any error parameters
  if (urlObj.searchParams.get('error')) {
    handoffUrl.searchParams.set('error', urlObj.searchParams.get('error') || '');
    handoffUrl.searchParams.set('error_description', urlObj.searchParams.get('error_description') || '');
  }
  return handoffUrl.toString();
}

async function redirectCallback({ url, baseUrl }: { url: string; baseUrl: string }) {
  const urlObj = new URL(url);

  // If this is an OAuth callback on an auth host with state parameter
  const isAuthCallback = isAuthHost(urlObj.host) && urlObj.pathname.includes('/api/auth/callback');
  const state = isAuthCallback ? urlObj.searchParams.get('state') : null;
  // Verify the state parameter before redirecting to the tenant handoff endpoint
  if (state && verifySignedState(state)) return handoffUrlFor(urlObj, baseUrl, state);

  return url;
}

async function sessionCallback({ session, token }: { session: any; token: any }) {
  if (session.user) {
    session.user.email = token.email || '';
    session.user.name = token.name || '';
    (session.user as any).role = token.role as string;
    (session.user as any).user_type = token.user_type as string;
    session.csrfToken = token.csrfToken as string;
    session.authToken = token.authToken as string;
    (session.user as any).id = (token.userId as string) || token.sub || '';
  }
  return session;
}

async function applyAccountProfile(token: any, account: any) {
  if (account.provider !== 'azure-ad' && account.provider !== 'google') return;
  token.authToken = (account.id_token || account.access_token) as string;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${account.id_token}` },
    });
    if (res.ok) {
      const profile = await res.json();
      token.role = profile.role;
      token.user_type = profile.user_type;
    }
  } catch {}
}

function applyUserClaims(token: any, user: any) {
  token.role = user.role || token.role;
  token.user_type = user.user_type || token.user_type;
  token.csrfToken = user.csrfToken || token.csrfToken;
  token.authToken = user.authToken || token.authToken;
  token.userId = user.id || token.userId;
}

async function jwtCallback({ token, account, user, trigger, session }: { token: any; account?: any; user?: any; trigger?: string; session?: any }) {
  if (trigger === 'update') {
    const next = (session as { authToken?: string } | undefined)?.authToken;
    if (next) token.authToken = next;
    return token;
  }
  if (account) {
    await applyAccountProfile(token, account);
    token.email = token.email;
  }
  if (user) applyUserClaims(token, user);
  return token;
}

function getAuthOptions(): NextAuthOptions {
  const oauth = oauthFromEnv();
  const providers: NextAuthOptions['providers'] = [];

  if (oauth.google) {
    providers.push(
      GoogleProvider({
        clientId: oauth.googleClientId,
        clientSecret: oauth.googleClientSecret,
      }),
    );
  }

  if (oauth.azure) {
    providers.push(
      AzureADProvider({
        clientId: oauth.azureClientId,
        clientSecret: oauth.azureClientSecret,
        tenantId: oauth.azureTenantId,
        authorization: {
          params: {
            scope: 'openid profile email offline_access',
          },
        },
      }),
    );
  }

  providers.push(
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        name: { label: 'Name' },
        role: { label: 'Role' },
        user_type: { label: 'User Type' },
        csrfToken: { label: 'CSRF Token' },
        authToken: { label: 'Auth Token' },
        user_id: { label: 'User ID' },
      },
      authorize: authorizeCredentials,
    }),
  );

  return {
    providers,
    callbacks: {
      async signIn() {
        return true;
      },
      redirect: redirectCallback,
      session: sessionCallback,
      jwt: jwtCallback,
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
    },
    jwt: {
      maxAge: 30 * 24 * 60 * 60,
    },
  };
}

const handler = (...args: [any, any]) => NextAuth(getAuthOptions())(...args);

export { handler as GET, handler as POST };
