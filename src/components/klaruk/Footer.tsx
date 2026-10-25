import { getTranslations } from "next-intl/server";
import Logo from "./Logo";
export default async function Footer() {
  const t = await getTranslations("klaruk.chrome");
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <div>
          <Logo height={26} />
          <p className="brandline"><strong>{t("footerTitle")}</strong><br />{t("footerLine")}</p>
        </div>
        <p className="by sig">{t("byPrefix")} <a href="https://shiftcitizen.com">ShiftCitizen</a></p>
      </div>
    </footer>
  );
}
