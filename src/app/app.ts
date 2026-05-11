import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, CommonModule],
  template: `
    @if (authService.isLoggedIn()) {
      <div class="app-layout">
        <aside class="sidebar">
          <div class="brand">
            <img src="assets/icons/logo.png" class="logo-img" alt="Logo">
            <div class="brand-text">
              <h2>Signal Pulse</h2>
              <span>Admin Portal</span>
            </div>
          </div>

          <nav class="nav-menu">
            <p class="nav-label">Overview</p>
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <lucide-icon name="layout-dashboard" size="18"></lucide-icon> Dashboard
            </a>
            <a routerLink="/scheduler" routerLinkActive="active" class="nav-item">
              <lucide-icon name="calendar" size="18"></lucide-icon> Job Scheduler
            </a>

            <p class="nav-label mt-6">Configuration</p>
            <a routerLink="/config" routerLinkActive="active" class="nav-item">
              <lucide-icon name="database" size="18"></lucide-icon> Source Manager
            </a>
            <a routerLink="/system" routerLinkActive="active" class="nav-item">
              <lucide-icon name="cog" size="18"></lucide-icon> System Settings
            </a>

            <ng-container *ngIf="authService.hasPermission('OP_MANAGE_USERS')">
              <p class="nav-label mt-6">Management</p>
              <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
                <lucide-icon name="user-cog" size="18"></lucide-icon> User Manager
              </a>
              <a routerLink="/admin/roles" routerLinkActive="active" class="nav-item">
                <lucide-icon name="shield-user" size="18"></lucide-icon> Role &amp; Privileges
              </a>
            </ng-container>
          </nav>

          <div class="user-profile" (click)="authService.logout()">
            <div class="avatar-initials">{{ initials() }}</div>
            <div class="user-info">
              <span class="user-name">{{ authService.currentUser()?.username || 'Guest' }}</span>
              <span class="user-role">{{ primaryRole() }}</span>
            </div>
            <lucide-icon name="log-out" size="16" class="logout-icon"></lucide-icon>
          </div>
        </aside>

        <main class="main-content">
          <header class="top-header">
            <div class="breadcrumb">
              <span class="muted">Signal Pulse</span> <span class="muted mx-2">/</span> <span class="current-route">Console</span>
            </div>
          </header>
          <div class="page-container">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; background-color: var(--bg-color); }
    .sidebar { width: var(--sidebar-width); background-color: var(--surface-base); border-right: 1px solid var(--border-light); display: flex; flex-direction: column; z-index: 10; }
    .brand { height: var(--header-height); display: flex; align-items: center; padding: 0 24px; border-bottom: 1px solid var(--border-light); gap: 12px; }
    .logo-img { width: 44px; height: 44px; object-fit: contain; padding: 6px; background-color: #1e293b; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.3); }
    .brand-text h2 { font-size: 1rem; margin: 0; color: var(--text-main); }
    .brand-text span { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .nav-menu { flex: 1; padding: 24px 16px; overflow-y: auto; }
    .nav-label { font-size: 0.7rem; font-weight: 600; color: var(--text-darkest); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; padding-left: 12px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: var(--text-muted); text-decoration: none; border-radius: var(--radius-sm); font-size: 0.95rem; font-weight: 500; transition: var(--transition); margin-bottom: 4px; }
    .nav-item:hover { background-color: rgba(255, 255, 255, 0.03); color: var(--text-main); }
    .nav-item.active { background-color: rgba(var(--primary-rgb), 0.1); color: var(--primary-color); position: relative; }
    .nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 60%; width: 3px; background-color: var(--primary-color); border-radius: 0 4px 4px 0; }
    .user-profile { padding: 20px; border-top: 1px solid var(--border-light); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: var(--transition); }
    .user-profile:hover { background-color: rgba(255, 255, 255, 0.02); }
    .avatar-initials { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #cf1f28, #e84855); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em; }
    .user-info { flex: 1; display: flex; flex-direction: column; }
    .user-name { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
    .user-role { font-size: 0.75rem; color: var(--text-muted); }
    .logout-icon { color: var(--text-darkest); }
    .user-profile:hover .logout-icon { color: var(--danger-color); }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .top-header { height: var(--header-height); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; border-bottom: 1px solid var(--border-light); background-color: rgba(11, 15, 25, 0.8); backdrop-filter: blur(8px); z-index: 5; }
    .breadcrumb { font-size: 0.9rem; font-weight: 500; }
    .current-route { color: var(--text-main); }
    .mx-2 { margin: 0 0.5rem; }
    .page-container { flex: 1; overflow-y: auto; padding: 32px; background: radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.03), transparent 400px); }
  `]
})
export class AppComponent {
  authService = inject(AuthService);

  initials = computed(() => {
    const name = this.authService.currentUser()?.username ?? '';
    if (!name) return '?';
    const cleaned = name.replace(/[^A-Za-z0-9]+/g, ' ').trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return cleaned.substring(0, 2).toUpperCase();
  });

  primaryRole = computed(() => this.authService.currentUser()?.roles?.[0]?.name ?? 'User');
}
