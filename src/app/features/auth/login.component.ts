import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="login-container">
      <div class="login-card glass slide-up">
        <div class="brand mb-6 text-center">
          <div class="logo-icon mx-auto mb-4">LA</div>
          <h2>Lending Agent</h2>
          <p class="muted">Admin Portal Access</p>
        </div>
        
        <form (ngSubmit)="login()">
          @if (error) {
            <div class="alert alert-danger mb-4" style="background: rgba(239, 68, 68, 0.1); color: var(--danger-color); padding: 10px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3);">
              {{ error }}
            </div>
          }
          <div class="form-group mb-4">
            <label>Username</label>
            <input type="text" class="input" [(ngModel)]="username" name="username" placeholder="admin" required>
          </div>
          
          <div class="form-group mb-6">
            <label>Password</label>
            <input type="password" class="input" [(ngModel)]="password" name="password" placeholder="••••••••" required>
          </div>
          
          <button type="submit" class="btn-primary w-full">
            Secure Login <lucide-icon name="arrow-right-circle" size="18"></lucide-icon>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color);
      background-image: radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 3rem 2rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }
    .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    
    .logo-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-color), #c084fc);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 20px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }
    .brand h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .muted { color: var(--text-muted); font-size: 0.9rem; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService) {}

  login() {
    this.error = '';
    if (this.username && this.password) {
      this.authService.login({username: this.username, password: this.password}).subscribe({
        error: (err) => this.error = 'Invalid credentials'
      });
    }
  }
}
