import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

/**
 * Build a guard that requires the user to hold AT LEAST ONE of the given authorities.
 * Authorities include both privileges (e.g. 'OP_MANAGE_USERS') and roles (e.g. 'ROLE_SUPERADMIN').
 * SUPERADMIN always passes (granted by `AuthService.hasPermission`).
 */
export function hasAuthorityGuard(...required: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }
    if (required.length === 0) return true;
    const ok = required.some(p => auth.hasPermission(p));
    if (!ok) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };
}
