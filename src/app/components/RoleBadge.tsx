import { Badge } from '@/components/ui/badge';

interface RoleBadgeProps {
  role: string;
  count: number;
}

const roleVariants: Record<string, 'destructive' | 'default' | 'secondary'> = {
  admin: 'destructive',
  nave: 'default',
  general: 'secondary',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  nave: 'Nave',
  general: 'General',
};

export function RoleBadge({ role, count }: RoleBadgeProps) {
  const variant = roleVariants[role] || 'secondary';
  const label = roleLabels[role] || role;

  return (
    <div className="mb-4 flex items-center gap-3">
      <Badge variant={variant}>{label}</Badge>
      <span className="text-sm text-muted-foreground">
        {count} contrato{count !== 1 ? 's' : ''} visible{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
