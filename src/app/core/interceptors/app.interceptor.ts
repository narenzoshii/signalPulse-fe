import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const XSRF_COOKIE = 'XSRF-TOKEN';
const XSRF_HEADER = 'X-XSRF-TOKEN';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  const target = name + '=';
  for (const segment of document.cookie.split(';')) {
    const trimmed = segment.trimStart();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.substring(target.length));
    }
  }
  return null;
}

export const appInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // All API calls go cross-origin to the BE — credentials must be explicit.
  let modified = req.clone({ withCredentials: true });

  // Attach CSRF header on state-changing methods. Angular's built-in XSRF
  // interceptor only fires for same-origin requests, so we do it manually.
  if (MUTATING_METHODS.has(req.method.toUpperCase())) {
    const token = readCookie(XSRF_COOKIE);
    if (token) {
      modified = modified.clone({ setHeaders: { [XSRF_HEADER]: token } });
    }
  }

  return next(modified).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't loop: don't logout on the /auth/me probe itself
      const isAuthProbe = req.url.endsWith('/auth/me') || req.url.endsWith('/auth/login');
      if (!isAuthProbe && (error.status === 401 || error.status === 403)) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
