"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformApi } from "@/lib/platform/api";
import type { PlatformTenant, TenantStatus } from "@/types/platform";
import { usePlatformAuthContext } from "../auth/PlatformAuthProvider";

export default function TenantListPage() {
  const { isAuthenticated, loading } = usePlatformAuthContext();
  const router = useRouter();
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | TenantStatus>("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/platform/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    platformApi
      .listTenants()
      .then((r) => setTenants(r.tenants))
      .catch(() => setTenants([]));
  }, [isAuthenticated]);

  const filtered = useMemo(
    () =>
      tenants.filter(
        (t) =>
          (!status || t.status === status) &&
          (!query || t.name.toLowerCase().includes(query.toLowerCase()) || t.slug.includes(query)),
      ),
    [tenants, query, status],
  );

  if (loading || !isAuthenticated) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Button asChild>
          <Link href="/platform/tenants/new">New tenant</Link>
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search by name or slug"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | TenantStatus)}
          className="rounded-md border px-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/platform/tenants/${t.id}`} className="underline">
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{t.slug}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-2">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
