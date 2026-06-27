import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
import { firstValueFrom } from 'rxjs';

export const eventManagerGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  if (!tokenStorage.getToken() || tokenStorage.isTokenExpired()) {
    tokenStorage.clearToken();
    router.navigate(['/login']);
    return false;
  }

  const role = authService.getCurrentUser()?.role;
  if (role === 'Admin' || role === 'Organizer') {
    return true;
  }

  try {
    const profile = await firstValueFrom(authService.loadProfile());
    if (profile.role === 'Admin' || profile.role === 'Organizer') {
      return true;
    }
  } catch {
    authService.logout();
    return false;
  }

  router.navigate(['/upcoming-events']);
  return false;
};
