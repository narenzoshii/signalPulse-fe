import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public isLoggedIn = signal<boolean>(false);
  public authorities = signal<string[]>([]);
  public currentUser = signal<CurrentUser['user'] | null>(null);

  /** Resolves true once the initial /me probe has settled, so guards can wait. */
  public ready = signal<boolean>(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl =
    (environment.ADMIN_ENDPOINT.endsWith('/')
      ? environment.ADMIN_ENDPOINT
      : environment.ADMIN_ENDPOINT + '/') + 'api/v1';

  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private idleListenersAttached = false;
  private readonly idleEvents = ['mousedown', 'mousemove', 'keypress', 'touchstart'] as const;

  /**
   * Probe the server for the current session (via httpOnly cookie). Called
   * once at bootstrap from APP_INITIALIZER.
   */
  bootstrap(): Observable<boolean> {
    return this.http
      .get<CurrentUser>(`${this.baseUrl}/auth/me`, { withCredentials: true })
      .pipe(
        timeout({ first: 5000 }),
        tap(res => this.applySession(res)),
        map(() => true),
        catchError(() => {
          this.clearSession();
          return of(false);
        }),
        tap(() => this.ready.set(true))
      );
  }

  hasPermission(perm: string): boolean {
    return this.authorities().includes('ROLE_SUPERADMIN') || this.authorities().includes(perm);
  }

  hasRole(role: string): boolean {
    return this.authorities().includes(`ROLE_${role}`);
  }

  login(credentials: { username: string; password: string }): Observable<CurrentUser> {
    return this.http
      .post<CurrentUser>(`${this.baseUrl}/auth/login`, credentials, { withCredentials: true })
      .pipe(
        tap(res => {
          this.applySession(res);
          this.router.navigate(['/dashboard']);
        }),
        catchError(() => throwError(() => new Error('Invalid credentials')))
      );
  }

  logout(redirectToLogin = true): void {
    // Fire-and-forget; cookie is cleared regardless on server side.
    this.http
      .post<void>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearSession();
        if (redirectToLogin) this.router.navigate(['/login']);
      });
  }

  private applySession(res: CurrentUser): void {
    this.currentUser.set(res?.user ?? null);
    this.authorities.set(res?.authorities ?? []);
    this.isLoggedIn.set(!!res?.user);
    if (res?.user) this.startIdleTimer();
  }

  private clearSession(): void {
    this.currentUser.set(null);
    this.authorities.set([]);
    this.isLoggedIn.set(false);
    this.stopIdleTimer();
  }

  private startIdleTimer(): void {
    this.stopIdleTimer();
    const timeoutMins = 30;
    const resetTimer = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.logout(), timeoutMins * 60 * 1000);
    };

    if (!this.idleListenersAttached) {
      this.idleEvents.forEach(evt => window.addEventListener(evt, resetTimer, true));
      this.idleListenersAttached = true;
    }
    resetTimer();
  }

  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }
}
