import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

const MASK = '********';

interface SettingsForm {
  NOTIFY_RECIPIENTS: string;
  TOP_N_ARTICLES: string;
  GMAIL_USER: string;
  GMAIL_PASSWORD: string;
  MANUAL_WINDOW: string;
  INITIAL_LOOKBACK_HOURS: string;
  MIN_RELEVANCE_SCORE: string;
  SCAN_MAX_RETRIES: string;
  SCAN_RETRY_INTERVAL_MS: string;
  AES_KEY: string;
  [key: string]: string;
}

@Component({
  selector: 'app-system',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <div class="card glass">
          <div class="flex items-center gap-2 mb-6">
            <div class="icon-wrap primary-bg"><lucide-icon name="mail" size="20"></lucide-icon></div>
            <h3 class="section-title mb-0">Delivery Settings</h3>
          </div>
          <div class="form-body">
            <div class="form-group mb-4">
              <label>Recipient Distribution List</label>
              <input [(ngModel)]="localConfigs.NOTIFY_RECIPIENTS" class="input" placeholder="comma separated emails" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              <span class="hint muted mt-1 block">Emails that will receive digest and alert notifications.</span>
            </div>
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label>SMTP Sender (Gmail)</label>
                <input [(ngModel)]="localConfigs.GMAIL_USER" class="input" placeholder="agent@company.com" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>App Password</label>
                <input type="password" [(ngModel)]="localConfigs.GMAIL_PASSWORD" class="input" placeholder="leave blank to keep current" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block">Server returns "********" when set. Leave blank or unchanged to preserve.</span>
              </div>
            </div>
          </div>
        </div>

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
                <span class="hint muted mt-1 block">Max articles per alert payload.</span>
              </div>
              <div class="form-group">
                <label>Min Relevance Score</label>
                <input type="number" [(ngModel)]="localConfigs.MIN_RELEVANCE_SCORE" class="input" step="0.1" min="0" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>Initial Lookback (Hrs)</label>
                <input type="number" [(ngModel)]="localConfigs.INITIAL_LOOKBACK_HOURS" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>Manual Scan Window (Hrs)</label>
                <input type="number" [(ngModel)]="localConfigs.MANUAL_WINDOW" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>Max Scan Retries</label>
                <input type="number" [(ngModel)]="localConfigs.SCAN_MAX_RETRIES" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>Retry Interval (ms)</label>
                <input type="number" [(ngModel)]="localConfigs.SCAN_RETRY_INTERVAL_MS" class="input" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
              </div>
              <div class="form-group">
                <label>AES Encryption Key</label>
                <input type="password" [(ngModel)]="localConfigs.AES_KEY" class="input" placeholder="leave blank to keep current" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <span class="hint muted mt-1 block">Server returns "********" when set. Leave blank or unchanged to preserve.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 text-right" *ngIf="auth.hasPermission('OP_MANAGE_CONFIG')">
        @if (saveMessage()) { <span class="muted mr-3">{{ saveMessage() }}</span> }
        <button class="btn-primary" (click)="saveSettings()" [disabled]="saving()">
          <lucide-icon name="save" size="18"></lucide-icon> {{ saving() ? 'Saving…' : 'Update Configuration' }}
        </button>
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
    .icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .primary-bg { background: linear-gradient(135deg, rgba(var(--primary-rgb),0.2), rgba(var(--primary-rgb),0.05)); border: 1px solid rgba(var(--primary-rgb),0.2); color: var(--primary-color); }
    .success-bg { background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.2); color: var(--success-color); }
    .text-right { text-align: right; }
    .hint { font-size: 0.75rem; }
    .mr-3 { margin-right: 0.75rem; }
  `]
})
export class SettingsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  saving = signal(false);
  saveMessage = signal<string | null>(null);

  localConfigs: SettingsForm = {
    NOTIFY_RECIPIENTS: '',
    TOP_N_ARTICLES: '5',
    GMAIL_USER: '',
    GMAIL_PASSWORD: '',
    MANUAL_WINDOW: '24',
    INITIAL_LOOKBACK_HOURS: '1000',
    MIN_RELEVANCE_SCORE: '1.0',
    SCAN_MAX_RETRIES: '3',
    SCAN_RETRY_INTERVAL_MS: '2000',
    AES_KEY: '',
  };

  /** Snapshot of values seen from server, so we know what's untouched and shouldn't be re-sent. */
  private serverSnapshot: Record<string, string> = {};

  constructor() {
    effect(() => {
      const data = this.api.configs();
      if (!data) return;
      this.serverSnapshot = { ...data };
      Object.keys(data).forEach(k => {
        this.localConfigs[k] = data[k];
      });
    });
  }

  ngOnInit(): void {
    this.api.loadConfigs();
  }

  saveSettings(): void {
    this.saving.set(true);
    this.saveMessage.set(null);
    const payload: Record<string, string> = {};
    Object.keys(this.localConfigs).forEach(k => {
      const v = this.localConfigs[k];
      // Don't echo back the mask placeholder — backend already filters but be defensive.
      if (v === MASK) return;
      // Don't bother re-sending unchanged sensitive blanks
      if ((k === 'GMAIL_PASSWORD' || k === 'AES_KEY') && (!v || v === this.serverSnapshot[k])) return;
      payload[k] = v;
    });

    this.api.saveConfigs(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveMessage.set('Saved.');
        this.api.loadConfigs();
        setTimeout(() => this.saveMessage.set(null), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.saveMessage.set('Save failed: ' + (err?.error?.message ?? err?.message ?? 'unknown'));
      },
    });
  }
}
