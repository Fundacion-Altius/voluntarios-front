'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchAgentAudit,
  fetchAgentIdentity,
  type AgentAuditEvent,
  type AgentIdentity,
} from '../useAgentIdentities';

export default function AgentIdentityCardPage() {
  const t = useTranslations('admin.agentIdentities');
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const token = (session as { authToken?: string } | null)?.authToken;
  const [identity, setIdentity] = useState<AgentIdentity | null>(null);
  const [audit, setAudit] = useState<AgentAuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id || !isAuthenticated) return;
    Promise.all([fetchAgentIdentity(params.id, token), fetchAgentAudit(params.id, token)])
      .then(([card, rows]) => {
        setIdentity(card);
        setAudit(rows);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id, isAuthenticated, token]);

  if (authLoading) return <Skeleton className="h-8 w-48" />;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-4 p-6">
      <Link href="/admin/agent-identities" className="text-sm underline">
        {t('back')}
      </Link>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!identity ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{identity.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{t('id')}: </span>
                <span className="font-mono">{identity.id}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t('credential')}: </span>
                <Badge variant={identity.credentialStatus === 'active' ? 'default' : 'destructive'}>
                  {identity.credentialStatus}
                </Badge>
              </p>
              <div>
                <p className="mb-1 text-muted-foreground">{t('scopes')}</p>
                {identity.scopes.length === 0 && <p>{t('noScopes')}</p>}
                <ul className="list-disc pl-5">
                  {identity.scopes.map((scope) => (
                    <li key={scope.id}>
                      {scope.scopeType}: {scope.scopeValue}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('recentAudit')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('when')}</TableHead>
                    <TableHead>{t('tool')}</TableHead>
                    <TableHead>{t('result')}</TableHead>
                    <TableHead>HITL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.tool}</TableCell>
                      <TableCell>{row.result}</TableCell>
                      <TableCell>{row.hitl}</TableCell>
                    </TableRow>
                  ))}
                  {audit.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>{t('noAudit')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
