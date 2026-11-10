"use client";

import { useCallback, useEffect, useState } from "react";
import { itemsPath, toysPublicFetch } from "./toysFetch";

/**
 * Public toy handout API for /juguetes — no session required.
 * Admin mutations stay in useToys().
 */
export function useToysPublic() {
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);

  const fetchStatus = useCallback(async () => {
    const r = await toysPublicFetch("/status");
    if (r.success) setStatus(r.data as { enabled: boolean });
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    listItems: (age?: number | string) => toysPublicFetch(itemsPath(age)),
    lookupHousehold: (code: string) => toysPublicFetch(`/households/${encodeURIComponent(code.trim())}`),
    createCart: (household_id: string) =>
      toysPublicFetch("/carts", { method: "POST", body: JSON.stringify({ household_id }) }),
    addLine: (cartId: string, toy_id: string, qty: number) =>
      toysPublicFetch(`/carts/${cartId}/lines`, { method: "POST", body: JSON.stringify({ toy_id, qty }) }),
    removeLine: (cartId: string, toy_id: string) =>
      toysPublicFetch(`/carts/${cartId}/lines/${toy_id}`, { method: "DELETE" }),
    checkout: (cartId: string) => toysPublicFetch(`/carts/${cartId}/checkout`, { method: "POST" }),
    listSlots: () => toysPublicFetch("/slots"),
    bookSlot: (slotId: string, household_id: string) =>
      toysPublicFetch(`/slots/${slotId}/book`, { method: "POST", body: JSON.stringify({ household_id }) }),
  };
}
