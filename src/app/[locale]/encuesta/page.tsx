import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ClientRatingForm from "./ClientRatingForm";
import { Question } from "@/app/types";

interface PageProps {}

export const dynamic = 'force-dynamic';

export default async function RatingPage({}: PageProps) {
  let questions: Question[] = [];
  let error: string = "";

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_URL}/api/questions`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      const t = await getTranslations('encuesta');
      error = t('errorCargarPreguntas');
    } else {
      questions = await res.json();
    }
  } catch (err) {
    console.error('Fetch error:', err);
    const t = await getTranslations('encuesta');
    error = t('errorCargarPreguntas');
  }

  const imagePrefix = (process.env.NEXT_PUBLIC_IMAGE_PREFIX || '/').replace(/\/$/, '');

  return (
    <main>
      <div className="flex w-full justify-center mb-10 md:justify-start md:max-w-[630px] md:mx-auto">
        <Link href="/">
          <div className="flex">
            <Image
              alt="logo"
              src={`${imagePrefix}/logo.png`}
              width={400}
              height={100}
              className="logo"
              priority
            />
          </div>
        </Link>
      </div>
      <div className="contract-wizard">
        <ClientRatingForm questions={questions} error={error} />
      </div>
    </main>
  );
}
