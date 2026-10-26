import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type DocsLocale = 'es' | 'ca' | 'en';

export type SidebarPage = {
  slug: string;
  title: Record<DocsLocale, string>;
};

export type SidebarSection = {
  id: string;
  title: Record<DocsLocale, string>;
  pages: SidebarPage[];
};

export type Sidebar = { sections: SidebarSection[] };

const DOCS_ROOT = path.join(process.cwd(), 'content', 'docs');

export function loadSidebar(): Sidebar {
  const raw = fs.readFileSync(path.join(DOCS_ROOT, 'sidebar.json'), 'utf8');
  return JSON.parse(raw) as Sidebar;
}

export function listDocParams(): Array<{ locale: DocsLocale; slug: string[] }> {
  const sidebar = loadSidebar();
  const locales: DocsLocale[] = ['es', 'ca', 'en'];
  const params: Array<{ locale: DocsLocale; slug: string[] }> = [];
  for (const locale of locales) {
    params.push({ locale, slug: [] });
    for (const section of sidebar.sections) {
      for (const page of section.pages) {
        params.push({ locale, slug: [section.id, page.slug] });
      }
    }
  }
  return params;
}

export function assertLocaleParity(): string[] {
  const sidebar = loadSidebar();
  const locales: DocsLocale[] = ['es', 'ca', 'en'];
  const missing: string[] = [];
  for (const section of sidebar.sections) {
    for (const page of section.pages) {
      for (const locale of locales) {
        const file = path.join(DOCS_ROOT, locale, section.id, `${page.slug}.md`);
        if (!fs.existsSync(file)) missing.push(`${locale}/${section.id}/${page.slug}.md`);
      }
    }
  }
  return missing;
}

export function loadDocPage(locale: DocsLocale, slug: string[]): {
  title: string;
  estado: string;
  content: string;
} | null {
  const filePath =
    slug.length === 0
      ? path.join(DOCS_ROOT, locale, 'index.md')
      : path.join(DOCS_ROOT, locale, ...slug.slice(0, -1), `${slug[slug.length - 1]}.md`);
  if (!fs.existsSync(filePath)) return null;
  const parsed = matter(fs.readFileSync(filePath, 'utf8'));
  return {
    title: String(parsed.data.title ?? (slug.join('/') || 'Docs')),
    estado: String(parsed.data.estado ?? 'disponible'),
    content: parsed.content,
  };
}
