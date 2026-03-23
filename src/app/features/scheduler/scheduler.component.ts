import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-scheduler',
  standalone: true,
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
        <!-- Add Form -->
        <div class="card glass entry-form" *ngIf="auth.hasPermission('OP_MANAGE_CONFIG')">
          <h2 class="section-title mb-6">Create Execution Blueprint</h2>
          
          <div class="form-group">
            <label>Blueprint Name</label>
            <input class="input" [(ngModel)]="newSchedule.name" placeholder="e.g. End of Day Scan" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
          </div>


          <div class="grid-2">
            <div class="form-group">
              <label>Execution Times</label>
              <div class="time-input-wrap">
                <input class="input" type="time" [(ngModel)]="timeInput" (keydown.enter)="addTime(timeInput); timeInput=''" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                <button class="icon-btn success ml-2" (click)="addTime(timeInput); timeInput=''" [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
                  <lucide-icon name="plus" size="18"></lucide-icon>
                </button>
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
                @for (d of ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']; track d) {
                  <button class="day-pill" 
                          [class.active]="newSchedule.weeklyDays.includes(d)" 
                          (click)="toggleDay(d)"
                          [disabled]="!auth.hasPermission('OP_MANAGE_CONFIG')">
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


        <!-- Active Schedules -->
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
                      <span class="flex items-center gap-1"><lucide-icon name="clock" size="14"></lucide-icon> {{ s.dailyTimes?.join(', ') || 'No times' }}</span>
                      <span class="flex items-center gap-1"><lucide-icon name="calendar" size="14"></lucide-icon> {{ (s.weeklyDays?.length || 0) + ' Days' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="flex gap-2" *ngIf="auth.hasPermission('OP_MANAGE_CONFIG')">
                  <button class="icon-btn" (click)="toggleActive(s)" [title]="s.active ? 'Pause Schedule' : 'Resume Schedule'">
                    <lucide-icon [name]="s.active ? 'pause-circle' : 'play-circle'" size="18" [class.warning-text]="s.active" [class.success-text]="!s.active"></lucide-icon>
                  </button>
                  <button class="icon-btn danger" (click)="deleteSchedule(s.id)" title="Decommission">
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
    .day-pill { background: rgba(0,0,0,0.3); border: 1px solid var(--border-strong); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; padding: 6px 12px; border-radius: 99px; transition: var(--transition); }
    .day-pill:hover { border-color: var(--primary-color); color: var(--text-main); }
    .day-pill.active { background: var(--primary-color); border-color: var(--primary-color); color: white; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4); }
    
    .schedule-card { transition: var(--transition); border-left: 3px solid var(--primary-color); }
    .schedule-card.paused { border-left-color: var(--border-strong); opacity: 0.8; }
    .schedule-card.paused * { color: var(--text-muted) !important; filter: grayscale(1); }
    
    .icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .primary-bg { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05)); border: 1px solid rgba(99, 102, 241, 0.2); color: var(--primary-color); }
    .neutral-bg { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-main); }
    
    .digest-banner { background: rgba(0,0,0,0.2); border-radius: 6px; padding: 10px 14px; font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-light); }
    
    .checkbox { appearance: none; width: 18px; height: 18px; border: 2px solid var(--border-strong); border-radius: 4px; background: rgba(0,0,0,0.2); outline: none; transition: var(--transition); position: relative; cursor: pointer; flex-shrink: 0; }
    .checkbox:checked { background: var(--primary-color); border-color: var(--primary-color); }
    .checkbox:checked::after { content: ''; position: absolute; left: 5px; top: 1px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
    .font-medium { font-weight: 500; font-size: 1.1rem; }
  `]
})
export class SchedulerComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);


  timeInput = '';

  newSchedule: any = {
    name: '',
    dailyTimes: [],
    weeklyDays: [],
    active: true
  };

  ngOnInit() {
    this.api.loadSchedules();
  }

  addTime(time: string) {
    if (time && !this.newSchedule.dailyTimes.includes(time)) {
      this.newSchedule.dailyTimes.push(time);
    }
  }

  removeTime(index: number) {
    this.newSchedule.dailyTimes.splice(index, 1);
  }

  toggleDay(day: string) {
    const idx = this.newSchedule.weeklyDays.indexOf(day);
    if (idx > -1) this.newSchedule.weeklyDays.splice(idx, 1);
    else this.newSchedule.weeklyDays.push(day);
  }

  saveSchedule() {
    if (this.timeInput) {
      this.addTime(this.timeInput);
      this.timeInput = '';
    }
    if (!this.newSchedule.name) this.newSchedule.name = 'Auto Generated Stream';
    this.api.saveSchedule(this.newSchedule).subscribe(() => {
      this.api.loadSchedules();
      this.newSchedule = { name: '', dailyTimes: [], weeklyDays: [], active: true };
    });
  }

  toggleActive(config: any) {
    config.active = !config.active;
    this.api.saveSchedule(config).subscribe(() => this.api.loadSchedules());
  }

  deleteSchedule(id: number) {
    this.api.deleteSchedule(id).subscribe(() => this.api.loadSchedules());
  }
}
