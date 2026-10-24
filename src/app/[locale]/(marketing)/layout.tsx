import type { Metadata } from "next";
import { Familjen_Grotesk, Schibsted_Grotesk } from "next/font/google";
import Header from "@/components/klaruk/Header";
import Footer from "@/components/klaruk/Footer";
import "./klaruk.css";

const heading = Familjen_Grotesk({ subsets: ["latin"], weight: ["700"], variable: "--font-heading", display: "swap" });
const body = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Klaruk · El sistema operativo de tu entidad",
  description: "Socios, voluntariado, actividades y subvenciones en un solo sitio. Por ShiftCitizen.",
  icons: { icon: "/klaruk/favicon.svg", apple: "/klaruk/apple-touch-icon.png" },
};

// Klaruk marketing pages (Spanish only for now). Styles are scoped under .klaruk
// so admin, portal and the contract wizard are unaffected. Light theme is forced.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`klaruk ${heading.variable} ${body.variable}`} lang="es">
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}
