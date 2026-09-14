"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlatformAuthContext } from "@/app/platform/auth/PlatformAuthProvider";
import { Button } from "@/components/ui/button";

export function PlatformNavbar() {
  const { user, logout } = usePlatformAuthContext();
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.push("/platform/login");
  }

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/platform/dashboard" className="font-semibold">
          Klaruk Platform
        </Link>
        <Link href="/platform/dashboard" className="text-sm text-muted-foreground">
          Dashboard
        </Link>
        <Link href="/platform/tenants" className="text-sm text-muted-foreground">
          Tenants
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/platform/login" className="text-sm">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
