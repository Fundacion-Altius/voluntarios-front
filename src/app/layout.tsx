import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { Familjen_Grotesk, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth/AuthProvider";

// Klaruk brand fonts: Familjen Grotesk for headings, Schibsted Grotesk for body text.
const heading = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});
const body = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Klaruk",
  description: "Klaruk: voluntariado, socios, actividades y subvenciones en un solo sitio.",
  icons: {
    icon: [
      { url: "/klaruk/favicon.svg", type: "image/svg+xml" },
      { url: "/klaruk/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/klaruk/apple-touch-icon.png",
  },
};

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={`${heading.variable} ${body.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
