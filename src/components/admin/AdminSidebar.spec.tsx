import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SidebarProvider } from '@/components/ui/sidebar';
import esMessages from '../../../messages/es.json';
import AdminSidebar from './AdminSidebar';

let mockPath = '/admin/contratos';
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: any) => <a href={String(href)} {...props}>{children}</a>,
  usePathname: () => mockPath,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/components/LanguageSwitcher', () => ({ __esModule: true, default: () => null }));
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const renderSidebar = (props: Partial<React.ComponentProps<typeof AdminSidebar>> = {}) =>
  render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <SidebarProvider>
        <AdminSidebar onLogout={() => undefined} {...props} />
      </SidebarProvider>
    </NextIntlClientProvider>
  );

describe('AdminSidebar (grouped)', () => {
  it('shows the header and the always-open Inicio group', () => {
    mockPath = '/admin/contratos';
    renderSidebar();
    expect(screen.getByText('Panel de gestión')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('link', { name: 'Analítica' })).toBeInTheDocument();
  });

  it('auto-opens the group of the current route and marks the item', () => {
    mockPath = '/admin/contratos/123';
    renderSidebar();
    expect(screen.getByRole('button', { name: 'Voluntariado' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Contratos y acuerdos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Financiación' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps only one collapsible group open', () => {
    mockPath = '/admin/contratos';
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Financiación' }));
    expect(screen.getByRole('button', { name: 'Financiación' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Voluntariado' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'Subvenciones' })).toHaveAttribute('href', '/admin/grants');
    // Inicio stays visible
    expect(screen.getByRole('link', { name: 'Panel' })).toBeInTheDocument();
  });

  it('opens a requested group first (mobile Voluntariado tab)', () => {
    mockPath = '/admin/dashboard';
    renderSidebar({ initialGroup: 'voluntariado' });
    expect(screen.getByRole('link', { name: 'Personas voluntarias' })).toHaveAttribute('href', '/admin/usuarios');
  });

  it('opens no collapsible group on a pinned route (Panel)', () => {
    mockPath = '/admin/dashboard';
    renderSidebar();
    for (const name of ['Voluntariado', 'Actividades', 'Personas atendidas', 'Comunicación', 'Financiación', 'Gobierno e impacto', 'Datos y ajustes']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('collapses via the shadcn SidebarRail without a toggle next to the logo', () => {
    mockPath = '/admin/dashboard';
    const { container } = renderSidebar();
    expect(screen.getByText('Panel de gestión')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="sidebar"][data-state="expanded"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }));
    expect(container.querySelector('[data-slot="sidebar"][data-state="collapsed"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Panel' })).toBeInTheDocument();
  });
});
