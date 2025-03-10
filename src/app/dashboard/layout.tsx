"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { CustomTrigger } from "@/components/custom-sidebar-trigger";
import { SidebarProvider } from "@/components/ui/sidebar";
/* 
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react"; */

import Image from "next/image";

export default function Layout({ children }: { children: React.ReactNode }) {
  /* const { isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null; */
  return (
    <SidebarProvider>
      <AppSidebar />

      <main>
        <div className="sm:hidden flex justify-end w-full items-center p-2">
          <div className="w-full flex justify-center">
            <Image width={280} height={120} src="/logo.png" alt="logo" />
          </div>
          <div className="mr-4">
            <CustomTrigger />
          </div>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
