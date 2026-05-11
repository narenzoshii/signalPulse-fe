import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/services/api.service';
import { Role, User, UserRequest } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
              <tr><th>ID</th><th>Username</th><th>Roles</th><th class="text-right">Actions</th></tr>
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
                    <button class="icon-btn danger" (click)="deleteUser(user)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                  </td>
                </tr>
              }
              @if (users().length === 0) {
                <tr><td colspan="4" class="text-center py-6 muted">No users yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (showModal()) {
        <div class="modal-backdrop" (click)="showModal.set(false)">
          <div class="modal card glass slide-up" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>{{ editingUser ? 'Edit' : 'Create' }} User</h3>
              <button class="icon-btn" (click)="showModal.set(false)"><lucide-icon name="x" size="20"></lucide-icon></button>
            </div>
            <div class="modal-body mt-4">
              <div class="form-group">
                <label>Username</label>
                <input class="input" [(ngModel)]="formUsername" placeholder="Enter username" autocomplete="off">
              </div>
              <div class="form-group">
                <label>Password {{ editingUser ? '(Leave blank to keep current)' : '' }}</label>
                <input type="password" class="input" [(ngModel)]="formPassword" placeholder="Min 8 chars" autocomplete="new-password">
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
              @if (saveError()) {
                <div class="alert alert-danger mt-2">{{ saveError() }}</div>
              }
            </div>
            <div class="modal-footer mt-6 flex justify-end gap-2">
              <button class="btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button class="btn-primary" (click)="saveUser()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save User' }}
              </button>
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
    .alert-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); padding: 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.85rem; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  users = signal<User[]>([]);
  allRoles = signal<Role[]>([]);
  showModal = signal(false);
  saving = signal(false);
  saveError = signal<string | null>(null);

  editingUser: User | null = null;
  formUsername = '';
  formPassword = '';
  selectedRoleIds = new Set<number>();

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.api.loadUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: u => this.users.set(u),
      error: err => console.error('loadUsers failed', err),
    });
    this.api.loadRoles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => this.allRoles.set(r),
      error: err => console.error('loadRoles failed', err),
    });
  }

  openCreate(): void {
    this.editingUser = null;
    this.formUsername = '';
    this.formPassword = '';
    this.selectedRoleIds = new Set();
    this.saveError.set(null);
    this.showModal.set(true);
  }

  openEdit(user: User): void {
    this.editingUser = user;
    this.formUsername = user.username;
    this.formPassword = '';
    this.selectedRoleIds = new Set(user.roles.map(r => r.id));
    this.saveError.set(null);
    this.showModal.set(true);
  }

  isRoleSelected(role: Role): boolean {
    return this.selectedRoleIds.has(role.id);
  }

  toggleRole(role: Role): void {
    if (this.selectedRoleIds.has(role.id)) this.selectedRoleIds.delete(role.id);
    else this.selectedRoleIds.add(role.id);
  }

  saveUser(): void {
    if (this.saving()) return;
    this.saveError.set(null);
    if (!this.formUsername || this.formUsername.length < 3) {
      this.saveError.set('Username must be at least 3 characters.');
      return;
    }
    if (!this.editingUser && (!this.formPassword || this.formPassword.length < 8)) {
      this.saveError.set('Password is required (min 8 chars) for new users.');
      return;
    }
    if (this.formPassword && this.formPassword.length < 8) {
      this.saveError.set('Password must be at least 8 characters.');
      return;
    }
    const payload: UserRequest = {
      id: this.editingUser?.id,
      username: this.formUsername,
      password: this.formPassword || undefined,
      roleIds: [...this.selectedRoleIds],
    };
    this.saving.set(true);
    this.api.saveUser(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.loadData(); this.showModal.set(false); },
      error: err => { this.saving.set(false); this.saveError.set(err?.error?.message ?? err?.message ?? 'Save failed'); },
    });
  }

  deleteUser(user: User): void {
    if (user.id == null) return;
    if (!confirm(`Delete user "${user.username}"?`)) return;
    this.api.deleteUser(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadData(),
      error: err => console.error('deleteUser failed', err),
    });
  }
}
