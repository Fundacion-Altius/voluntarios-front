import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import { oauthFromEnv } from '@/lib/oauthFromEnv';

export default function LoginPage() {
  const oauth = oauthFromEnv();
  return (
    <Suspense>
      <LoginForm hasGoogle={false} hasAzure={oauth.azure} />
    </Suspense>
  );
}
