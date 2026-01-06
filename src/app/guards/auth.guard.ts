import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Verify token is still valid
  const isValid = await authService.verifyToken();
  if (!isValid) {
    router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if user has admin or wali kelas role
  if (!authService.canAccessAdmin()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
