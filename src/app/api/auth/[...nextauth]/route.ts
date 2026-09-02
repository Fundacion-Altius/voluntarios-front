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
      async authorize(credentials, req) {
        if (!credentials?.email) return null;

        if (credentials?.name && credentials?.role && credentials?.authToken) {
          return {
            id: (credentials.user_id as string) || (credentials.email as string),
            email: credentials.email as string,
            name: credentials.name as string,
            role: credentials.role as string,
            user_type: credentials.user_type as string,
            csrfToken: credentials.csrfToken as string,
            authToken: credentials.authToken as string,
          };
        }

        if (!credentials?.password) return null;

        const forwardedHost =
          typeof req?.headers?.host === 'string'
            ? req.headers.host
            : req?.headers?.['x-forwarded-host'];

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(forwardedHost ? { 'X-Forwarded-Host': String(forwardedHost) } : {}),
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
      },
    }),
  );

  return {
    providers,
    callbacks: {
      async signIn() {
        return true;
      },
      async redirect({ url, baseUrl }) {
        const urlObj = new URL(url);
        
        // If this is an OAuth callback on an auth host with state parameter
        const host = urlObj.host;
        if (isAuthHost(host) && urlObj.pathname.includes('/api/auth/callback')) {
          const state = urlObj.searchParams.get('state');
          if (state) {
            // Verify the state parameter
            const verifiedState = verifySignedState(state);
            if (verifiedState) {
              // Redirect to tenant handoff endpoint
              const handoffUrl = new URL(
                '/api/auth/tenant-handoff',
                baseUrl
              );
              handoffUrl.searchParams.set('state', state);
              // Preserve any error parameters
              if (urlObj.searchParams.get('error')) {
                handoffUrl.searchParams.set('error', urlObj.searchParams.get('error') || '');
                handoffUrl.searchParams.set('error_description', urlObj.searchParams.get('error_description') || '');
              }
              return handoffUrl.toString();
            }
          }
        }
        
        return url;
      },
      async session({ session, token }) {
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
      },
      async jwt({ token, account, user, trigger, session }) {
        if (trigger === 'update') {
          const next = (session as { authToken?: string } | undefined)?.authToken;
          if (next) token.authToken = next;
          return token;
        }
        if (account) {
          if (account.provider === 'azure-ad' || account.provider === 'google') {
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
          token.email = token.email;
        }
        if (user) {
          token.role = (user as any).role || token.role;
          token.user_type = (user as any).user_type || token.user_type;
          token.csrfToken = (user as any).csrfToken || token.csrfToken;
          token.authToken = (user as any).authToken || token.authToken;
          token.userId = user.id || token.userId;
        }
        return token;
      },
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
    // Trust the auth host for OAuth callbacks
    trustHost: true,
  };
}

const handler = (...args: [any, any]) => NextAuth(getAuthOptions())(...args);

export { handler as GET, handler as POST };
