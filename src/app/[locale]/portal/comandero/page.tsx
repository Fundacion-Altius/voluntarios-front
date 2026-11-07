'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WaiterView } from '@/modules/comandero/components/WaiterView';
import { StationView } from '@/modules/comandero/components/StationView';

export default function ComanderoPortalPage() {
  const [sessionId, setSessionId] = useState('');
  const active = sessionId.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Comandero</h1>
        <p className="text-sm text-muted-foreground">
          Practica el servicio: toma comandas, enruta a cocina y barra, sirve y cierra la cuenta.
          Introduce el identificador de sesión que te dé el docente.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="session-id">Sesión de práctica</Label>
          <Input
            id="session-id"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Identificador de sesión"
            className="sm:max-w-md"
          />
        </CardContent>
      </Card>

      {active && (
        <Tabs defaultValue="camarero">
          <TabsList>
            <TabsTrigger value="camarero">Camarero</TabsTrigger>
            <TabsTrigger value="cocina">Cocina</TabsTrigger>
            <TabsTrigger value="barra">Barra</TabsTrigger>
          </TabsList>
          <TabsContent value="camarero" className="mt-4">
            <WaiterView sessionId={active} />
          </TabsContent>
          <TabsContent value="cocina" className="mt-4">
            <StationView sessionId={active} station="cocina" />
          </TabsContent>
          <TabsContent value="barra" className="mt-4">
            <StationView sessionId={active} station="barra" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
