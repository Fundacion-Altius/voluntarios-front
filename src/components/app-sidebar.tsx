"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
// import { useRef } from "react";
import {
  // AudioWaveform,
  // BookOpen,
  // Bot,
  ChevronUp,
  // Command,
  // Frame,
  // GalleryVerticalEnd,
  // Map,
  // PieChart,
  // Settings2,
  // SquareTerminal,
  Store,
  Users,
  User2,
  Warehouse,
  HandHeart,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects";
// import { NavUser } from "@/components/nav-user";
// import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
// import { useContainerWidth } from "@/lib/hooks";
// import { title } from "process";

// Sample data.
const data = {
  navMain: [
    {
      title: "Voluntarios",
      url: "/dashboard/voluntarios",
      icon: HandHeart,
      isActive: true,
      items: [
        {
          title: "Contratos",
          url: "/dashboard/voluntarios",
        },

        {
          title: "Encuestas",
          url: "/dashboard/voluntarios/encuestas",
        },
        {
          title: "Actividades",
          url: "/dashboard/voluntarios/actividades",
        },
        {
          title: "Cuerpo Europeo de Solidaridad",
          url: "/dashboard/voluntarios/ces",
        },
      ],
    },
    /* {
      title: "Warehouse",
      url: "#",
      icon: Warehouse,
      isActive: true,
      items: [
        {
          title: "Products",
          url: "/products",
        },
        {
          title: "Categories",
          url: "/categories"
        },
        {
          title: "Product Images",
          url: "/product-images"
        }
      ],
    },{ 
    title: "Storefront",
    url: "#",
    icon: Store,
    items: [
      {
        title: "Start Pickup",
        url: "/storefront/pickup",
        },
        
      ],
    },
    { 
      title: "Users",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Staff",
          url: "/users/staff",
          },
          {
            title: "Volunteers",
            url: "#",
          },
          {
            title: "Beneficiaries",
            url: "#",
          },
        ],
      }, */
    /* {
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
    */
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Create a ref for the SidebarHeader container.
  // const headerRef = useRef<HTMLDivElement>(null);
  // const headerWidth = useContainerWidth(headerRef);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader ref={headerRef}> */}
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2"
        >
          <Image src="/logo.png" alt="logo" width={300} height={100} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> Usuario
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
