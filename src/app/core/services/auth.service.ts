import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isLoggedIn = signal<boolean>(localStorage.getItem('auth_token') !== null);
  public authorities = signal<string[]>(JSON.parse(localStorage.getItem('user_authorities') || '[]'));
  public currentUser = signal<any>(JSON.parse(localStorage.getItem('current_user') || 'null'));
  private http = inject(HttpClient);

  private idleTimer: any;
  private baseUrl = (environment.ADMIN_ENDPOINT.endsWith('/') ? environment.ADMIN_ENDPOINT : environment.ADMIN_ENDPOINT + '/') + 'api/v1';

  constructor(private router: Router) {
    if (this.isLoggedIn()) {
      this.startIdleTimer();
    }
  }

  hasPermission(perm: string): boolean {
    return this.authorities().includes('ROLE_SUPERADMIN') || this.authorities().includes(perm);
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials).pipe(
      map(res => {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user_authorities', JSON.stringify(res.authorities || []));
          localStorage.setItem('current_user', JSON.stringify(res.user || null));
          this.isLoggedIn.set(true);
          this.authorities.set(res.authorities || []);
          this.currentUser.set(res.user || null);
          this.startIdleTimer();
          this.router.navigate(['/dashboard']);
        }

        return res;
      }),
      catchError(err => throwError(() => new Error('Invalid credentials')))
    );
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_authorities');
    localStorage.removeItem('current_user');
    this.isLoggedIn.set(false);
    this.authorities.set([]);
    this.currentUser.set(null);
    this.stopIdleTimer();
    this.router.navigate(['/login']);
  }


  private startIdleTimer() {
    this.stopIdleTimer();
    // Default 30 mins if not found, usually fetched from config but simplified here for flow
    const timeoutMins = 30; 
    
    const resetTimer = () => {
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.logout(), timeoutMins * 60 * 1000);
    };

    ['mousedown', 'mousemove', 'keypress', 'touchstart'].forEach(evt => 
      window.addEventListener(evt, resetTimer, true)
    );
    resetTimer();
  }

  private stopIdleTimer() {
    clearTimeout(this.idleTimer);
  }
}

