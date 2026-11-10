import Link from 'next/link';
import type { DocsLocale, Sidebar } from '@/lib/docs/loadDocs';

type Props = {
  locale: DocsLocale;
  sidebar: Sidebar;
  currentSlug: string[];
  children: React.ReactNode;
};

export function DocsShell({ locale, sidebar, currentSlug, children }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <Link href={`/${locale}/docs`} className="mb-4 block text-lg font-semibold text-foreground">
          Docs
        </Link>
        <nav className="space-y-4 text-sm">
          {sidebar.sections.map((section) => (
            <div key={section.id}>
              <div className="mb-1 font-medium text-muted-foreground">{section.title[locale]}</div>
              <ul className="space-y-1">
                {section.pages.map((page) => {
                  const href = `/${locale}/docs/${section.id}/${page.slug}`;
                  const active =
                    currentSlug[0] === section.id && currentSlug[1] === page.slug;
                  return (
                    <li key={page.slug}>
                      <Link
                        href={href}
                        className={
                          active
                            ? 'font-medium text-foreground underline'
                            : 'text-muted-foreground hover:text-foreground'
                        }
                      >
                        {page.title[locale]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="prose prose-neutral dark:prose-invert min-w-0 flex-1 max-w-3xl">
        {children}
      </main>
    </div>
  );
}
