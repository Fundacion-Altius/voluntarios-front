import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import esMessages from '../../messages/es.json';

export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es" messages={esMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(ui: ReactNode) {
  const { render } = require('@testing-library/react');
  return render(<TestProviders>{ui}</TestProviders>);
}
