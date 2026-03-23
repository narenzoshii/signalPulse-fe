import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const appInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('auth_token');

  // Clone request to add auth token
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // status 0 = backend unreachable / network down
      // 401 = unauthorized (token expired / missing)
      // 403 = forbidden
      if (error.status === 0 || error.status === 401 || error.status === 403) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
