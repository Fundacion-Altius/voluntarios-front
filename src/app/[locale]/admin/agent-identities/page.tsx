'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentIdentities } from './useAgentIdentities';

export default function AgentIdentitiesPage() {
  const t = useTranslations('admin.agentIdentities');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { identities, isLoading, error } = useAgentIdentities();

  if (authLoading) return <Skeleton className="h-8 w-48" />;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3">{t('name')}</th>
                <th className="p-3">{t('id')}</th>
                <th className="p-3">{t('scopes')}</th>
                <th className="p-3">{t('credential')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {identities.map((identity) => (
                <tr key={identity.id} className="border-b">
                  <td className="p-3 font-medium">{identity.name}</td>
                  <td className="p-3 font-mono text-xs">{identity.id}</td>
                  <td className="p-3">{identity.scopes.length}</td>
                  <td className="p-3">
                    <Badge variant={identity.credentialStatus === 'active' ? 'default' : 'destructive'}>
                      {identity.credentialStatus}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/agent-identities/${identity.id}`}>
                      <Button variant="outline" size="sm">
                        {t('viewCard')}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {identities.length === 0 && (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={5}>
                    {t('empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
