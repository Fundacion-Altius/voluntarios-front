'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardsProps {
  totalContracts: number;
  activeVolunteers: number;
  surveyCompletionRate: number;
}

export function MetricCards({ totalContracts, activeVolunteers, surveyCompletionRate }: MetricCardsProps) {
  const ratePercent = Math.round(surveyCompletionRate * 100);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Contratos Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalContracts}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Voluntarios Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{activeVolunteers}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tasa de Respuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{ratePercent}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
