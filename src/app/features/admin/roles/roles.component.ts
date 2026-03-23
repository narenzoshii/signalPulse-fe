import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-roles',
  standalone: true,
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
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Privileges</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
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
                    <button class="icon-btn danger" (click)="deleteRole(role.id)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Role Modal -->
      @if (showModal) {
        <div class="modal-backdrop">
          <div class="modal card glass slide-up" style="max-width: 700px;">
            <div class="modal-header">
              <h3>{{ editingRole ? 'Configure' : 'Create' }} Role</h3>
              <button class="icon-btn" (click)="showModal = false"><lucide-icon name="x" size="20"></lucide-icon></button>
            </div>
            <div class="modal-body mt-4">
              <div class="form-group">
                <label>Role Name</label>
                <input class="input" [(ngModel)]="formData.name" placeholder="e.g. EDITOR" [disabled]="!!editingRole && formData.name === 'SUPERADMIN'">
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
            </div>
            <div class="modal-footer mt-6 flex justify-end gap-2">
              <button class="btn-secondary" (click)="showModal = false">Cancel</button>
              <button class="btn-primary" (click)="saveRole()">Save Configuration</button>
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
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  roles = signal<any[]>([]);
  allPrivileges = signal<any[]>([]);
  showModal = false;
  editingRole: any = null;
  formData: any = { privileges: [] };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.loadRoles().subscribe(r => this.roles.set(r));
    this.api.loadPrivileges().subscribe(p => this.allPrivileges.set(p));
  }

  getPrivilegeDesc(name: string): string {
    switch(name) {
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

  openCreate() {
    this.editingRole = null;
    this.formData = { name: '', privileges: [] };
    this.showModal = true;
  }

  openEdit(role: any) {
    this.editingRole = role;
    this.formData = { ...role, privileges: [...role.privileges] };
    this.showModal = true;
  }

  hasPrivilege(priv: any) {
    return this.formData.privileges.some((p: any) => p.id === priv.id);
  }

  togglePrivilege(priv: any) {
    const idx = this.formData.privileges.findIndex((p: any) => p.id === priv.id);
    if (idx > -1) {
      this.formData.privileges.splice(idx, 1);
    } else {
      this.formData.privileges.push(priv);
    }
  }

  saveRole() {
    this.api.saveRole(this.formData).subscribe(() => {
      this.loadData();
      this.showModal = false;
    });
  }

  deleteRole(id: number) {
    if (confirm('Delete this role? Users assigned to it will lose these privileges.')) {
      this.api.deleteRole(id).subscribe(() => this.loadData());
    }
  }
}
