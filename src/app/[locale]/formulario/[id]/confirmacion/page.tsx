'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function FormConfirmacionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('formularios');

  const status = (searchParams.get('status') || 'completado') as 'completado' | 'rechazado';
  const motivo = searchParams.get('motivo');
  const recomendacion = searchParams.get('recomendacion');
  const formId = params.id as string;

  const rejected = status === 'rechazado';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6 text-center">
          {rejected ? (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">{t('envioRechazado')}</h2>
              <p className="text-muted-foreground">{t('envioRechazadoDesc')}</p>
              {motivo && !/^[0-9a-f-]{36}$/i.test(motivo) && (
                <Alert variant="destructive" className="text-left">
                  <AlertTitle>{t('motivoRechazo')}</AlertTitle>
                  <AlertDescription>{motivo}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold">{t('envioCompletado')}</h2>
              <p className="text-muted-foreground">{t('graciasEnvioDesc')}</p>
            </>
          )}

          {recomendacion && (
            <Alert className="text-left">
              <Info className="h-4 w-4" />
              <AlertTitle>{t('recomendacion')}</AlertTitle>
              <AlertDescription>{recomendacion}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center gap-2 pt-2">
            <Button asChild variant="outline">
              <Link href={`/formulario/${formId}`}>{t('volverInicio')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
