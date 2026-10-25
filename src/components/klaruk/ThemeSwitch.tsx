"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-provider";

// Light/dark switch for the marketing header. Uses the app's ThemeProvider (same
// localStorage key), so the choice carries over to the app and back.
export default function ThemeSwitch({ labels = { dark: "Activar tema oscuro", light: "Activar tema claro" } }: { labels?: { dark: string; light: string } }) {
  const { theme, setTheme } = useTheme();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, [theme]);
  const next = dark ? "light" : "dark";
  return (
    <button type="button" className="theme-switch" aria-label={dark ? labels.light : labels.dark} title={dark ? labels.light : labels.dark}
      onClick={() => { setTheme(next); setDark(!dark); }}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </svg>
    </button>
  );
}
