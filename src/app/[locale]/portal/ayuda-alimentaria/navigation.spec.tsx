import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import esMessages from '../../../../../messages/es.json';
import caMessages from '../../../../../messages/ca.json';
import enMessages from '../../../../../messages/en.json';
import Sidebar from '@/components/portal/Sidebar';
import BottomNav from '@/components/portal/BottomNav';

// The nav components read the current path from the Next.js router, which
// does not exist outside an app router context.
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={typeof href === 'string' ? href : String(href)} {...props}>
      {children}
    </a>
  ),
  usePathname: () => '/portal',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  redirect: jest.fn(),
  getPathname: (href: string) => href,
}));

// The language switcher also needs the app router.
jest.mock('@/components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => null,
}));

const LOCALES = [
  { locale: 'es', messages: esMessages, label: 'Ayuda alimentaria' },
  { locale: 'ca', messages: caMessages, label: 'Ajuda alimentària' },
  { locale: 'en', messages: enMessages, label: 'Food aid' },
];

describe('Food aid navigation', () => {
  beforeAll(() => {
    // jsdom does not implement pointer capture; Radix needs it to open menus.
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = () => undefined;
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => undefined;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  it.each(LOCALES)(
    'links to the food-aid page from the portal sidebar in $locale',
    ({ locale, messages, label }) => {
      render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Sidebar onLogout={() => undefined} />
        </NextIntlClientProvider>
      );

      const link = screen.getByRole('link', { name: label });
      expect(link.getAttribute('href')).toContain('/portal/ayuda-alimentaria');
    }
  );

  it.each(LOCALES)(
    'links to the food-aid page from the mobile bottom nav in $locale',
    ({ locale, messages, label }) => {
      render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BottomNav onLogout={() => undefined} />
        </NextIntlClientProvider>
      );

      const link = screen.getByRole('link', { name: label });
      expect(link.getAttribute('href')).toContain('/portal/ayuda-alimentaria');
    }
  );
});
