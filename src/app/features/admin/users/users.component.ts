import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="admin-container">
      <header class="section-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="subtitle">Create and manage application users and their assigned roles</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <lucide-icon name="user-plus" size="16"></lucide-icon> Create User
        </button>
      </header>

      <div class="card glass mt-6">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Roles</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td class="muted">{{ user.id }}</td>
                  <td class="font-medium">{{ user.username }}</td>
                  <td>
                    <div class="flex gap-1 flex-wrap">
                      @for (role of user.roles; track role.id) {
                        <span class="badge badge-neutral">{{ role.name }}</span>
                      }
                    </div>
                  </td>
                  <td class="text-right">
                    <button class="icon-btn mr-1" (click)="openEdit(user)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                    <button class="icon-btn danger" (click)="deleteUser(user.id)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Modal -->
      @if (showModal) {
        <div class="modal-backdrop">
          <div class="modal card glass slide-up">
            <div class="modal-header">
              <h3>{{ editingUser ? 'Edit' : 'Create' }} User</h3>
              <button class="icon-btn" (click)="showModal = false"><lucide-icon name="x" size="20"></lucide-icon></button>
            </div>
            <div class="modal-body mt-4">
              <div class="form-group">
                <label>Username</label>
                <input class="input" [(ngModel)]="formData.username" placeholder="Enter username">
              </div>
              <div class="form-group">
                <label>Password {{ editingUser ? '(Leave blank to keep current)' : '' }}</label>
                <input type="password" class="input" [(ngModel)]="formData.password" placeholder="Enter password">
              </div>
              <div class="form-group">
                <label>Assigned Roles</label>
                <div class="roles-grid">
                  @for (role of allRoles(); track role.id) {
                    <label class="checkbox-item">
                      <input type="checkbox" [checked]="isRoleSelected(role)" (change)="toggleRole(role)">
                      <span>{{ role.name }}</span>
                    </label>
                  }
                </div>
              </div>
            </div>
            <div class="modal-footer mt-6 flex justify-end gap-2">
              <button class="btn-secondary" (click)="showModal = false">Cancel</button>
              <button class="btn-primary" (click)="saveUser()">Save User</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container { animation: fadeIn 0.4s ease-out; max-width: 1000px; margin: 0 auto; }
    .roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .checkbox-item { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 10px; background: rgba(255,255,255,0.05); border-radius: 6px; }
    .mr-1 { margin-right: 4px; }
    .text-right { text-align: right; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  users = signal<any[]>([]);
  allRoles = signal<any[]>([]);
  showModal = false;
  editingUser: any = null;
  formData: any = { roles: [] };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.loadUsers().subscribe(u => this.users.set(u));
    this.api.loadRoles().subscribe(r => this.allRoles.set(r));
  }

  openCreate() {
    this.editingUser = null;
    this.formData = { username: '', password: '', roles: [] };
    this.showModal = true;
  }

  openEdit(user: any) {
    this.editingUser = user;
    this.formData = { ...user, password: '' };
    this.showModal = true;
  }

  isRoleSelected(role: any) {
    return this.formData.roles.some((r: any) => r.id === role.id);
  }

  toggleRole(role: any) {
    const idx = this.formData.roles.findIndex((r: any) => r.id === role.id);
    if (idx > -1) {
      this.formData.roles.splice(idx, 1);
    } else {
      this.formData.roles.push(role);
    }
  }

  saveUser() {
    this.api.saveUser(this.formData).subscribe(() => {
      this.loadData();
      this.showModal = false;
    });
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.api.deleteUser(id).subscribe(() => this.loadData());
    }
  }
}
