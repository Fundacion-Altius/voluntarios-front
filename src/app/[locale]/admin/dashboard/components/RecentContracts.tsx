'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Contract {
  id: string;
  nombre: string;
  empresa: string | null;
  fecha: string;
}

interface Props {
  contracts: Contract[];
}

export function RecentContracts({ contracts }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Contratos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin contratos recientes</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.empresa || 'Voluntario independiente'}
                  </p>
                </div>
                <Badge variant="outline">
                  {new Date(c.fecha).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
