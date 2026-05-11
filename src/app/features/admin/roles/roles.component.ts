import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/services/api.service';
import { Privilege, Role, RoleRequest } from '../../../core/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="admin-container">
      <header class="section-header">
        <div>
          <h1 class="page-title">Role & Privilege Mapping</h1>
          <p class="subtitle">Define roles and assign granular privileges to them</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <lucide-icon name="shield-plus" size="16"></lucide-icon> New Role
        </button>
      </header>

      <div class="card glass mt-6">
        <div class="table-container">
          <table>
            <thead><tr><th>Role Name</th><th>Privileges</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
              @for (role of roles(); track role.id) {
                <tr>
                  <td class="font-bold primary-text">{{ role.name }}</td>
                  <td>
                    <div class="flex gap-1 flex-wrap">
                      @for (p of role.privileges; track p.id) {
                        <span class="badge badge-success">{{ p.name }}</span>
                      }
                      @if (role.privileges.length === 0) {
                        <span class="muted text-sm">No privileges assigned</span>
                      }
                    </div>
                  </td>
                  <td class="text-right">
                    <button class="icon-btn mr-1" (click)="openEdit(role)"><lucide-icon name="settings-2" size="16"></lucide-icon></button>
                    <button class="icon-btn danger" (click)="deleteRole(role)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                  </td>
                </tr>
              }
              @if (roles().length === 0) {
                <tr><td colspan="3" class="text-center py-6 muted">No roles configured.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (showModal()) {
        <div class="modal-backdrop" (click)="showModal.set(false)">
          <div class="modal card glass slide-up" style="max-width: 700px;" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>{{ editingRole ? 'Configure' : 'Create' }} Role</h3>
              <button class="icon-btn" (click)="showModal.set(false)"><lucide-icon name="x" size="20"></lucide-icon></button>
            </div>
            <div class="modal-body mt-4">
              <div class="form-group">
                <label>Role Name</label>
                <input class="input" [(ngModel)]="formName" placeholder="e.g. EDITOR" [disabled]="!!editingRole && formName === 'SUPERADMIN'">
                <span class="hint muted">Uppercase letters, digits, underscore.</span>
              </div>
              <div class="form-group mt-6">
                <label class="block mb-2">Privilege Matrix</label>
                <div class="privilege-grid">
                  @for (p of allPrivileges(); track p.id) {
                    <div class="p-item" (click)="togglePrivilege(p)">
                      <div class="checkbox" [class.checked]="hasPrivilege(p)">
                        <lucide-icon name="check" size="12" *ngIf="hasPrivilege(p)"></lucide-icon>
                      </div>
                      <div class="p-info">
                        <span class="p-name">{{ p.name }}</span>
                        <span class="p-desc">{{ getPrivilegeDesc(p.name) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
              @if (saveError()) {
                <div class="alert alert-danger mt-3">{{ saveError() }}</div>
              }
            </div>
            <div class="modal-footer mt-6 flex justify-end gap-2">
              <button class="btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button class="btn-primary" (click)="saveRole()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save Configuration' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container { animation: fadeIn 0.4s ease-out; max-width: 1000px; margin: 0 auto; }
    .privilege-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .p-item { display: flex; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: 10px; cursor: pointer; transition: 0.2s; }
    .p-item:hover { background: rgba(255,255,255,0.07); border-color: var(--primary-color); }
    .checkbox { width: 18px; height: 18px; border: 2px solid var(--border-strong); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
    .checkbox.checked { background: var(--success-color); border-color: var(--success-color); color: white; }
    .p-info { display: flex; flex-direction: column; }
    .p-name { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
    .p-desc { font-size: 0.75rem; color: var(--text-muted); }
    .mr-1 { margin-right: 4px; }
    .text-right { text-align: right; }
    .alert-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); padding: 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.85rem; }
    .hint { font-size: 0.75rem; margin-top: 4px; display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  roles = signal<Role[]>([]);
  allPrivileges = signal<Privilege[]>([]);
  showModal = signal(false);
  saving = signal(false);
  saveError = signal<string | null>(null);

  editingRole: Role | null = null;
  formName = '';
  private selectedPrivilegeIds = new Set<number>();

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.api.loadRoles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => this.roles.set(r),
      error: err => console.error('loadRoles failed', err),
    });
    this.api.loadPrivileges().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => this.allPrivileges.set(p),
      error: err => console.error('loadPrivileges failed', err),
    });
  }

  getPrivilegeDesc(name: string): string {
    switch (name) {
      case 'OP_READ_ALL': return 'View dashboard, history and all sources';
      case 'OP_WRITE_SOURCES': return 'Add/Edit/Delete RSS feeds and HTML pages';
      case 'OP_WRITE_RULES': return 'Modify topic scoring and ranking patterns';
      case 'OP_TRIGGER_SCAN': return 'Manually execute a synchronization job';
      case 'OP_MANAGE_USERS': return 'Full control over users, roles and security';
      case 'OP_MANAGE_CONFIG': return 'Change system-wide settings and timeouts';
      case 'OP_PAUSE_JOBS': return 'Pause or resume any scheduled background jobs';
      default: return 'Custom system operation';
    }
  }

  openCreate(): void {
    this.editingRole = null;
    this.formName = '';
    this.selectedPrivilegeIds = new Set();
    this.saveError.set(null);
    this.showModal.set(true);
  }

  openEdit(role: Role): void {
    this.editingRole = role;
    this.formName = role.name;
    this.selectedPrivilegeIds = new Set(role.privileges.map(p => p.id));
    this.saveError.set(null);
    this.showModal.set(true);
  }

  hasPrivilege(p: Privilege): boolean {
    return this.selectedPrivilegeIds.has(p.id);
  }

  togglePrivilege(p: Privilege): void {
    if (this.selectedPrivilegeIds.has(p.id)) this.selectedPrivilegeIds.delete(p.id);
    else this.selectedPrivilegeIds.add(p.id);
  }

  saveRole(): void {
    if (this.saving()) return;
    this.saveError.set(null);
    if (!/^[A-Z][A-Z0-9_]*$/.test(this.formName)) {
      this.saveError.set('Role name must be uppercase letters, digits or underscore.');
      return;
    }
    const payload: RoleRequest = {
      id: this.editingRole?.id,
      name: this.formName,
      privilegeIds: [...this.selectedPrivilegeIds],
    };
    this.saving.set(true);
    this.api.saveRole(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.loadData(); this.showModal.set(false); },
      error: err => { this.saving.set(false); this.saveError.set(err?.error?.message ?? err?.message ?? 'Save failed'); },
    });
  }

  deleteRole(role: Role): void {
    if (!confirm(`Delete role "${role.name}"? Users assigned to it will lose these privileges.`)) return;
    this.api.deleteRole(role.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadData(),
      error: err => console.error('deleteRole failed', err),
    });
  }
}
