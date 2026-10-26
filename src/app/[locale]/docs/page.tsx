import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { DocsShell } from '@/components/docs/DocsShell';
import { fetchDocsSubscriptionActive } from '@/lib/docs/fetchSubscription';
import { type DocsLocale, loadDocPage, loadSidebar } from '@/lib/docs/loadDocs';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function DocsHomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as DocsLocale;
  const gate = await fetchDocsSubscriptionActive();
  if (!gate.authenticated) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/docs`);
  }
  if (!gate.active) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold">Documentación</h1>
        <p className="mt-2 text-muted-foreground">
          Necesitas una suscripción activa o una prueba vigente para ver la ayuda.
        </p>
        <Link href="/planes" className="mt-4 inline-block underline">
          Ver planes
        </Link>
      </div>
    );
  }

  const page = loadDocPage(locale, []);
  const sidebar = loadSidebar();
  return (
    <DocsShell locale={locale} sidebar={sidebar} currentSlug={[]}>
      <ReactMarkdown>{page?.content ?? ''}</ReactMarkdown>
    </DocsShell>
  );
}
