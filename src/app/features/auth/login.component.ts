import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="login-container">
      <div class="login-card glass slide-up">
        <div class="brand mb-6 text-center">
          <img src="assets/icons/logo.png" class="logo-img mx-auto mb-4" alt="Logo">
          <h2>Signal Pulse</h2>
          <p class="muted">Admin Portal Access</p>
        </div>

        <form (ngSubmit)="login()">
          @if (error()) {
            <div class="alert alert-danger mb-4">{{ error() }}</div>
          }
          <div class="form-group mb-4">
            <label>Username</label>
            <input type="text" class="input" [(ngModel)]="username" name="username" placeholder="admin" required autocomplete="username">
          </div>
          <div class="form-group mb-6">
            <label>Password</label>
            <input type="password" class="input" [(ngModel)]="password" name="password" placeholder="••••••••" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn-primary w-full" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Secure Login' }}
            <lucide-icon name="arrow-right-circle" size="18"></lucide-icon>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-color); background-image: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.1) 0%, transparent 50%); }
    .login-card { width: 100%; max-width: 400px; padding: 3rem 2rem; border: 1px solid var(--border-strong); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); }
    .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    .logo-img { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; }
    .brand h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .muted { color: var(--text-muted); font-size: 0.9rem; }
    .alert-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); padding: 10px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  login(): void {
    if (!this.username || !this.password) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.login({ username: this.username, password: this.password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.error.set('Invalid credentials');
          this.loading.set(false);
        },
      });
  }
}
