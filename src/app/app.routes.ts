import { Routes } from '@angular/router';
import { authGuard, hasAuthorityGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'config',
    canActivate: [authGuard, hasAuthorityGuard('OP_READ_ALL')],
    loadComponent: () => import('./features/sources/sources.component').then(m => m.SourcesComponent),
  },
  {
    path: 'scheduler',
    canActivate: [authGuard, hasAuthorityGuard('OP_READ_ALL', 'OP_MANAGE_CONFIG')],
    loadComponent: () => import('./features/scheduler/scheduler.component').then(m => m.SchedulerComponent),
  },
  {
    path: 'system',
    canActivate: [authGuard, hasAuthorityGuard('OP_READ_ALL', 'OP_MANAGE_CONFIG')],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, hasAuthorityGuard('OP_MANAGE_USERS')],
    loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent),
  },
  {
    path: 'admin/roles',
    canActivate: [authGuard, hasAuthorityGuard('OP_MANAGE_USERS')],
    loadComponent: () => import('./features/admin/roles/roles.component').then(m => m.RolesComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
