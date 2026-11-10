"use client";

import { type CSSProperties, createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type AdminChromeValue = {
  setFixedBarHeight: (height: string) => void;
};

const AdminChromeContext = createContext<AdminChromeValue | null>(null);

/** Lets a page reserve vertical space for a fixed action bar so the Alti FAB sits above it. */
export function useAdminFixedBar(heightCss: string) {
  const ctx = useContext(AdminChromeContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setFixedBarHeight(heightCss);
    return () => ctx.setFixedBarHeight("0px");
  }, [ctx, heightCss]);
}

export function AdminChrome({
  hasBottomNav,
  children,
}: {
  hasBottomNav: boolean;
  children: (style: CSSProperties) => ReactNode;
}) {
  const [fixedBarH, setFixedBarHeight] = useState("0px");
  const value = useMemo(() => ({ setFixedBarHeight }), []);
  const style = {
    "--admin-bottom-nav-h": hasBottomNav ? "3.5rem" : "0px",
    "--admin-fixed-bar-h": fixedBarH,
    "--admin-fab-h": "3rem",
    "--admin-fab-gap": "0.75rem",
    "--admin-fab-bottom": "calc(var(--admin-bottom-nav-h) + var(--admin-fixed-bar-h) + var(--admin-fab-gap))",
    "--admin-content-pb": "calc(var(--admin-fab-bottom) + var(--admin-fab-h) + var(--admin-fab-gap))",
  } as CSSProperties;

  return <AdminChromeContext.Provider value={value}>{children(style)}</AdminChromeContext.Provider>;
}
