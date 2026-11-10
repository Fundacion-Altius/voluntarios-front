"use client";
import { type CSSProperties, useEffect } from "react";
import { useAuthGate } from "@/app/auth/useAuthGate";
import { ChatbotDrawer } from "@/components/chat/ChatbotDrawer";
import { NotificationBell } from "@/components/NotificationBell";
import { RoutePendingProvider } from "@/components/navigation/RoutePending";
import BottomNav from "@/components/portal/BottomNav";
import Sidebar from "@/components/portal/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLgUp } from "@/hooks/useLgUp";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout, status } = useAuthGate();
  const router = useRouter();
  const pathname = usePathname();
  const lgUp = useLgUp();
  const isStaffAllowedPortal =
    (pathname?.includes("/portal/sala") ?? false) ||
    (pathname?.includes("/portal/mensajes") ?? false) ||
    (pathname?.includes("/portal/ayuda-alimentaria") ?? false) ||
    (pathname?.includes("/portal/comandero") ?? false);
  const isProjectBoard = /\/portal\/proyectos\/(?!nuevo$|mensajes)[^/]+$/.test(pathname || "");

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;
    if (isAuthenticated && (user as any)?.role !== "general" && !isStaffAllowedPortal) {
      router.push("/admin/dashboard");
    }
  }, [status, isAuthenticated, user, router, isStaffAllowedPortal]);

  if (isLoading || status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-background p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const profile = user as { name?: string; email?: string } | null;

  const chromeStyle = {
    "--admin-bottom-nav-h": lgUp ? "0px" : "3.5rem",
    "--admin-fixed-bar-h": "0px",
    "--admin-fab-h": "3rem",
    "--admin-fab-gap": "0.75rem",
    "--admin-fab-bottom": "calc(var(--admin-bottom-nav-h) + var(--admin-fixed-bar-h) + var(--admin-fab-gap))",
    "--admin-content-pb": "calc(var(--admin-fab-bottom) + var(--admin-fab-h) + var(--admin-fab-gap))",
  } as CSSProperties;

  return (
    <RoutePendingProvider>
      <SidebarProvider className="min-h-screen bg-background" style={chromeStyle}>
        {lgUp && <Sidebar userName={profile?.name} userEmail={profile?.email} onLogout={() => logout()} />}
        <SidebarInset className="min-w-0">
          <main
            className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-6"
            style={{ paddingBottom: "var(--admin-content-pb)" }}
          >
            <div className={isProjectBoard ? "mx-auto min-w-0 max-w-[90rem]" : "mx-auto max-w-5xl"}>{children}</div>
          </main>
        </SidebarInset>
        {!lgUp && <BottomNav userName={profile?.name} userEmail={profile?.email} onLogout={() => logout()} />}
        <div className="fixed right-4 top-4 z-50">
          <NotificationBell />
        </div>
        <ChatbotDrawer />
      </SidebarProvider>
    </RoutePendingProvider>
  );
}
