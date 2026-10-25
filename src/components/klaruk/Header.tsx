import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import Nav from "./Nav";
import { TRIAL_URL } from "./links";
import ThemeSwitch from "./ThemeSwitch";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href="/" className="brand" aria-label="Klaruk, inicio">
          <Logo />
          <span className="sig">por ShiftCitizen</span>
        </Link>
        <Nav />
        <ThemeSwitch />
        <a className="btn btn-primary header-cta" href={TRIAL_URL}>Prueba 15 días gratis</a>
      </div>
    </header>
  );
}
