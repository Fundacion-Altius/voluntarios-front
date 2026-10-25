import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/klaruk/Header";
import Footer from "@/components/klaruk/Footer";
import "./klaruk.css";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "klaruk.meta" });
  return {
    title: t("title"),
    description: t("description"),
    icons: { icon: "/klaruk/favicon.svg", apple: "/klaruk/apple-touch-icon.png" },
  };
}

// Klaruk marketing pages. Copy lives in messages/*.json under "klaruk" (es is the
// source; ca and en are drafts pending review by Adela/Carlos). /planes is still
// Spanish-only. Styles are scoped under .klaruk; light and dark follow the app
// ThemeProvider (html.dark). Fonts come from the root layout.
export default async function MarketingLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations("klaruk.chrome");
  return (
    <div className="klaruk" lang={params.locale}>
      <a className="skip" href="#contenido">{t("skip")}</a>
      <Header />
      <main id="contenido" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}
