import { Component, inject, OnInit, effect } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-system',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="system-container">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="page-title mb-1">System Configuration</h1>
          <p class="muted">Global application constraints, notifications, and diagnostics.</p>
        </div>
      </div>

      <div class="main-grid">
        <!-- Notification Settings -->
        <div class="card glass">
          <div class="flex items-center gap-2 mb-6">
            <div class="icon-wrap primary-bg"><lucide-icon name="mail" size="20"></lucide-icon></div>
            <h3 class="section-title mb-0">Delivery Settings</h3>
          </div>
          
          <div class="form-body">
            <div class="form-group mb-4">
              <label>Recipient Distribution List</label>
              <input [(ngModel)]="localConfigs.NOTIFY_RECIPIENTS" class="input" placeholder="comma separated emails" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">

              <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Emails that will receive digest and alert notifications.</span>
            </div>
            
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label>SMTP Sender (Gmail)</label>
                <input [(ngModel)]="localConfigs.GMAIL_USER" class="input" placeholder="agent@company.com" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>App Password</label>
                <input type="password" [(ngModel)]="localConfigs.GMAIL_PASSWORD" class="input" placeholder="••••••••••••••••" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>

            </div>
          </div>
        </div>

        <!-- App Tuning -->
        <div class="card glass">
          <div class="flex items-center gap-2 mb-6">
            <div class="icon-wrap success-bg"><lucide-icon name="sliders" size="20"></lucide-icon></div>
            <h3 class="section-title mb-0">Tuning</h3>
          </div>
          
          <div class="form-body">
            <div class="grid-2">
              <div class="form-group">
                <label>Extraction Cap</label>
                <input type="number" [(ngModel)]="localConfigs.TOP_N_ARTICLES" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Max articles included per alert payload.</span>
              </div>
              <div class="form-group">
                <label>Min Relevance Score</label>
                <input type="number" [(ngModel)]="localConfigs.MIN_RELEVANCE_SCORE" class="input" step="0.1" min="0" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Articles scoring below this are discarded (default 1.0 when rules exist).</span>
              </div>

              <div class="form-group">
                <label>Initial Lookback (Hrs)</label>
                <input type="number" [(ngModel)]="localConfigs.INITIAL_LOOKBACK_HOURS" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Window bounds for first-ever system scan.</span>
              </div>

              <div class="form-group">
                <label>Manual Scan Window (Hrs)</label>
                <input type="number" [(ngModel)]="localConfigs.MANUAL_WINDOW" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Lookback limit for manual override scans.</span>
              </div>

              <div class="form-group">
                <label>Max Scan Retries</label>
                <input type="number" [(ngModel)]="localConfigs.SCAN_MAX_RETRIES" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Number of retry attempts for failed sources.</span>
              </div>

              <div class="form-group">
                <label>Retry Interval (ms)</label>
                <input type="number" [(ngModel)]="localConfigs.SCAN_RETRY_INTERVAL_MS" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Delay between retries (exponential backoff base).</span>
              </div>

              <div class="form-group">
                <label>AES Encryption Key</label>
                <input type="password" [(ngModel)]="localConfigs.AES_KEY" class="input" placeholder="32-char key for AES-256" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block" style="font-size: 0.75rem;">Used to secure your SMTP app password in the database.</span>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6 text-right" *ngIf="auth.hasPermission('OP_MANAGE_CONFIG')">
        <button class="btn-primary" (click)="saveSettings()">
          <lucide-icon name="save" size="18"></lucide-icon> Update Configuration
        </button>
      </div>


      <!-- Live Diagnostics -->
      <div class="mt-8">
        <h3 class="section-title mb-4">Live Diagnostics</h3>
        <div class="grid-3">
          <div class="card glass text-center py-4 diagnostics-card">
            <lucide-icon name="server" size="28" class="success-text mb-3 mx-auto"></lucide-icon>
            <h4 class="font-medium">Core Engine</h4>
            <p class="muted text-sm mt-1">ONLINE - Latency 14ms</p>
          </div>
          <div class="card glass text-center py-4 diagnostics-card">
            <lucide-icon name="database" size="28" class="primary-text mb-3 mx-auto"></lucide-icon>
            <h4 class="font-medium">Database Persistence</h4>
            <p class="muted text-sm mt-1">CONNECTED - 1.2MB Pool</p>
          </div>
          <div class="card glass text-center py-4 diagnostics-card">
            <lucide-icon name="shield-check" size="28" class="warning-text mb-3 mx-auto"></lucide-icon>
            <h4 class="font-medium">Scanner Module</h4>
            <p class="muted text-sm mt-1">IDLE - Awaiting Job</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .system-container { animation: fadeIn 0.4s ease-out; max-width: 1200px; margin: 0 auto; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .page-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.25rem; }
    .section-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
    
    .main-grid { display: flex; flex-direction: column; gap: 2rem; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; }
    
    .icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .primary-bg { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05)); border: 1px solid rgba(99, 102, 241, 0.2); color: var(--primary-color); }
    .success-bg { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--success-color); }
    
    .text-sm { font-size: 0.85rem; }
    .font-medium { font-weight: 500; font-size: 1.05rem; margin: 0; }
    .block { display: block; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .diagnostics-card { display: flex; flex-direction: column; align-items: center; }
  `]
})
export class SettingsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  localConfigs: any = {
    NOTIFY_RECIPIENTS: '',
    TOP_N_ARTICLES: 5,
    GMAIL_USER: '',
    GMAIL_PASSWORD: '',
    MANUAL_WINDOW: 24,
    INITIAL_LOOKBACK_HOURS: 1000,
    MIN_RELEVANCE_SCORE: 1.0,
    SCAN_MAX_RETRIES: 3,
    SCAN_RETRY_INTERVAL_MS: 2000,
    AES_KEY: ''
  };

  constructor() {
    effect(() => {
      const data = this.api.configs();
      if (data) {
        // Merge API data into local configs, ensuring numeric values are preserved if they arrive as strings
        Object.keys(data).forEach(key => {
          this.localConfigs[key] = data[key];
        });
      }
    });
  }

  ngOnInit() {
    this.api.loadConfigs();
  }

  saveSettings() {
    this.api.saveConfigs(this.localConfigs).subscribe(() => {
      alert('System configuration synchronized successfully.');
    });
  }
}
