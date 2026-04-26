import type { ReactNode } from 'react';
import { useAuth } from './store';
import { hasPermission, type Permission } from './permissions';

/**
 * Returns true if the current user has the given permission.
 * Pass an array to require ALL of them.
 */
export function useCan(perm: Permission | Permission[]): boolean {
  const role = useAuth((s) => s.user?.role);
  const list = Array.isArray(perm) ? perm : [perm];
  return list.every((p) => hasPermission(role, p));
}

/**
 * Render `children` only if the current user has `perm`.
 * Optional `fallback` is rendered instead when access is denied.
 *
 * <Can perm="property.create">
 *   <button>Add property</button>
 * </Can>
 */
export function Can({
  perm,
  fallback = null,
  children,
}: {
  perm: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const ok = useCan(perm);
  return <>{ok ? children : fallback}</>;
}
