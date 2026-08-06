import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const imagePrefix = (process.env.NEXT_PUBLIC_IMAGE_PREFIX || '/').replace(/\/$/, '');

export default async function ConfirmationPage() {
  const t = await getTranslations('encuesta');
  const tc = await getTranslations('common');

  return (
    <main>
      <div className="w-full flex md:max-w-[640px] mx-auto mb-2">
        <Link href="/">
          <Image
            alt="logo"
            src={`${imagePrefix}/logo.png`}
            width={400}
            height={100}
            className="logo"
            priority
          />
        </Link>
      </div>
      <div className="contract-wizard">
        <h2>{t('titulo')}</h2>
        <h3 className="mb-3">{t('gracias')}</h3>
        <p>{t('graciasDescripcion')}</p>
        <div className="flex w-full mt-10">
          <Button className="flex w-full" asChild>
            <Link href="/">
              <Home />
              {tc('volverInicio')}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
