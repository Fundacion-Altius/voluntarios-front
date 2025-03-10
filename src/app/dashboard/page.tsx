"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartComponent } from "@/components/charts";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="w-[600px] h-[600px]">
          <ChartComponent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
