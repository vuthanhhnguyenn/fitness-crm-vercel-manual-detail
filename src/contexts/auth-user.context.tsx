'use client';

import { type ReactNode, createContext, useCallback, useContext, useMemo } from 'react';

import { ROLE_PERMISSIONS } from '@/constants/permission.constants';

import { useCurrentUser } from '@/hooks/use-current-user';

import { AuthUser, Permission, UserRole } from '@/types/permission.type';

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------
interface AuthUserContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /** Returns true if the user's role is among the provided list */
  hasRole: (roles: readonly UserRole[]) => boolean;
  /** Returns true if the user holds the permission */
  hasPermission: (permission: Permission) => boolean;
}

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider — feeds itself from useCurrentUser (React Query)
// ---------------------------------------------------------------------------

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  const hasRole = useCallback(
    (roles: readonly UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    },
    [user],
  );

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;

      return ROLE_PERMISSIONS[user.role].includes(permission);
    },
    [user],
  );

  const value = useMemo<AuthUserContextValue>(
    () => ({
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            position: user.position,
          }
        : null,
      isLoading,
      hasRole,
      hasPermission,
    }),
    [user, isLoading, hasRole, hasPermission],
  );

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuthUser(): AuthUserContextValue {
  const ctx = useContext(AuthUserContext);
  if (!ctx) {
    throw new Error('useAuthUser must be used inside <AuthUserProvider>');
  }
  return ctx;
}
