"use client";

import { createContext, type ReactNode, useContext } from "react";
import { usePlatformAuth } from "./usePlatformAuth";

type AuthContext = ReturnType<typeof usePlatformAuth>;

const Ctx = createContext<AuthContext | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const auth = usePlatformAuth();
  return <Ctx.Provider value={auth}>{children}</Ctx.Provider>;
}

export function usePlatformAuthContext(): AuthContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatformAuthContext must be used within PlatformAuthProvider");
  return ctx;
}
