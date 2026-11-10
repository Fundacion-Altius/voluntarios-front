import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'ca', 'en'],
  defaultLocale: 'es',
});
