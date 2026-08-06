'use client';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getCSRFToken } from '@/app/lib/csrf';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

const INTERESES_OPTS = [
  'Acompañamiento', 'Apoyo escolar', 'Cocina', 'Jardinería', 'Mantenimiento',
  'Ofimática', 'Recogida de alimentos', 'Ropero', 'Transporte', 'Otros',
];

export default function HazteVoluntarioPage() {
  const router = useRouter();
  const t = useTranslations('hazteVoluntario');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', residencia: '', fecha_nacimiento: '',
    periodicidad: '', horario_texto: '',
  });
  const [diasDisponibles, setDiasDisponibles] = useState<string[]>([]);
  const [intereses, setIntereses] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const DIAS = [t('lunes'), t('martes'), t('miercoles'), t('jueves'), t('viernes'), t('sabado'), t('domingo')];
  const PERIODOS = [t('semanal'), t('quincenal'), t('mensual'), t('puntual')];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const toggleDia = (dia: string) => {
    setDiasDisponibles((prev) => prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]);
  };

  const toggleInteres = (i: string) => {
    setIntereses((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = t('requerido');
    if (!form.email.trim()) e.email = t('requerido');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('emailInvalido');
    if (!form.telefono.trim()) e.telefono = t('requerido');
    else if (!/^[+]?[\d\s()-]{7,}$/.test(form.telefono)) e.telefono = t('telefonoInvalido');
    if (!form.residencia.trim()) e.residencia = t('requerido');
    if (!form.fecha_nacimiento) e.fecha_nacimiento = t('requerido');
    if (!form.periodicidad) e.periodicidad = t('seleccionaOpcion');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      const csrfToken = getCSRFToken();
      const res = await fetch(`${API_URL}/api/candidates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
        body: JSON.stringify({
          ...form,
          dias_disponibles: diasDisponibles,
          actividades_interes: intereses,
          disponibilidad_horaria: [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errorEnvio'));
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>{t('solicitudRecibida')}</CardTitle>
            <CardDescription>
              {t('solicitudRecibidaDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')}>{t('volverInicio')}</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 py-12">
      <Image alt="logo" src="/logo.png" width={400} height={100} className="logo" priority />
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t('titulo')}</CardTitle>
          <CardDescription>
            {t('descripcion')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>{t('nombre')} *</Label>
                <Input name="nombre" value={form.nombre} onChange={handleChange} placeholder={t('placeholderNombre')} />
                {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
              </div>
              <div>
                <Label>Email *</Label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@ejemplo.com" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label>{t('telefono')} *</Label>
                <Input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+34 600 000 000" />
                {errors.telefono && <p className="mt-1 text-xs text-destructive">{errors.telefono}</p>}
              </div>
              <div>
                <Label>{t('residencia')} *</Label>
                <Input name="residencia" value={form.residencia} onChange={handleChange} placeholder={t('placeholderResidencia')} />
                {errors.residencia && <p className="mt-1 text-xs text-destructive">{errors.residencia}</p>}
              </div>
              <div>
                <Label>{t('fechaNacimiento')} *</Label>
                <Input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
                {errors.fecha_nacimiento && <p className="mt-1 text-xs text-destructive">{errors.fecha_nacimiento}</p>}
              </div>
              <div>
                <Label>{t('periodicidad')} *</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PERIODOS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setForm({ ...form, periodicidad: p }); setErrors({ ...errors, periodicidad: '' }); }}
                      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${form.periodicidad === p ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {errors.periodicidad && <p className="mt-1 text-xs text-destructive">{errors.periodicidad}</p>}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('diasDisponibles')}</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDia(d)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${diasDisponibles.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('disponibilidadHoraria')}</Label>
              <Input name="horario_texto" value={form.horario_texto} onChange={handleChange} placeholder={t('placeholderHorario')} />
            </div>

            <div>
              <Label className="mb-2 block">{t('areasInteres')}</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {INTERESES_OPTS.map((i) => (
                  <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={intereses.includes(i)} onCheckedChange={() => toggleInteres(i)} />
                    {i}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('enviando') : t('enviarSolicitud')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
