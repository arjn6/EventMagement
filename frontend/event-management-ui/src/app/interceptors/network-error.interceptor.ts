import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { ApiStatusService } from '../services/api-status.service';

export const networkErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiStatus = inject(ApiStatusService);

  return next(req).pipe(
    tap(() => apiStatus.markUp()),
    catchError((error) => {
      if (error?.status === 0) {
        apiStatus.markDown();
      } else {
        apiStatus.markUp();
      }
      return throwError(() => error);
    })
  );
};
