import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Category,
  CategoryRequest,
  DashboardStats,
  Feed,
  FeedRequest,
  HtmlPage,
  HtmlPagePreview,
  HtmlPageRequest,
  PageResponse,
  Privilege,
  Role,
  RoleRequest,
  ScanResultSummary,
  ScannedArticle,
  ScheduleConfig,
  TopicRule,
  User,
  UserRequest,
} from '../models';

interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl =
    (environment.ADMIN_ENDPOINT.endsWith('/')
      ? environment.ADMIN_ENDPOINT
      : environment.ADMIN_ENDPOINT + '/') + 'api/v1';

  // Typed state
  feeds = signal<Feed[]>([]);
  pages = signal<HtmlPage[]>([]);
  topics = signal<TopicRule[]>([]);
  categories = signal<Category[]>([]);
  history = signal<ScanResultSummary[]>([]);
  schedules = signal<ScheduleConfig[]>([]);
  stats = signal<DashboardStats | null>(null);
  configs = signal<Record<string, string> | null>(null);
  latestResults = signal<ScannedArticle[]>([]);

  // ---- helpers ----
  private buildParams(p: PageParams): HttpParams {
    let params = new HttpParams();
    if (p.page != null) params = params.set('page', String(p.page));
    if (p.size != null) params = params.set('size', String(p.size));
    if (p.sort) params = params.set('sort', p.sort);
    return params;
  }

  private logError(label: string) {
    return (err: unknown): Observable<never[]> => {
      console.error(`[ApiService] ${label} failed`, err);
      return of([]);
    };
  }

  // ---- RSS Feeds ----
  loadFeeds(params: PageParams = {}): void {
    this.http
      .get<PageResponse<Feed>>(`${this.baseUrl}/feeds`, { params: this.buildParams(params) })
      .pipe(
        map(r => r.content ?? []),
        catchError(this.logError('loadFeeds')),
        tap(content => this.feeds.set(content as Feed[]))
      )
      .subscribe();
  }
  saveFeed(feed: FeedRequest) { return this.http.post<Feed>(`${this.baseUrl}/feeds`, feed); }
  deleteFeed(id: number) { return this.http.delete<void>(`${this.baseUrl}/feeds/${id}`); }

  loadCategories(params: PageParams = {}): void {
    this.http
      .get<PageResponse<Category>>(`${this.baseUrl}/feeds/categories`, { params: this.buildParams(params) })
      .pipe(
        map(r => r.content ?? []),
        catchError(this.logError('loadCategories')),
        tap(content => this.categories.set(content as Category[]))
      )
      .subscribe();
  }
  saveCategory(category: CategoryRequest) { return this.http.post<Category>(`${this.baseUrl}/feeds/categories`, category); }
  deleteCategory(id: number) { return this.http.delete<void>(`${this.baseUrl}/feeds/categories/${id}`); }

  // ---- HTML Pages ----
  loadPages(params: PageParams = {}): void {
    this.http
      .get<PageResponse<HtmlPage>>(`${this.baseUrl}/pages`, { params: this.buildParams(params) })
      .pipe(
        map(r => r.content ?? []),
        catchError(this.logError('loadPages')),
        tap(content => this.pages.set(content as HtmlPage[]))
      )
      .subscribe();
  }
  savePage(page: HtmlPageRequest) { return this.http.post<HtmlPage>(`${this.baseUrl}/pages`, page); }
  deletePage(id: number) { return this.http.delete<void>(`${this.baseUrl}/pages/${id}`); }
  previewPage(payload: { url: string; discoveryMode: 'auto' | 'manual'; listSelector?: string; titleSelector?: string; linkSelector?: string }) {
    return this.http.post<HtmlPagePreview>(`${this.baseUrl}/pages/preview`, payload);
  }

  // ---- Topic Rules ----
  loadTopics(params: PageParams = {}): void {
    this.http
      .get<PageResponse<TopicRule>>(`${this.baseUrl}/topics`, { params: this.buildParams(params) })
      .pipe(
        map(r => r.content ?? []),
        catchError(this.logError('loadTopics')),
        tap(content => this.topics.set(content as TopicRule[]))
      )
      .subscribe();
  }
  saveTopic(topic: TopicRule) { return this.http.post<TopicRule>(`${this.baseUrl}/topics`, topic); }
  deleteTopic(id: number) { return this.http.delete<void>(`${this.baseUrl}/topics/${id}`); }

  // ---- Schedules ----
  loadSchedules(params: PageParams = {}): void {
    this.http
      .get<PageResponse<ScheduleConfig>>(`${this.baseUrl}/configs`, { params: this.buildParams(params) })
      .pipe(
        map(r => r.content ?? []),
        catchError(this.logError('loadSchedules')),
        tap(content => this.schedules.set(content as ScheduleConfig[]))
      )
      .subscribe();
  }
  saveSchedule(schedule: ScheduleConfig) { return this.http.post<ScheduleConfig>(`${this.baseUrl}/configs`, schedule); }
  deleteSchedule(id: number) { return this.http.delete<void>(`${this.baseUrl}/configs/${id}`); }

  // ---- Dashboard ----
  loadHistory(): void {
    this.http
      .get<ScanResultSummary[]>(`${this.baseUrl}/articles/history`)
      .pipe(
        catchError(this.logError('loadHistory')),
        tap(content => this.history.set(content as ScanResultSummary[]))
      )
      .subscribe();
  }
  /**
   * Subscribe-and-forget version used during normal page loads.
   * Use {@link fetchStats} when you need to await the response (e.g. for polling).
   */
  loadStats(): void {
    this.fetchStats().subscribe();
  }

  /** Returns an observable that updates the `stats` signal as a side effect. */
  fetchStats(): Observable<DashboardStats | null> {
    return this.http
      .get<DashboardStats>(`${this.baseUrl}/dashboard/stats`)
      .pipe(
        catchError(err => { console.error('[ApiService] fetchStats failed', err); return of(null); }),
        tap(stats => this.stats.set(stats))
      );
  }
  loadLatestResults(): void {
    this.http
      .get<ScannedArticle[]>(`${this.baseUrl}/dashboard/latest-results`)
      .pipe(
        catchError(this.logError('loadLatestResults')),
        tap(content => this.latestResults.set(content as ScannedArticle[]))
      )
      .subscribe();
  }

  // ---- System ----
  triggerNow() { return this.http.post<void>(`${this.baseUrl}/system/trigger-now`, {}); }
  pauseJobs() { return this.http.post<void>(`${this.baseUrl}/system/pause-jobs`, {}); }
  resumeJobs() { return this.http.post<void>(`${this.baseUrl}/system/resume-jobs`, {}); }

  getArtifact(name: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/artifacts/${encodeURIComponent(name)}`, { responseType: 'text' });
  }

  // ---- Config ----
  loadConfigs(): void {
    this.http
      .get<Record<string, string>>(`${this.baseUrl}/config`)
      .pipe(
        catchError(err => { console.error('[ApiService] loadConfigs failed', err); return of(null); }),
        tap(configs => this.configs.set(configs))
      )
      .subscribe();
  }
  saveConfigs(configs: Record<string, string>) {
    return this.http.post<void>(`${this.baseUrl}/config`, configs);
  }

  // ---- Users & Roles ----
  loadUsers(): Observable<User[]> {
    return this.http
      .get<PageResponse<User>>(`${this.baseUrl}/users`)
      .pipe(map(r => r.content ?? []));
  }
  saveUser(user: UserRequest) { return this.http.post<User>(`${this.baseUrl}/users`, user); }
  deleteUser(id: number) { return this.http.delete<void>(`${this.baseUrl}/users/${id}`); }

  loadRoles(): Observable<Role[]> {
    return this.http
      .get<PageResponse<Role>>(`${this.baseUrl}/roles`)
      .pipe(map(r => r.content ?? []));
  }
  saveRole(role: RoleRequest) { return this.http.post<Role>(`${this.baseUrl}/roles`, role); }
  deleteRole(id: number) { return this.http.delete<void>(`${this.baseUrl}/roles/${id}`); }
  loadPrivileges(): Observable<Privilege[]> {
    return this.http.get<Privilege[]>(`${this.baseUrl}/roles/privileges`);
  }
}
