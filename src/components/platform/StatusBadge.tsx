"use client";

import { Badge } from "@/components/ui/badge";
import type { TenantStatus } from "@/types/platform";

const variantByStatus: Record<TenantStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "outline",
  archived: "secondary",
};

export function StatusBadge({ status }: { status: TenantStatus }) {
  return <Badge variant={variantByStatus[status]}>{status}</Badge>;
}
