'use client';

import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import Cookies from 'universal-cookie';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStoresResponse } from '@/lib/api/types.gen';

import { CookieNames } from '@/types/global.enum';
import { UserRole } from '@/types/permission.type';

import { useAuthUser } from './auth-user.context';

export const ALL_STORES = 'all';

type StoreItem = GetCrmStoresResponse['stores'][number];

/**
 * Mirrors the server-side `getAllowedStoreIds()` unrestricted-role list (src/app/api/_lib/auth.ts).
 * Manager is intentionally excluded: B-01 権限マトリクスでは Manager は所轄店舗のみ (managed stores only),
 * so a Manager must not be able to pick "全店舗" / out-of-territory stores from the header switcher —
 * they browse their managed-store list instead (see `restrictedStores`).
 */
function canRoleSelectAllStores(role: UserRole | undefined): boolean {
  return role === UserRole.System || role === UserRole.Headquarter;
}

interface CurrentStoreContextValue {
  /** "all" (全店舗/本部) or a specific store id. */
  currentStoreId: string;
  setCurrentStoreId: (id: string) => void;
  /** Populated for roles restricted to specific stores: a single linked store (Staff/Trainer/Observer) or the Manager's managed stores. */
  restrictedStores: StoreItem[];
  canSelectAllStores: boolean;
  isLoading: boolean;
}

const CurrentStoreContext = createContext<CurrentStoreContextValue | null>(null);

interface CurrentStoreProviderProps {
  children: ReactNode;
  /** Cookie value read server-side (see `(private)/layout.tsx`), so the first client render already matches the server-rendered HTML instead of re-deriving it from `document.cookie`. */
  initialStoreId?: string;
}

/**
 * App-wide "which store am I working in" selector, backed by the header store switcher.
 * Persists to a cookie so the selection survives reloads/navigation without living in the URL.
 */
export function CurrentStoreProvider({ children, initialStoreId }: CurrentStoreProviderProps) {
  const { user, isLoading: userLoading } = useAuthUser();
  const canSelectAll = canRoleSelectAllStores(user?.role as UserRole | undefined);

  // Restricted roles are scoped to a bounded store set — one linked store
  // (Staff/Trainer/Observer) or a Manager's managed stores (see getAllowedStoreIds
  // in src/app/api/_lib/auth.ts) — so the first page covers everything. Unrestricted
  // roles browse the full catalog via search instead (see StoreSelector), so we
  // don't fetch it eagerly here.
  const { data, isLoading: storesLoading } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 20, sort_by: 'name', sort_order: 'asc' } }),
    enabled: !canSelectAll && !userLoading,
  });
  const restrictedStores = useMemo(() => data?.stores ?? [], [data]);

  const [storedStoreId, setStoredStoreId] = useState<string>(initialStoreId ?? ALL_STORES);

  const setCurrentStoreId = useCallback((id: string) => {
    setStoredStoreId(id);
    new Cookies().set(CookieNames.CurrentStore, id, { path: '/' });
  }, []);

  // Roles restricted to a single store can't select "all" — derive their effective store
  // from the accessible list during render instead of syncing it back via an effect.
  const currentStoreId = useMemo(() => {
    if (canSelectAll || restrictedStores.length === 0) return storedStoreId;
    const stillValid = restrictedStores.some((store) => store.id === storedStoreId);
    return stillValid && storedStoreId !== ALL_STORES ? storedStoreId : restrictedStores[0]!.id;
  }, [canSelectAll, restrictedStores, storedStoreId]);

  const value = useMemo<CurrentStoreContextValue>(
    () => ({
      currentStoreId,
      setCurrentStoreId,
      restrictedStores,
      canSelectAllStores: canSelectAll,
      // Gate on storesLoading only for roles that actually depend on it to resolve
      // currentStoreId (see the derivation above). Roles that canSelectAll share this
      // query's cache key with StoreSelector's own store-list fetch (same page/limit/sort,
      // no search) — without this guard, opening the header dropdown would transiently
      // flip this to `true` for them too and flash every consumer's loading state.
      isLoading: userLoading || (!canSelectAll && storesLoading),
    }),
    [currentStoreId, setCurrentStoreId, restrictedStores, canSelectAll, userLoading, storesLoading],
  );

  return <CurrentStoreContext.Provider value={value}>{children}</CurrentStoreContext.Provider>;
}

export function useCurrentStore() {
  const ctx = useContext(CurrentStoreContext);
  if (!ctx) throw new Error('useCurrentStore must be used within <CurrentStoreProvider>');
  return ctx;
}
