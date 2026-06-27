import 'next-auth';

declare module 'next-auth' {
  interface Session {
    csrfToken?: string;
  }

  interface User {
    role?: string;
  }
}
