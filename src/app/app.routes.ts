import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'dashboard', 
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'config', 
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/sources/sources.component').then(m => m.SourcesComponent) 
  },
  { 
    path: 'scheduler', 
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/scheduler/scheduler.component').then(m => m.SchedulerComponent) 
  },
  { 
    path: 'system', 
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) 
  },
  {
    path: 'admin/users',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'admin/roles',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/admin/roles/roles.component').then(m => m.RolesComponent)
  }
];
