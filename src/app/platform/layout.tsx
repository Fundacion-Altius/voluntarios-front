import type { ReactNode } from "react";
import { PlatformNavbar } from "@/components/platform/PlatformNavbar";
import { PlatformAuthProvider } from "./auth/PlatformAuthProvider";

export const metadata = {
  title: "Klaruk Platform",
};

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <PlatformAuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <PlatformNavbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </PlatformAuthProvider>
  );
}
