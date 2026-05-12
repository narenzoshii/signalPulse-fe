import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ScheduleConfig } from '../../core/models';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="scheduler-container">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="page-title mb-1">Job Engine</h1>
          <p class="muted">Orchestrate automated data pull operations and aggregation frequencies.</p>
        </div>
      </div>

      <div class="main-grid">
        <div class="card glass entry-form" *ngIf="auth.hasPermission('OP_MANAGE_CONFIG')">
          <h2 class="section-title mb-6">Create Execution Blueprint</h2>
          <div class="form-group">
            <label>Blueprint Name</label>
            <input class="input" [(ngModel)]="newSchedule.name" placeholder="e.g. End of Day Scan">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Execution Times</label>
              <div class="time-input-wrap">
                <input class="input" type="time" [(ngModel)]="timeInput" (keydown.enter)="addTimeFromInput()">
                <button class="icon-btn success ml-2" (click)="addTimeFromInput()"><lucide-icon name="plus" size="18"></lucide-icon></button>
              </div>
              <div class="tags mt-3">
                @for (t of newSchedule.dailyTimes; track t; let i = $index) {
                  <span class="badge badge-neutral flex gap-2 items-center">
                    <lucide-icon name="clock" size="12"></lucide-icon> {{t}}
                    <lucide-icon name="x" size="14" class="cursor-pointer hover-danger" (click)="removeTime(i)"></lucide-icon>
                  </span>
                }
                @if (newSchedule.dailyTimes.length === 0) {
                  <span class="text-xs muted block mt-1">No times added yet.</span>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Active Days</label>
              <div class="day-pills mt-2">
                @for (d of daysOfWeek; track d) {
                  <button class="day-pill" [class.active]="newSchedule.weeklyDays.includes(d)" (click)="toggleDay(d)">
                    {{ d.substring(0,3) }}
                  </button>
                }
              </div>
            </div>
          </div>
          <div class="mt-8">
            <button class="btn-primary w-full" (click)="saveSchedule()">
              <lucide-icon name="arrow-right-circle" size="18"></lucide-icon> Deploy Schedule Blueprint
            </button>
          </div>
        </div>

        <div class="schedules-list">
          <h3 class="section-title mb-4">Deployed Blueprints</h3>
          @for (s of api.schedules(); track s.id) {
            <div class="card glass mb-4 schedule-card" [class.paused]="!s.active">
              <div class="flex justify-between items-start">
                <div class="flex gap-4">
                  <div class="icon-wrap" [class.primary-bg]="s.active" [class.neutral-bg]="!s.active">
                    <lucide-icon name="route" size="20"></lucide-icon>
                  </div>
                  <div>
                    <h4 class="font-medium flex items-center gap-2" style="margin:0; line-height: 1;">
                      {{ s.name || 'Unnamed Job' }}
                      @if (!s.active) { <span class="badge badge-danger" style="font-size: 0.6rem; padding: 2px 6px;">PAUSED</span> }
                    </h4>
                    <div class="text-sm muted flex gap-4 mt-2">
                      <span class="flex items-center gap-1"><lucide-icon name="clock" size="14"></lucide-icon> {{ s.dailyTimes.length ? s.dailyTimes.join(', ') : 'No times' }}</span>
                      <span class="flex items-center gap-1"><lucide-icon name="calendar" size="14"></lucide-icon> {{ s.weeklyDays.length + ' Days' }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2" *ngIf="auth.hasPermission('OP_MANAGE_CONFIG')">
                  <button class="icon-btn" (click)="toggleActive(s)" [title]="s.active ? 'Pause Schedule' : 'Resume Schedule'">
                    <lucide-icon [name]="s.active ? 'pause-circle' : 'play-circle'" size="18" [class.warning-text]="s.active" [class.success-text]="!s.active"></lucide-icon>
                  </button>
                  <button class="icon-btn danger" (click)="deleteSchedule(s)" title="Decommission">
                    <lucide-icon name="trash-2" size="18"></lucide-icon>
                  </button>
                </div>
              </div>
            </div>
          }
          @if (api.schedules().length === 0) {
            <div class="card glass text-center py-6 muted" style="min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <lucide-icon name="layers" size="32" class="mb-3" style="opacity: 0.5"></lucide-icon>
              <p>No blueprints deployed.<br>Create one to begin automated operations.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scheduler-container { animation: fadeIn 0.4s ease-out; max-width: 1200px; margin: 0 auto; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .page-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.25rem; }
    .section-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: start; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .entry-form { position: sticky; top: 20px; padding: 2rem; }
    .schedule-card { padding: 1.5rem; }
    .time-input-wrap { display: flex; align-items: center; }
    .ml-2 { margin-left: 0.5rem; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .text-xs { font-size: 0.75rem; }
    .cursor-pointer { cursor: pointer; }
    .hover-danger:hover { color: var(--danger-color); }
    .day-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .day-pill { background: var(--surface-hover); border: 1px solid var(--border-strong); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; padding: 6px 12px; border-radius: 99px; transition: var(--transition); }
    .day-pill:hover { border-color: var(--primary-color); color: var(--text-main); }
    .day-pill.active { background: var(--primary-color); border-color: var(--primary-color); color: white; box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.4); }
    .schedule-card { transition: var(--transition); border-left: 3px solid var(--primary-color); }
    .schedule-card.paused { border-left-color: var(--border-strong); opacity: 0.8; }
    .schedule-card.paused * { color: var(--text-muted) !important; filter: grayscale(1); }
    .icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .primary-bg { background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.05)); border: 1px solid rgba(var(--primary-rgb), 0.2); color: var(--primary-color); }
    .neutral-bg { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-main); }
    .font-medium { font-weight: 500; font-size: 1.1rem; }
  `]
})
export class SchedulerComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly daysOfWeek = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'] as const;

  timeInput = '';
  newSchedule: ScheduleConfig = {
    name: '',
    dailyTimes: [],
    weeklyDays: [],
    active: true,
    weeklyDigestEnabled: false,
  };

  ngOnInit(): void {
    this.api.loadSchedules();
  }

  addTimeFromInput(): void {
    const t = this.timeInput?.trim();
    if (!t) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) {
      alert('Time must be in HH:mm format');
      return;
    }
    if (!this.newSchedule.dailyTimes.includes(t)) this.newSchedule.dailyTimes.push(t);
    this.timeInput = '';
  }

  removeTime(index: number): void {
    this.newSchedule.dailyTimes.splice(index, 1);
  }

  toggleDay(day: string): void {
    const idx = this.newSchedule.weeklyDays.indexOf(day);
    if (idx > -1) this.newSchedule.weeklyDays.splice(idx, 1);
    else this.newSchedule.weeklyDays.push(day);
  }

  saveSchedule(): void {
    if (this.timeInput) this.addTimeFromInput();
    if (this.newSchedule.dailyTimes.length === 0) {
      alert('Add at least one execution time.');
      return;
    }
    const payload: ScheduleConfig = {
      ...this.newSchedule,
      name: this.newSchedule.name || 'Auto Generated Stream',
    };
    this.api.saveSchedule(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.api.loadSchedules();
        this.newSchedule = { name: '', dailyTimes: [], weeklyDays: [], active: true, weeklyDigestEnabled: false };
      },
      error: err => { console.error('saveSchedule failed', err); alert('Failed to save schedule.'); },
    });
  }

  toggleActive(config: ScheduleConfig): void {
    const updated: ScheduleConfig = { ...config, active: !config.active };
    this.api.saveSchedule(updated).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.api.loadSchedules(),
      error: err => console.error('toggleActive failed', err),
    });
  }

  deleteSchedule(s: ScheduleConfig): void {
    if (s.id == null) return;
    if (!confirm(`Decommission "${s.name}"?`)) return;
    this.api.deleteSchedule(s.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.api.loadSchedules(),
      error: err => console.error('deleteSchedule failed', err),
    });
  }
}
