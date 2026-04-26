import type { ReactNode } from 'react';
import { useCan } from '@shared/auth/useCan';
import type { Permission } from '@shared/auth/permissions';
import { ForbiddenPage } from '@pages/ForbiddenPage';

/**
 * Route-level guard. Wrap a page element with this to deny rendering
 * to users who lack the required permission(s).
 */
export function RequirePermission({ perm, children }: { perm: Permission | Permission[]; children: ReactNode }) {
  const ok = useCan(perm);
  if (!ok) return <ForbiddenPage />;
  return <>{children}</>;
}
