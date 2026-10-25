import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import Nav from "./Nav";
import { TRIAL_URL } from "./links";
import ThemeSwitch from "./ThemeSwitch";
import LangSwitch from "./LangSwitch";

export default async function Header() {
  const t = await getTranslations("klaruk.chrome");
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href="/" className="brand" aria-label={t("homeLabel")}>
          <Logo />
          <span className="sig">{t("by")}</span>
        </Link>
        <Nav label={t("navLabel")} items={[{ href: "/", label: t("navHome") }, { href: "/planes", label: t("navPlans") }]} />
        <div className="header-tools">
          <LangSwitch label={t("langLabel")} />
          <ThemeSwitch labels={{ dark: t("themeDark"), light: t("themeLight") }} />
        </div>
        <a className="btn btn-primary header-cta" href={TRIAL_URL}>{t("headerCta")}</a>
      </div>
    </header>
  );
}
