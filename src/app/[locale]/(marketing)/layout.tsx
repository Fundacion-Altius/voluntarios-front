import type { Metadata } from "next";
import Header from "@/components/klaruk/Header";
import Footer from "@/components/klaruk/Footer";
import "./klaruk.css";

export const metadata: Metadata = {
  title: "Klaruk · El sistema operativo de tu entidad",
  description: "Socios, voluntariado, actividades y subvenciones en un solo sitio. Por ShiftCitizen.",
  icons: { icon: "/klaruk/favicon.svg", apple: "/klaruk/apple-touch-icon.png" },
};

// Klaruk marketing pages (Spanish only for now). Styles are scoped under .klaruk
// so admin, portal and the contract wizard are unaffected. Light and dark themes follow the app ThemeProvider (html.dark). Fonts come from the root layout.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="klaruk" lang="es">
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}
