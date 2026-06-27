import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

  if (isAuthEndpoint) {
    return next(req);
  }

  const token = tokenStorage.getToken();
  if (!token) {
    return next(req);
  }

  if (tokenStorage.isTokenExpired(5)) {
    authService.logout();
    return throwError(() => new Error('Session expired'));
  }

  const authorized = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authorized).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
