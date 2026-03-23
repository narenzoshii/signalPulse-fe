import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="dashboard-container">

      <div class="welcome-section mb-6">
        <h1 class="page-title">Welcome back, {{ auth.currentUser()?.username }} 👋</h1>
        <p class="muted">Here is an overview of the signalPulse today.</p>
      </div>


      <!-- Status Cards -->
      <div class="stats-grid mb-6">
        <div class="card glass stat-card">
          <div class="stat-header">
            <div class="icon-wrap primary-bg"><lucide-icon name="database" size="20"></lucide-icon></div>
            <span class="badge badge-success">Sources</span>
          </div>
          <div class="stat-body mt-4">
            <span class="label">Total Managed Sources</span>
            <div class="value">{{ api.feeds().length + api.pages().length }}</div>
          </div>
        </div>

        <div class="card glass stat-card">
          <div class="stat-header">
            <div class="icon-wrap success-bg"><lucide-icon name="activity" size="20"></lucide-icon></div>
          </div>
          <div class="stat-body mt-4">
            <span class="label">Last Scan Performance</span>
            <div class="value">{{ api.stats()?.recentResults?.[0]?.durationMs || '0' }}<span class="unit">ms</span></div>
          </div>
        </div>

        <div class="card glass stat-card">
          <div class="stat-header">
            <div class="icon-wrap warning-bg"><lucide-icon name="refresh-cw" size="20"></lucide-icon></div>
            <span class="badge badge-success">+New</span>
          </div>
          <div class="stat-body mt-4">
            <span class="label">Latest Scan Matches</span>
            <div class="value text-gradient">{{ api.stats()?.recentResults?.[0]?.newItemsCount || 0 }}</div>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <!-- System Control + Today's Schedule -->
        <div class="card glass control-card">
          <div class="flex justify-between items-center mb-6">
            <h3 class="section-title">System Execution</h3>
            <span class="badge" [class.badge-success]="isRunning" [class.badge-danger]="!isRunning">
              {{ isRunning ? 'OPTIMAL' : 'PAUSED' }}
            </span>
          </div>

          <div class="control-actions mb-5">
            <button *ngIf="auth.hasPermission('OP_PAUSE_JOBS')" class="btn-secondary w-full justify-center" (click)="togglePause()">
              <lucide-icon [name]="isPaused ? 'play' : 'pause'" size="18"></lucide-icon>
              {{ isPaused ? 'Resume Background Jobs' : 'Pause All Jobs' }}
            </button>
            <button *ngIf="auth.hasPermission('OP_TRIGGER_SCAN')" class="btn-primary w-full justify-center mt-3" (click)="triggerNow()" [disabled]="isTriggering">
              <lucide-icon name="play" size="18" [class.spin]="isTriggering"></lucide-icon>
              {{ isTriggering ? 'Triggering...' : 'Force Trigger Scan' }}
            </button>
          </div>


          <!-- Today's Schedule Timeline -->
          <div class="schedule-timeline">
            <p class="timeline-label">Today's Schedule</p>

            <div *ngIf="todayEntries.length === 0" class="empty-timeline muted">
              No jobs scheduled for today.
            </div>

            <div *ngFor="let entry of todayEntries"
                 class="timeline-row"
                 [class.status-completed]="entry.status === 'COMPLETED'"
                 [class.status-running]="entry.status === 'RUNNING'"
                 [class.status-upcoming]="entry.status === 'UPCOMING'">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <div class="flex justify-between items-center">
                  <span class="timeline-time">{{ entry.time }}</span>
                  <span class="tl-badge"
                        [class.tl-completed]="entry.status === 'COMPLETED'"
                        [class.tl-running]="entry.status === 'RUNNING'"
                        [class.tl-upcoming]="entry.status === 'UPCOMING'">
                    {{ entry.status }}
                  </span>
                </div>
                <p class="timeline-name muted">{{ entry.name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Output Stream -->
        <div class="card glass terminal-card">
          <div class="flex justify-between items-center terminal-header">
            <div class="flex gap-2 items-center">
              <lucide-icon name="database" size="18" class="text-muted"></lucide-icon>
              <h3 class="section-title mb-0">Live Output Stream</h3>
            </div>
            <div class="flex gap-2 items-center">
              <button class="icon-btn mr-2" (mousedown)="refreshData()" [disabled]="isRefreshing" title="Refresh Now">
                <lucide-icon name="rotate-cw" size="16" [class.spin]="isRefreshing"></lucide-icon>
              </button>
              <div class="flex gap-2">
                <button class="tab-btn" [class.active]="activeLog === 'output'" (click)="loadLog('output')">Latest Results</button>
                <button class="tab-btn" [class.active]="activeLog === 'history'" (click)="loadLog('history')">Scan History</button>
                <button class="tab-btn" [class.active]="activeLog === 'log'" (click)="loadLog('log')">signalPulse.log</button>
              </div>
            </div>
          </div>
          <div class="log-viewer" #scrollContainer>
            <div *ngIf="activeLog === 'history'" class="history-list p-4">
               <table class="w-full text-xs text-left history-table">
                 <thead class="text-muted border-b border-light">
                   <tr>
                     <th class="py-2">Time</th>
                     <th class="py-2">Type</th>
                     <th class="py-2">Found</th>
                     <th class="py-2">Matches</th>
                     <th class="py-2">Duration</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let s of api.stats()?.recentResults" class="border-b border-light/5 hover:bg-white/5">
                     <td class="py-3">{{ s.timestamp | date:'shortTime' }}</td>
                     <td class="py-3">
                       <span class="badge-mini" [class.badge-mini-manual]="s.triggerType === 'MANUAL'">
                         {{ s.triggerType || 'AUTO' }}
                       </span>
                     </td>
                     <td class="py-3">{{ s.articlesFound }}</td>
                     <td class="py-3 text-primary">{{ s.newItemsCount }}</td>
                     <td class="py-3 muted">{{ s.durationMs }}ms</td>
                   </tr>
                 </tbody>
               </table>
            </div>

            <pre *ngIf="activeLog === 'log'"><code>{{ logContent }}</code></pre>
            <div *ngIf="activeLog === 'output'" class="results-list p-4">
              <div *ngIf="api.latestResults().length === 0" class="muted text-center py-8">
                No articles captured in the latest scan.
              </div>
              <div *ngFor="let res of api.latestResults()" class="result-item mb-3">
                <div class="flex items-start gap-3">
                  <lucide-icon name="link-2" size="14" class="mt-1 primary-text"></lucide-icon>
                  <div>
                    <a [href]="res.link" target="_blank" class="res-link font-medium block">{{ res.title || res.link }}</a>
                    <span class="text-xs muted">{{ res.source }} • {{ res.publishedAt | date:'MMM d, h:mm a' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .page-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.25rem; }
    .section-title { font-size: 1.1rem; font-weight: 600; margin: 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .stat-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .primary-bg { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05)); border: 1px solid rgba(99,102,241,0.2); color: var(--primary-color); }
    .success-bg { background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.2); color: var(--success-color); }
    .warning-bg { background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05)); border: 1px solid rgba(245,158,11,0.2); color: var(--warning-color); }

    .stat-body .label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; display: block; }
    .stat-body .value { font-size: 2.2rem; font-weight: 700; line-height: 1.1; color: var(--text-main); }
    .stat-body .unit { font-size: 1rem; color: var(--text-muted); font-weight: 500; margin-left: 4px; }

    .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
    .justify-center { justify-content: center; }

    /* Timeline */
    .schedule-timeline { border-top: 1px solid var(--border-light); padding-top: 1.25rem; }
    .timeline-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-darkest); margin-bottom: 12px; }
    .empty-timeline { font-size: 0.85rem; text-align: center; padding: 1rem 0; }

    .timeline-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; background: var(--border-strong); transition: background 0.3s; }
    .status-completed .timeline-dot { background: var(--success-color); box-shadow: 0 0 6px rgba(16,185,129,0.5); }
    .status-running .timeline-dot { background: var(--warning-color); box-shadow: 0 0 8px rgba(245,158,11,0.6); animation: dotPulse 1.2s ease-in-out infinite; }
    .status-upcoming .timeline-dot { background: var(--text-darkest); }
    @keyframes dotPulse { 0%,100%{ transform: scale(1); opacity:1; } 50%{ transform: scale(1.5); opacity: 0.6; } }

    .timeline-body { flex: 1; min-width: 0; }
    .timeline-time { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
    .timeline-name { font-size: 0.77rem; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .tl-badge { font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 99px; border: 1px solid; letter-spacing: 0.06em; }
    .tl-completed { background: rgba(16,185,129,0.12); color: var(--success-color); border-color: rgba(16,185,129,0.3); }
    .tl-running { background: rgba(245,158,11,0.12); color: var(--warning-color); border-color: rgba(245,158,11,0.3); }
    .tl-upcoming { background: rgba(255,255,255,0.04); color: var(--text-muted); border-color: var(--border-strong); }

    /* Terminal */
    .terminal-card { display: flex; flex-direction: column; padding: 0 !important; overflow: hidden; }
    .terminal-header { padding: 16px 20px; border-bottom: 1px solid var(--border-light); background: rgba(0,0,0,0.3); }
    .log-viewer { 
      background: #0d1117; 
      padding: 20px; 
      overflow-y: auto; 
      height: 480px; 
      max-height: 480px;
      font-family: 'JetBrains Mono', monospace;
      display: block;
    }
    .log-viewer pre { color: #8b949e; font-size: 0.85rem; margin: 0; white-space: pre-wrap; word-break: break-all; }

    .tab-btn { background: transparent; border: none; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); padding: 6px 12px; border-radius: var(--radius-sm); transition: var(--transition); }
    .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .tab-btn.active { background: rgba(99,102,241,0.15); color: var(--primary-color); }

    .icon-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
    .icon-btn:hover { color: var(--text-main); }
    .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .history-table th { font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
    .history-table td { border-bottom: 1px solid rgba(255,255,255,0.05); }
    
    .badge-mini { font-size: 0.6rem; padding: 1px 5px; border-radius: 4px; background: rgba(99,102,241,0.1); color: var(--primary-color); border: 1px solid rgba(99,102,241,0.2); }
    .badge-mini-manual { background: rgba(245,158,11,0.1); color: var(--warning-color); border-color: rgba(245,158,11,0.3); }

    .results-list { height: 100%; overflow-y: auto; }
    .res-link { color: #58a6ff; text-decoration: none; transition: 0.2s; font-size: 0.9rem; }
    .res-link:hover { color: #79c0ff; text-decoration: underline; }
    .text-xs { font-size: 0.75rem; }
    .font-medium { font-weight: 500; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100%{ transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  api = inject(ApiService);
  auth = inject(AuthService);

  isPaused = false;
  isRunning = true;
  isTriggering = false;
  isRefreshing = false;
  activeLog = 'output';
  logContent = 'Loading log stream...';
  todayEntries: { name: string; time: string; timeMins: number; status: 'COMPLETED' | 'RUNNING' | 'UPCOMING'; triggerType?: string }[] = [];

  private readonly DOW_MAP: Record<string, number> = {
    SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
    THURSDAY: 4, FRIDAY: 5, SATURDAY: 6
  };

  ngOnInit() {
    this.api.loadStats();
    this.api.loadFeeds();
    this.api.loadPages();
    this.api.loadSchedules();
    this.api.loadLatestResults();
    this.loadLog('log'); // Default to signalPulse.log as it's more "live"

    // Removed auto-polling setInterval per user request - switching to on-demand loading

    // Wait for schedules to load, then build
    setTimeout(() => this.buildTodayEntries(), 1200);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.activeLog === 'log') {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }
  }

  buildTodayEntries() {
    const now = new Date();
    const todayDow = now.getDay();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const result: typeof this.todayEntries = [];

    for (const s of this.api.schedules()) {
      if (!s.active) continue;
      const days: string[] = s.weeklyDays ?? [];
      const appliesToday =
        days.length === 0 ||
        days.some((d: string) => this.DOW_MAP[d] === todayDow);
      if (!appliesToday) continue;

      for (const rawTime of (s.dailyTimes ?? [])) {
        const parts = rawTime.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) continue;

        const timeMins = h * 60 + m;
        const diff = timeMins - nowMins;
        
        // Skip scheduled items that are in the past if we have actual results for them
        if (diff < -30) continue; 

        let status: 'COMPLETED' | 'RUNNING' | 'UPCOMING';
        if (diff < -5)            status = 'COMPLETED';
        else if (diff <= 5)       status = 'RUNNING';
        else                      status = 'UPCOMING';

        const ampm = h >= 12 ? 'PM' : 'AM';
        const dh = h % 12 === 0 ? 12 : h % 12;
        const dm = m.toString().padStart(2, '0');
        result.push({ name: s.name || 'Unnamed Job', time: `${dh}:${dm} ${ampm}`, timeMins, status, triggerType: 'SCHEDULED' });
      }
    }

    // Add Actual recent scans (Manual and Scheduled)
    const recentScans = this.api.stats()?.recentResults || [];
    for (const scan of recentScans) {
      const scanDate = new Date(scan.timestamp);
      // Only show today's actual scans
      if (scanDate.toDateString() !== now.toDateString()) continue;

      const h = scanDate.getHours();
      const m = scanDate.getMinutes();
      const timeMins = h * 60 + m;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dh = h % 12 === 0 ? 12 : h % 12;
      const dm = m.toString().padStart(2, '0');
      
      result.push({
        name: scan.triggerType === 'MANUAL' ? 'Manual Pulse Trigger' : 'Automated Scan Run',
        time: `${dh}:${dm} ${ampm}`,
        timeMins,
        status: 'COMPLETED',
        triggerType: scan.triggerType
      });
    }

    // Sort and Deduplicate (if an automated scan overlaps with a scheduled slot)
    this.todayEntries = result
      .sort((a, b) => b.timeMins - a.timeMins) // newest first
      .filter((v, i, a) => a.findIndex(t => t.time === v.time && t.name === v.name) === i);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.isRunning = !this.isPaused;
    if (this.isPaused) {
      this.api.pauseJobs().subscribe();
    } else {
      this.api.resumeJobs().subscribe();
    }
  }

  triggerNow() {
    this.isTriggering = true;
    this.api.triggerNow().subscribe({
      next: () => {
        setTimeout(() => {
          this.isTriggering = false;
          this.api.loadStats();
          this.api.loadLatestResults();
          this.loadLog(this.activeLog);
        }, 2000);
      },
      error: () => this.isTriggering = false
    });
  }

  refreshData() {
    this.isRefreshing = true;
    this.buildTodayEntries();
    this.api.loadLatestResults();
    this.api.loadStats();
    
    // Also reload whichever log is active
    if (this.activeLog === 'log') {
      this.api.getArtifact('signalPulse.log').subscribe({
        next: content => {
          this.logContent = content;
          this.isRefreshing = false;
        },
        error: () => this.isRefreshing = false
      });
    } else {
      setTimeout(() => this.isRefreshing = false, 800);
    }
  }

  loadLog(type: string) {
    this.activeLog = type;
    if (type === 'log') {
      this.api.getArtifact('signalPulse.log').subscribe(content => this.logContent = content);
    } else if (type === 'output') {
      this.api.loadLatestResults();
    } else if (type === 'history') {
      this.api.loadStats();
    }
  }
}
