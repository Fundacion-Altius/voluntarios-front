import 'next-auth';

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
