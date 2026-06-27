import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    csrfToken?: string;
    authToken?: string;
  }
  interface User {
    role?: string;
    authToken?: string;
  }
}

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: 'openid profile email offline_access',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        name: { label: 'Name' },
        role: { label: 'Role' },
        csrfToken: { label: 'CSRF Token' },
        authToken: { label: 'Auth Token' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        if (credentials?.name && credentials?.role && credentials?.authToken) {
          return {
            id: credentials.email as string,
            email: credentials.email as string,
            name: credentials.name as string,
            role: credentials.role as string,
            csrfToken: credentials.csrfToken as string,
            authToken: credentials.authToken as string,
          };
        }

        if (!credentials?.password) return null;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          csrfToken: data.csrfToken,
          authToken: data.authToken,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email || '';
        session.user.name = token.name || '';
        (session.user as any).role = token.role as string;
        session.csrfToken = token.csrfToken as string;
        session.authToken = token.authToken as string;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account) {
        if (account.provider === 'azure-ad') {
          token.authToken = account.id_token as string;
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${account.id_token}` },
            });
            if (res.ok) {
              const profile = await res.json();
              token.role = profile.role;
            }
          } catch {}
        }
        token.email = token.email;
      }
      if (user) {
        token.role = (user as any).role || token.role;
        token.csrfToken = (user as any).csrfToken || token.csrfToken;
        token.authToken = (user as any).authToken || token.authToken;
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
  },
});

export { handler as GET, handler as POST };
