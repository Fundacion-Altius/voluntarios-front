"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { platformApi } from "@/lib/platform/api";
import type { PlatformTenant } from "@/types/platform";
import { usePlatformAuthContext } from "../../../auth/PlatformAuthProvider";

interface Price {
  id: string;
  unit_amount: number | null;
  currency: string;
  interval: string | null;
  product: {
    id: string;
    name: string | null;
    description: string | null;
  };
}

export default function TenantBillingPage({ params }: { params: { tenantId: string } }) {
  const { isAuthenticated, loading } = usePlatformAuthContext();
  const router = useRouter();
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/platform/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      platformApi.getTenant(params.tenantId),
      platformApi.getPrices(),
    ])
      .then(([t, p]) => {
        setTenant(t.tenant);
        setPrices(p.prices);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load billing data"))
      .finally(() => setLoadingData(false));
  }, [isAuthenticated, params.tenantId]);

  async function handleCheckout(priceId: string) {
    try {
      const session = await platformApi.createCheckoutSession(params.tenantId, priceId);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create checkout session");
    }
  }

  async function handlePortal() {
    try {
      const session = await platformApi.createPortalSession(params.tenantId);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create portal session");
    }
  }

  if (loading || loadingData) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing for {tenant?.name}</h1>
          <p className="text-sm text-muted-foreground">Slug: {tenant?.slug}</p>
        </div>
        {tenant?.stripe_customer_id && (
          <Button variant="outline" onClick={handlePortal}>
            Manage Billing
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prices.map((price) => (
          <Card key={price.id}>
            <CardHeader>
              <CardTitle>{price.product.name ?? "Plan"}</CardTitle>
              <CardDescription>{price.product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {price.unit_amount ? `€${(price.unit_amount / 100).toFixed(2)}` : "—"}
                <span className="text-sm font-normal text-muted-foreground">
                  /{price.interval}
                </span>
              </p>
              <Button className="mt-4 w-full" onClick={() => handleCheckout(price.id)}>
                Subscribe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
