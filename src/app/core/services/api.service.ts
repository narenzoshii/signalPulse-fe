import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:9090/api/v1';

  // State using Signals
  feeds = signal<any[]>([]);
  pages = signal<any[]>([]);
  topics = signal<any[]>([]);
  categories = signal<any[]>([]);
  history = signal<any[]>([]);
  schedules = signal<any[]>([]);
  stats = signal<any>(null);
  configs = signal<any>(null);
  latestResults = signal<any[]>([]);

  // RSS Feeds
  loadFeeds() {
    this.http.get<any[]>(`${this.baseUrl}/feeds`).subscribe(data => this.feeds.set(data));
  }
  saveFeed(feed: any) { return this.http.post(`${this.baseUrl}/feeds`, feed); }
  deleteFeed(id: number) { return this.http.delete(`${this.baseUrl}/feeds/${id}`); }
  loadCategories() {
    this.http.get<any[]>(`${this.baseUrl}/feeds/categories`).subscribe(data => this.categories.set(data));
  }
  saveCategory(category: any) { return this.http.post(`${this.baseUrl}/feeds/categories`, category); }
  deleteCategory(id: number) { return this.http.delete(`${this.baseUrl}/feeds/categories/${id}`); }

  // HTML Pages
  loadPages() {
    this.http.get<any[]>(`${this.baseUrl}/pages`).subscribe(data => this.pages.set(data));
  }
  savePage(page: any) { return this.http.post(`${this.baseUrl}/pages`, page); }
  deletePage(id: number) { return this.http.delete(`${this.baseUrl}/pages/${id}`); }

  // Topic Rules
  loadTopics() {
    this.http.get<any[]>(`${this.baseUrl}/topics`).subscribe(data => this.topics.set(data));
  }
  saveTopic(topic: any) { return this.http.post(`${this.baseUrl}/topics`, topic); }
  deleteTopic(id: number) { return this.http.delete(`${this.baseUrl}/topics/${id}`); }

  // Schedules
  loadSchedules() {
    this.http.get<any[]>(`${this.baseUrl}/configs`).subscribe(data => this.schedules.set(data));
  }
  saveSchedule(schedule: any) { return this.http.post(`${this.baseUrl}/configs`, schedule); }
  deleteSchedule(id: number) { return this.http.delete(`${this.baseUrl}/configs/${id}`); }

  // History & Dashboard
  loadHistory() {
    this.http.get<any[]>(`${this.baseUrl}/history`).subscribe(data => this.history.set(data));
  }
  loadStats() {
    this.http.get<any>(`${this.baseUrl}/dashboard/stats`).subscribe(data => this.stats.set(data));
  }

  // System & Artifacts
  triggerNow() { return this.http.post(`${this.baseUrl}/system/trigger-now`, {}); }
  pauseJobs() { return this.http.post(`${this.baseUrl}/system/pause-jobs`, {}); }
  resumeJobs() { return this.http.post(`${this.baseUrl}/system/resume-jobs`, {}); }
  
  getArtifact(name: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/artifacts/${name}`, { responseType: 'text' });
  }

  loadConfigs() {
    this.http.get<any>(`${this.baseUrl}/config`).subscribe(data => this.configs.set(data));
  }
  loadLatestResults() {
    this.http.get<any[]>(`${this.baseUrl}/dashboard/latest-results`).subscribe(data => this.latestResults.set(data));
  }
  saveConfigs(configs: any) {
    return this.http.post(`${this.baseUrl}/config`, configs);
  }

  // Users & Roles
  loadUsers() { return this.http.get<any[]>(`${this.baseUrl}/users`); }
  saveUser(user: any) { return this.http.post(`${this.baseUrl}/users`, user); }
  deleteUser(id: number) { return this.http.delete(`${this.baseUrl}/users/${id}`); }

  loadRoles() { return this.http.get<any[]>(`${this.baseUrl}/roles`); }
  saveRole(role: any) { return this.http.post(`${this.baseUrl}/roles`, role); }
  deleteRole(id: number) { return this.http.delete(`${this.baseUrl}/roles/${id}`); }
  loadPrivileges() { return this.http.get<any[]>(`${this.baseUrl}/roles/privileges`); }
}

