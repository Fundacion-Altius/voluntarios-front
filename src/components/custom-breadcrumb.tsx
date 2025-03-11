// components/Breadcrumb.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const CustomBreadcrumb = () => {
  const pathname = usePathname();
  const pathArray = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
      <Link href="/" className="text-primary hover:underline">
        Home
      </Link>
      {pathArray.map((segment, index) => {
        const route = `/${pathArray.slice(0, index + 1).join("/")}`;
        const isLast = index === pathArray.length - 1;

        return (
          <span key={route} className="flex items-center">
            <ChevronLeft />
            {isLast ? (
              <span className="text-muted-foreground">{segment}</span>
            ) : (
              <Link href={route} className="text-primary hover:underline">
                {segment}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default CustomBreadcrumb;
