import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Custom404() {
  const t = useTranslations('notFound');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-2">{t('titulo')}</p>
        <p className="text-sm text-muted-foreground mb-6">{t('descripcion')}</p>
        <Link href="/" className="text-primary hover:underline">
          {t('volverInicio')}
        </Link>
      </div>
    </main>
  );
}
