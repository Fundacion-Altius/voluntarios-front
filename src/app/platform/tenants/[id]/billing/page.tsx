"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { platformApi } from "@/lib/platform/api";

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

interface BillingState {
  prices: Price[];
  loading: boolean;
  error: string | null;
  loadingCheckout: boolean;
  loadingPortal: boolean;
}

export default function TenantBillingPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const [state, setState] = useState<BillingState>({
    prices: [],
    loading: true,
    error: null,
    loadingCheckout: false,
    loadingPortal: false,
  });

  useEffect(() => {
    loadPrices();
  }, [tenantId]);

  async function loadPrices() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { prices } = await platformApi.getPrices();
      setState((s) => ({ ...s, prices, loading: false }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }

  async function handleCheckout(priceId: string) {
    setState((s) => ({ ...s, loadingCheckout: true, error: null }));
    try {
      const { url } = await platformApi.createCheckoutSession(tenantId, priceId);
      if (url) window.location.href = url;
    } catch (e: any) {
      setState((s) => ({ ...s, loadingCheckout: false, error: e.message }));
    }
  }

  async function handlePortal() {
    setState((s) => ({ ...s, loadingPortal: true, error: null }));
    try {
      const { url } = await platformApi.createPortalSession(tenantId);
      if (url) window.location.href = url;
    } catch (e: any) {
      setState((s) => ({ ...s, loadingPortal: false, error: e.message }));
    }
  }

  const starterPlan = state.prices.find((p) => !p.product.name?.toLowerCase().includes("early"));
  const earlyBirdPlan = state.prices.find((p) => p.product.name?.toLowerCase().includes("early"));

  if (state.loading) return <div>Cargando precios...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Facturación</h1>

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Piloto gratuito */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold">Piloto gratuito</h3>
          <p className="text-3xl font-bold mt-2">€0<span className="text-sm font-normal">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">
            Acceso completo durante el periodo de piloto.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Sin coste · No requiere tarjeta
          </p>
        </div>

        {/* Early Bird */}
        {earlyBirdPlan && (
          <div className="border border-blue-300 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Early Bird
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Oct–Dic 2026
              </span>
            </h3>
            <p className="text-3xl font-bold mt-2">
              €{((earlyBirdPlan.unit_amount ?? 0) / 100).toFixed(0)}
              <span className="text-sm font-normal">/mes</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Precio especial para los primeros colaboradores.
            </p>
            <button
              disabled={state.loadingCheckout}
              onClick={() => handleCheckout(earlyBirdPlan.id)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {state.loadingCheckout ? "Procesando..." : "Suscribirse con Early Bird"}
            </button>
          </div>
        )}

        {/* Starter */}
        {starterPlan && (
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold">Starter</h3>
            <p className="text-3xl font-bold mt-2">
              €{((starterPlan.unit_amount ?? 0) / 100).toFixed(0)}
              <span className="text-sm font-normal">/mes</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Acceso completo a todas las funcionalidades.
            </p>
            <button
              disabled={state.loadingCheckout}
              onClick={() => handleCheckout(starterPlan.id)}
              className="mt-4 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 disabled:opacity-50"
            >
              {state.loadingCheckout ? "Procesando..." : "Suscribirse"}
            </button>
          </div>
        )}
      </div>

      {/* Customer Portal */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-2">Gestionar método de pago</h2>
        <p className="text-sm text-gray-500 mb-4">
          Actualiza tu tarjeta o consulta tus facturas desde el portal de Stripe.
        </p>
        <button
          disabled={state.loadingPortal}
          onClick={handlePortal}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {state.loadingPortal ? "Abriendo..." : "Abrir portal de facturación"}
        </button>
      </div>
    </div>
  );
}
