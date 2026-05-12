import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, interval, Subscription, switchMap, take, takeUntil, timer } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ScanResultSummary, ScannedArticle, ScheduleConfig } from '../../core/models';

type ScanStatus = 'COMPLETED' | 'RUNNING' | 'UPCOMING';
interface TimelineEntry {
  name: string;
  time: string;
  timeMins: number;
  status: ScanStatus;
  triggerType?: string;
}

type LogTab = 'output' | 'history' | 'log';

const DOW_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <div class="welcome-section mb-6">
        <h1 class="page-title">Welcome back, {{ auth.currentUser()?.username }} 👋</h1>
        <p class="muted">Here is an overview of the signalPulse today.</p>
      </div>

      <div class="stats-grid mb-6">
        <div class="card glass stat-card">
          <div class="stat-header">
            <div class="icon-wrap primary-bg"><lucide-icon name="database" size="20"></lucide-icon></div>
            <span class="badge badge-success">Sources</span>
          </div>
          <div class="stat-body mt-4">
            <span class="label">Total Managed Sources</span>
            <div class="value">{{ totalSources() }}</div>
          </div>
        </div>

        <div class="card glass stat-card">
          <div class="stat-header">
            <div class="icon-wrap success-bg"><lucide-icon name="activity" size="20"></lucide-icon></div>
          </div>
          <div class="stat-body mt-4">
            <span class="label">Last Scan Duration</span>
            <div class="value">{{ lastDuration() }}<span class="unit">ms</span></div>
          </div>
        </div>

        <div class="card glass stat-card">
          <div class="stat-header">
            <div class="icon-wrap warning-bg"><lucide-icon name="refresh-cw" size="20"></lucide-icon></div>
            <span class="badge badge-success">+New</span>
          </div>
          <div class="stat-body mt-4">
            <span class="label">Latest Scan Matches</span>
            <div class="value text-gradient">{{ lastMatches() }}</div>
          </div>
        </div>
      </div>

      <!-- Insights row: sparkline trend + top sources -->
      <div class="insights-grid mb-6">
        <div class="card glass insights-card">
          <div class="flex justify-between items-center mb-3">
            <div class="flex gap-2 items-center">
              <lucide-icon name="trending-up" size="18" class="primary-text"></lucide-icon>
              <h3 class="section-title mb-0">Scan Duration Trend</h3>
            </div>
            <span class="muted text-xs">last {{ durationTrend().length }} scans</span>
          </div>
          @if (durationTrend().length >= 2) {
            <svg [attr.viewBox]="'0 0 ' + sparklineWidth + ' ' + sparklineHeight" preserveAspectRatio="none" class="sparkline">
              <defs>
                <linearGradient [attr.id]="sparkGradientId" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary-color)" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="var(--primary-color)" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path [attr.d]="sparklineAreaPath()" [attr.fill]="'url(#' + sparkGradientId + ')'" stroke="none"></path>
              <polyline [attr.points]="sparklinePoints()" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>
              @for (p of sparklineDots(); track $index) {
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="var(--primary-color)">
                  <title>{{ p.label }}</title>
                </circle>
              }
            </svg>
            <div class="trend-meta">
              <div class="meta-item">
                <span class="muted">avg</span>
                <strong>{{ trendStats().avg | number:'1.0-0' }}ms</strong>
              </div>
              <div class="meta-item">
                <span class="muted">peak</span>
                <strong>{{ trendStats().peak | number:'1.0-0' }}ms</strong>
              </div>
              <div class="meta-item">
                <span class="muted">change</span>
                <strong [class.success-text]="trendStats().delta < 0" [class.danger-text]="trendStats().delta > 0">
                  {{ trendStats().delta > 0 ? '+' : '' }}{{ trendStats().delta | number:'1.0-0' }}ms
                </strong>
              </div>
            </div>
          } @else {
            <div class="empty-state muted">Waiting for more scans to chart…</div>
          }
        </div>

        <div class="card glass insights-card">
          <div class="flex justify-between items-center mb-3">
            <div class="flex gap-2 items-center">
              <lucide-icon name="bar-chart-3" size="18" class="primary-text"></lucide-icon>
              <h3 class="section-title mb-0">Top Sources</h3>
            </div>
            <span class="muted text-xs">latest results</span>
          </div>
          @if (topSources().length === 0) {
            <div class="empty-state muted">No articles captured yet.</div>
          } @else {
            <div class="top-sources">
              @for (s of topSources(); track s.source) {
                <div class="source-row">
                  <div class="source-name" [title]="s.source">{{ s.source }}</div>
                  <div class="source-bar">
                    <div class="source-fill" [style.width.%]="(s.count / topSources()[0].count) * 100"></div>
                  </div>
                  <div class="source-count">{{ s.count }}</div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="main-grid">
        <div class="card glass control-card">
          <div class="flex justify-between items-center mb-6">
            <h3 class="section-title">System Execution</h3>
            <div class="flex gap-2 items-center">
              <button class="auto-refresh-toggle"
                      [class.on]="autoRefresh()"
                      (click)="toggleAutoRefresh()"
                      [title]="autoRefresh() ? 'Live refresh on (every 15s)' : 'Enable live refresh'">
                <lucide-icon name="zap" size="14"></lucide-icon>
                <span>{{ autoRefresh() ? 'LIVE' : 'PAUSED' }}</span>
              </button>
              <span class="badge" [class.badge-success]="isRunning()" [class.badge-danger]="!isRunning()">
                {{ isRunning() ? 'OPTIMAL' : 'PAUSED' }}
              </span>
            </div>
          </div>

          <div class="control-actions mb-5">
            <button *ngIf="auth.hasPermission('OP_PAUSE_JOBS')" class="btn-secondary w-full justify-center" (click)="togglePause()">
              <lucide-icon [name]="isPaused() ? 'play' : 'pause'" size="18"></lucide-icon>
              {{ isPaused() ? 'Resume Background Jobs' : 'Pause All Jobs' }}
            </button>
            <button *ngIf="auth.hasPermission('OP_TRIGGER_SCAN')" class="btn-primary w-full justify-center mt-3" (click)="triggerNow()" [disabled]="isTriggering()">
              <lucide-icon name="play" size="18" [class.spin]="isTriggering()"></lucide-icon>
              {{ isTriggering() ? 'Triggering...' : 'Force Trigger Scan' }}
            </button>
          </div>

          <div class="schedule-timeline">
            <p class="timeline-label">Today's Schedule</p>
            @if (todayEntries().length === 0) {
              <div class="empty-timeline muted">No jobs scheduled for today.</div>
            }
            @for (entry of todayEntries(); track entry.time + entry.name) {
              <div class="timeline-row"
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
            }
          </div>
        </div>

        <div class="card glass terminal-card">
          <div class="flex justify-between items-center terminal-header">
            <div class="flex gap-2 items-center">
              <lucide-icon name="database" size="18" class="text-muted"></lucide-icon>
              <h3 class="section-title mb-0">Live Output Stream</h3>
            </div>
            <div class="flex gap-2 items-center">
              <button class="icon-btn mr-2" (mousedown)="refreshData()" [disabled]="isRefreshing()" title="Refresh Now">
                <lucide-icon name="rotate-cw" size="16" [class.spin]="isRefreshing()"></lucide-icon>
              </button>
              <div class="flex gap-2">
                <button class="tab-btn" [class.active]="activeLog() === 'output'" (click)="loadLog('output')">Latest Results</button>
                <button class="tab-btn" [class.active]="activeLog() === 'history'" (click)="loadLog('history')">Scan History</button>
                <button class="tab-btn" [class.active]="activeLog() === 'log'" (click)="loadLog('log')">signalPulse.log</button>
              </div>
            </div>
          </div>
          <div class="log-viewer" #scrollContainer>
            @if (activeLog() === 'history') {
              <div class="history-list p-4">
                <table class="w-full text-xs text-left history-table">
                  <thead class="text-muted border-b border-light">
                    <tr><th class="py-2">Time</th><th class="py-2">Type</th><th class="py-2">Found</th><th class="py-2">Matches</th><th class="py-2">Duration</th></tr>
                  </thead>
                  <tbody>
                    @for (s of recentResults(); track s.id) {
                      <tr class="border-b border-light/5 hover:bg-white/5">
                        <td class="py-3">{{ s.timestamp | date:'medium' }}</td>
                        <td class="py-3">
                          <span class="badge-mini" [class.badge-mini-manual]="s.triggerType === 'MANUAL'">
                            {{ s.triggerType || 'AUTO' }}
                          </span>
                        </td>
                        <td class="py-3">{{ s.articlesFound }}</td>
                        <td class="py-3 text-primary">{{ s.newItemsCount }}</td>
                        <td class="py-3 muted">{{ s.durationMs }}ms</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            @if (activeLog() === 'log') {
              <pre><code>{{ logContent() }}</code></pre>
            }
            @if (activeLog() === 'output') {
              <div class="results-list p-4">
                @if (api.latestResults().length === 0) {
                  <div class="muted text-center py-8">No articles captured in the latest scan.</div>
                }
                @for (res of api.latestResults(); track res.link) {
                  <div class="result-item mb-3">
                    <div class="flex items-start gap-3">
                      <lucide-icon name="link-2" size="14" class="mt-1 primary-text"></lucide-icon>
                      <div>
                        <a [href]="res.link" target="_blank" rel="noopener noreferrer" class="res-link font-medium block">{{ res.title || res.link }}</a>
                        <span class="text-xs muted">{{ res.source }} • {{ res.publishedAt | date:'MMM d, h:mm a' }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
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
    .insights-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; }
    .insights-card { padding: 1.25rem 1.5rem; }
    .sparkline { width: 100%; height: 80px; display: block; }
    .trend-meta { display: flex; gap: 1.5rem; margin-top: 8px; font-size: 0.8rem; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-item strong { font-size: 0.95rem; color: var(--text-main); }
    .empty-state { font-size: 0.85rem; text-align: center; padding: 1.5rem 0; }
    .top-sources { display: flex; flex-direction: column; gap: 8px; }
    .source-row { display: grid; grid-template-columns: 1fr 100px 32px; gap: 12px; align-items: center; font-size: 0.85rem; }
    .source-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); font-weight: 500; }
    .source-bar { height: 8px; background: var(--surface-active); border-radius: 99px; overflow: hidden; }
    .source-fill { height: 100%; background: linear-gradient(90deg, var(--primary-color), var(--primary-hover)); border-radius: 99px; transition: width 0.4s ease; }
    .source-count { text-align: right; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .auto-refresh-toggle { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; border: 1px solid var(--border-strong); background: transparent; color: var(--text-muted); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; transition: var(--transition); }
    .auto-refresh-toggle.on { background: rgba(var(--primary-rgb), 0.12); color: var(--primary-color); border-color: rgba(var(--primary-rgb), 0.3); box-shadow: 0 0 12px rgba(var(--primary-rgb), 0.25); }
    .auto-refresh-toggle:hover { color: var(--text-main); }
    .auto-refresh-toggle.on:hover { color: var(--primary-color); }
    .stat-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .primary-bg { background: linear-gradient(135deg, rgba(var(--primary-rgb),0.2), rgba(var(--primary-rgb),0.05)); border: 1px solid rgba(var(--primary-rgb),0.2); color: var(--primary-color); }
    .success-bg { background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.2); color: var(--success-color); }
    .warning-bg { background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05)); border: 1px solid rgba(245,158,11,0.2); color: var(--warning-color); }
    .stat-body .label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; display: block; }
    .stat-body .value { font-size: 2.2rem; font-weight: 700; line-height: 1.1; color: var(--text-main); }
    .stat-body .unit { font-size: 1rem; color: var(--text-muted); font-weight: 500; margin-left: 4px; }
    .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
    .justify-center { justify-content: center; }
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
    .terminal-card { display: flex; flex-direction: column; padding: 0 !important; overflow: hidden; }
    .terminal-header { padding: 16px 20px; border-bottom: 1px solid var(--border-light); background: var(--table-header-bg); }
    .log-viewer { background: var(--log-bg); color: var(--log-fg); padding: 20px; overflow-y: auto; height: 480px; max-height: 480px; font-family: 'JetBrains Mono', monospace; display: block; }
    .log-viewer pre { color: var(--log-fg); font-size: 0.85rem; margin: 0; white-space: pre-wrap; word-break: break-all; }
    /* Log viewer is always a terminal surface (dark) — force readable text
       colors regardless of the active app theme. */
    .log-viewer .muted { color: rgba(255, 255, 255, 0.55); }
    .log-viewer th, .log-viewer td { color: var(--log-fg); border-bottom-color: rgba(255, 255, 255, 0.05); }
    .log-viewer th { background: rgba(255, 255, 255, 0.04); color: rgba(255, 255, 255, 0.7); }
    .log-viewer tr:hover td { background: rgba(255, 255, 255, 0.04); }
    .log-viewer .text-primary { color: #f87171; }
    .log-viewer .res-link { color: var(--link-color); }
    .tab-btn { background: transparent; border: none; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); padding: 6px 12px; border-radius: var(--radius-sm); transition: var(--transition); }
    .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .tab-btn.active { background: rgba(var(--primary-rgb),0.15); color: var(--primary-color); }
    .icon-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
    .icon-btn:hover { color: var(--text-main); }
    .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .history-table th { font-weight: 600; text-transform: uppercase; }
    .history-table td { border-bottom: 1px solid rgba(255,255,255,0.05); }
    .badge-mini { font-size: 0.6rem; padding: 1px 5px; border-radius: 4px; background: rgba(var(--primary-rgb),0.1); color: var(--primary-color); border: 1px solid rgba(var(--primary-rgb),0.2); }
    .badge-mini-manual { background: rgba(245,158,11,0.1); color: var(--warning-color); border-color: rgba(245,158,11,0.3); }
    .results-list { height: 100%; overflow-y: auto; }
    .res-link { color: var(--link-color); text-decoration: none; transition: 0.2s; font-size: 0.9rem; }
    .res-link:hover { color: var(--link-hover); text-decoration: underline; }
    .text-xs { font-size: 0.75rem; }
    .font-medium { font-weight: 500; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100%{ transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLElement>;
  api = inject(ApiService);
  auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // UI state
  isPaused = signal(false);
  isRunning = signal(true);
  isTriggering = signal(false);
  isRefreshing = signal(false);
  activeLog = signal<LogTab>('output');
  logContent = signal('Loading log stream...');

  // Derived signals from api state — avoids template re-evaluation thrash
  totalSources = computed(() => this.api.feeds().length + this.api.pages().length);
  recentResults = computed<ScanResultSummary[]>(() => this.api.stats()?.recentResults ?? []);
  lastDuration = computed(() => this.recentResults()[0]?.durationMs ?? 0);
  lastMatches = computed(() => this.recentResults()[0]?.newItemsCount ?? 0);
  todayEntries = signal<TimelineEntry[]>([]);

  // ---- Auto-refresh ----
  autoRefresh = signal(false);
  private autoRefreshSub?: Subscription;
  private readonly AUTO_REFRESH_MS = 15_000;

  // ---- Sparkline ----
  readonly sparklineWidth = 320;
  readonly sparklineHeight = 80;
  readonly sparkGradientId = 'spark-grad-' + Math.random().toString(36).slice(2, 8);

  /** Most-recent N durations in chronological order (oldest -> newest). */
  durationTrend = computed<number[]>(() =>
    [...this.recentResults()]
      .reverse()
      .map(r => r.durationMs ?? 0)
      .filter(v => v > 0)
  );

  private sparkPoints = computed<{ x: number; y: number; label: string }[]>(() => {
    const values = this.durationTrend();
    if (values.length < 2) return [];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(1, max - min);
    const stepX = this.sparklineWidth / (values.length - 1);
    const padY = 6;
    const usableH = this.sparklineHeight - padY * 2;
    return values.map((v, i) => ({
      x: +(i * stepX).toFixed(1),
      y: +(padY + usableH - ((v - min) / range) * usableH).toFixed(1),
      label: v + 'ms',
    }));
  });

  sparklinePoints = computed(() => this.sparkPoints().map(p => `${p.x},${p.y}`).join(' '));
  sparklineDots = computed(() => this.sparkPoints());
  sparklineAreaPath = computed(() => {
    const pts = this.sparkPoints();
    if (pts.length < 2) return '';
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${path} L ${pts[pts.length - 1].x} ${this.sparklineHeight} L ${pts[0].x} ${this.sparklineHeight} Z`;
  });

  trendStats = computed(() => {
    const values = this.durationTrend();
    if (values.length === 0) return { avg: 0, peak: 0, delta: 0 };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const peak = Math.max(...values);
    const delta = values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0;
    return { avg, peak, delta };
  });

  // ---- Top sources from latest results ----
  topSources = computed<{ source: string; count: number }[]>(() => {
    const counts = new Map<string, number>();
    for (const a of this.api.latestResults() as ScannedArticle[]) {
      if (!a.source) continue;
      counts.set(a.source, (counts.get(a.source) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  /** Set whenever logContent / activeLog changes so we scroll on the next view check, then reset. */
  private pendingScrollToBottom = false;

  constructor() {
    // Recompute schedule timeline whenever schedules or stats change.
    effect(() => {
      this.buildTodayEntries(this.api.schedules(), this.recentResults());
    });
    // Mark for scroll only when the log tab is showing and content changed.
    effect(() => {
      const content = this.logContent();
      const tab = this.activeLog();
      if (tab === 'log' && content) {
        untracked(() => { this.pendingScrollToBottom = true; });
      }
    });
  }

  ngOnInit(): void {
    this.api.loadStats();
    this.api.loadFeeds();
    this.api.loadPages();
    this.api.loadSchedules();
    this.api.loadLatestResults();
    this.loadLog('log');
  }

  ngAfterViewChecked(): void {
    if (!this.pendingScrollToBottom) return;
    this.pendingScrollToBottom = false;
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  private buildTodayEntries(schedules: ScheduleConfig[], recent: ScanResultSummary[]): void {
    const now = new Date();
    const todayDow = now.getDay();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const result: TimelineEntry[] = [];

    for (const s of schedules) {
      if (!s.active) continue;
      const days = s.weeklyDays ?? [];
      const appliesToday = days.length === 0 || days.some(d => DOW_MAP[d] === todayDow);
      if (!appliesToday) continue;

      for (const rawTime of s.dailyTimes ?? []) {
        const [hStr, mStr] = rawTime.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (Number.isNaN(h) || Number.isNaN(m)) continue;
        const timeMins = h * 60 + m;
        const diff = timeMins - nowMins;
        if (diff < -30) continue;

        const status: ScanStatus = diff < -5 ? 'COMPLETED' : diff <= 5 ? 'RUNNING' : 'UPCOMING';
        result.push({ name: s.name || 'Unnamed Job', time: this.format12(h, m), timeMins, status, triggerType: 'SCHEDULED' });
      }
    }

    for (const scan of recent) {
      const scanDate = new Date(scan.timestamp);
      if (scanDate.toDateString() !== now.toDateString()) continue;
      const h = scanDate.getHours();
      const m = scanDate.getMinutes();
      result.push({
        name: scan.triggerType === 'MANUAL' ? 'Manual Pulse Trigger' : 'Automated Scan Run',
        time: this.format12(h, m),
        timeMins: h * 60 + m,
        status: 'COMPLETED',
        triggerType: scan.triggerType,
      });
    }

    const dedup = result
      .sort((a, b) => b.timeMins - a.timeMins)
      .filter((v, i, a) => a.findIndex(t => t.time === v.time && t.name === v.name) === i);
    this.todayEntries.set(dedup);
  }

  private format12(h: number, m: number): string {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    const dm = m.toString().padStart(2, '0');
    return `${dh}:${dm} ${ampm}`;
  }

  togglePause(): void {
    const next = !this.isPaused();
    this.isPaused.set(next);
    this.isRunning.set(!next);
    (next ? this.api.pauseJobs() : this.api.resumeJobs())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: err => console.error('togglePause failed', err) });
  }

  toggleAutoRefresh(): void {
    const next = !this.autoRefresh();
    this.autoRefresh.set(next);
    if (next) {
      this.autoRefreshSub = interval(this.AUTO_REFRESH_MS)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.api.loadStats();
          this.api.loadLatestResults();
        });
    } else {
      this.autoRefreshSub?.unsubscribe();
      this.autoRefreshSub = undefined;
    }
  }

  triggerNow(): void {
    if (this.isTriggering()) return;
    this.isTriggering.set(true);
    const lastSeenId = this.recentResults()[0]?.id ?? null;
    this.api.triggerNow().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.waitForNewScan(lastSeenId),
      error: () => this.isTriggering.set(false),
    });
  }

  /**
   * Poll dashboard stats until a brand-new ScanResult appears (its id differs
   * from the one we saw before triggering) or we hit the timeout cap.
   */
  private waitForNewScan(beforeId: number | null): void {
    const pollMs = 3000;
    const maxWaitMs = 120_000;
    interval(pollMs).pipe(
      switchMap(() => this.api.fetchStats()),
      filter(stats => {
        const newest = stats?.recentResults?.[0];
        return !!newest && newest.id !== beforeId;
      }),
      take(1),
      takeUntil(timer(maxWaitMs)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      complete: () => {
        this.isTriggering.set(false);
        this.api.loadLatestResults();
        if (this.activeLog() === 'log') this.refreshLog();
      },
    });
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    this.api.loadLatestResults();
    this.api.loadStats();
    if (this.activeLog() === 'log') {
      this.refreshLog().then(() => this.isRefreshing.set(false), () => this.isRefreshing.set(false));
    } else {
      setTimeout(() => this.isRefreshing.set(false), 600);
    }
  }

  loadLog(type: LogTab): void {
    this.activeLog.set(type);
    if (type === 'log') {
      this.refreshLog();
    } else if (type === 'output') {
      this.api.loadLatestResults();
    } else {
      this.api.loadStats();
    }
  }

  private refreshLog(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.getArtifact('signalPulse.log').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: content => { this.logContent.set(content); resolve(); },
        error: err => { console.error('log fetch failed', err); reject(err); },
      });
    });
  }
}
