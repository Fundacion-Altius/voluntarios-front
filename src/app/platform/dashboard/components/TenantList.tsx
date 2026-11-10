"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/platform/StatusBadge";
import type { TenantSummary } from "@/types/platform";

export function TenantList({ tenants }: { tenants: TenantSummary[] }) {
  return (
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
          {tenants.map((t) => (
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
  );
}
