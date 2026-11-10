'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  foodAidApi,
  joinLotsWithItems,
  type FoodAidApiErrorCode,
  type FoodAidApiErrorKind,
} from '@/lib/api/foodAidApi';
import type {
  FoodAidItem,
  FoodAidItemInput,
  FoodAidLotStatus,
  FoodAidLotWithItem,
} from '@/types/foodAid';

export interface UseFoodAidLotsResult {
  lots: FoodAidLotWithItem[];
  items: FoodAidItem[];
  loading: boolean;
  error: string | null;
  errorKind: FoodAidApiErrorKind | null;
  errorCode: FoodAidApiErrorCode | null;
  refresh: () => Promise<void>;
  createItem: (input: FoodAidItemInput) => Promise<FoodAidItem>;
  createLot: (
    itemId: string,
    input: {
      quantity: number;
      expiry_date: string | null;
      location: string;
      status: FoodAidLotStatus;
    }
  ) => Promise<void>;
  updateLotStatus: (lotId: string, status: FoodAidLotStatus) => Promise<void>;
  deleteLot: (lotId: string) => Promise<void>;
  expiringLots: FoodAidLotWithItem[];
  notifyExpiring: () => Promise<{ notified: boolean; count: number }>;
}

/**
 * Error thrown by the mutations, carrying the backend's own message so the
 * page can show it, plus the machine-readable code for translated fallbacks.
 */
export class FoodAidMutationError extends Error {
  code: FoodAidApiErrorCode;
  constructor(message: string, code: FoodAidApiErrorCode) {
    super(message);
    this.name = 'FoodAidMutationError';
    this.code = code;
  }
}

/**
 * Loads the tenant's food-aid lots and items and exposes the mutations the
 * portal needs. The tenant is resolved by the backend from the request host,
 * so no tenant id is ever sent from here.
 */
export function useFoodAidLots(): UseFoodAidLotsResult {
  const [lots, setLots] = useState<FoodAidLotWithItem[]>([]);
  const [expiringLots, setExpiringLots] = useState<FoodAidLotWithItem[]>([]);
  const [items, setItems] = useState<FoodAidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<FoodAidApiErrorKind | null>(null);
  const [errorCode, setErrorCode] = useState<FoodAidApiErrorCode | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setErrorCode(null);
    try {
      const itemsResult = await foodAidApi.listItems();
      if (!itemsResult.success) {
        setError(itemsResult.error || null);
        setErrorKind(itemsResult.kind);
        setErrorCode(itemsResult.code);
        setLots([]);
        setItems([]);
        return;
      }

      const lotsResult = await foodAidApi.listLots();
      if (!lotsResult.success) {
        setError(lotsResult.error || null);
        setErrorKind(lotsResult.kind);
        setErrorCode(lotsResult.code);
        setLots([]);
        setItems(itemsResult.data);
        return;
      }

      setItems(itemsResult.data);
      const joined = joinLotsWithItems(lotsResult.data, itemsResult.data);
      setLots(joined);

      const expiringResult = await foodAidApi.listExpiringLots();
      if (expiringResult.success) {
        setExpiringLots(joinLotsWithItems(expiringResult.data, itemsResult.data));
      } else {
        setExpiringLots([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createItem = useCallback(async (input: FoodAidItemInput) => {
    const result = await foodAidApi.createItem(input);
    if (!result.success) {
      throw new FoodAidMutationError(result.error, result.code);
    }
    return result.data;
  }, []);

  const createLot = useCallback(
    async (
      itemId: string,
      input: {
        quantity: number;
        expiry_date: string | null;
        location: string;
        status: FoodAidLotStatus;
      }
    ) => {
      const result = await foodAidApi.createLot({ ...input, item_id: itemId });
      if (!result.success) {
        throw new FoodAidMutationError(result.error, result.code);
      }
      await refresh();
    },
    [refresh]
  );

  const updateLotStatus = useCallback(
    async (lotId: string, status: FoodAidLotStatus) => {
      const result = await foodAidApi.updateLot(lotId, { status });
      if (!result.success) {
        throw new FoodAidMutationError(result.error, result.code);
      }
      await refresh();
    },
    [refresh]
  );

  const deleteLot = useCallback(
    async (lotId: string) => {
      const result = await foodAidApi.deleteLot(lotId);
      if (!result.success) {
        throw new FoodAidMutationError(result.error, result.code);
      }
      await refresh();
    },
    [refresh]
  );

  const notifyExpiring = useCallback(async () => {
    const result = await foodAidApi.notifyExpiringLots();
    if (!result.success) {
      throw new FoodAidMutationError(result.error, result.code);
    }
    return result.data;
  }, []);

  return useMemo(
    () => ({
      lots,
      expiringLots,
      items,
      loading,
      error,
      errorKind,
      errorCode,
      refresh,
      createItem,
      createLot,
      updateLotStatus,
      deleteLot,
      notifyExpiring,
    }),
    [
      lots,
      expiringLots,
      items,
      loading,
      error,
      errorKind,
      errorCode,
      refresh,
      createItem,
      createLot,
      updateLotStatus,
      deleteLot,
      notifyExpiring,
    ]
  );
}
