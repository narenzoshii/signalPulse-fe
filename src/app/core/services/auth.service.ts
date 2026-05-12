import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, SessionInfo } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public isLoggedIn = signal<boolean>(false);
  public authorities = signal<string[]>([]);
  public currentUser = signal<CurrentUser['user'] | null>(null);
  public sessionInfo = signal<SessionInfo | null>(null);

  /** Resolves true once the initial /me probe has settled, so guards can wait. */
  public ready = signal<boolean>(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private baseUrl =
    (environment.ADMIN_ENDPOINT.endsWith('/')
      ? environment.ADMIN_ENDPOINT
      : environment.ADMIN_ENDPOINT + '/') + 'api/v1';

  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly idleEvents = ['mousedown', 'mousemove', 'keypress', 'touchstart'] as const;
  private idleListener?: () => void;
  private visibilityListener?: () => void;
  private lastVisibilityProbe = 0;

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
    this.http
      .post<void>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearSession();
        if (redirectToLogin) this.router.navigate(['/login']);
      });
  }

  /** Cheap probe — server returns 401 if cookie expired; interceptor will clear state. */
  refreshSession(): void {
    this.http.get<CurrentUser>(`${this.baseUrl}/auth/me`, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res) this.applySession(res);
        else if (this.isLoggedIn()) this.clearSession();
      });
  }

  private applySession(res: CurrentUser): void {
    this.currentUser.set(res?.user ?? null);
    this.authorities.set(res?.authorities ?? []);
    this.sessionInfo.set(res?.session ?? null);
    this.isLoggedIn.set(!!res?.user);
    if (res?.user) {
      this.startIdleTimer();
      this.attachVisibilityListener();
    }
  }

  private clearSession(): void {
    this.currentUser.set(null);
    this.authorities.set([]);
    this.sessionInfo.set(null);
    this.isLoggedIn.set(false);
    this.stopIdleTimer();
    this.detachVisibilityListener();
  }

  private startIdleTimer(): void {
    this.stopIdleTimer();
    const timeoutMins = this.sessionInfo()?.idleTimeoutMins ?? 30;
    const resetTimer = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.logout(), timeoutMins * 60 * 1000);
    };

    if (!this.idleListener) {
      this.idleListener = resetTimer;
      this.idleEvents.forEach(evt => window.addEventListener(evt, this.idleListener!, true));
    }
    resetTimer();
  }

  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    if (this.idleListener) {
      this.idleEvents.forEach(evt => window.removeEventListener(evt, this.idleListener!, true));
      this.idleListener = undefined;
    }
  }

  private attachVisibilityListener(): void {
    if (this.visibilityListener) return;
    this.visibilityListener = () => {
      if (document.visibilityState !== 'visible') return;
      // Debounce: don't probe more than once every 10s.
      const now = Date.now();
      if (now - this.lastVisibilityProbe < 10_000) return;
      this.lastVisibilityProbe = now;
      this.refreshSession();
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  private detachVisibilityListener(): void {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = undefined;
    }
  }
}
