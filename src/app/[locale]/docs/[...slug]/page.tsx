import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { DocsShell } from '@/components/docs/DocsShell';
import { Link } from '@/i18n/navigation';
import { fetchDocsSubscriptionActive } from '@/lib/docs/fetchSubscription';
import {
  type DocsLocale,
  listDocParams,
  loadDocPage,
  loadSidebar,
} from '@/lib/docs/loadDocs';

type Props = { params: Promise<{ locale: string; slug: string[] }> };

export function generateStaticParams() {
  return listDocParams()
    .filter((p) => p.slug.length > 0)
    .map((p) => ({ locale: p.locale, slug: p.slug }));
}

export default async function DocsSlugPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as DocsLocale;
  const gate = await fetchDocsSubscriptionActive();
  if (!gate.authenticated) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/docs/${slug.join('/')}`);
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

  const page = loadDocPage(locale, slug);
  if (!page) notFound();
  const sidebar = loadSidebar();
  return (
    <DocsShell locale={locale} sidebar={sidebar} currentSlug={slug}>
      {page.estado === 'proximamente' ? (
        <p className="mb-4 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Próximamente
        </p>
      ) : null}
      <h1>{page.title}</h1>
      <ReactMarkdown>{page.content}</ReactMarkdown>
    </DocsShell>
  );
}
