import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ContractProvider } from '../context';
import { AuthProvider } from '../auth/AuthProvider';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';
import { ThemeProvider } from '@/lib/theme-provider';
import { QueryProvider } from '../QueryProvider';
import SetLang from '@/components/SetLang';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SetLang />
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegister />
            <PushNotificationSetup />
            <ContractProvider>{children}</ContractProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
