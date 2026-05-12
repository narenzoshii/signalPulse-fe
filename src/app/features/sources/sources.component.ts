import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Category,
  CategoryRequest,
  Feed,
  FeedRequest,
  HtmlPage,
  HtmlPageRequest,
  TopicRule,
} from '../../core/models';

type Tab = 'rss' | 'html' | 'topics' | 'categories';

@Component({
  selector: 'app-sources',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="sources-container">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="page-title mb-1">Source Configuration</h1>
          <p class="muted">Manage RSS feeds, web scrapers, and topic weighting rules.</p>
        </div>
      </div>

      <div class="premium-tabs mb-6">
        <button class="tab" [class.active]="activeTab() === 'rss'" (click)="activeTab.set('rss')">
          <lucide-icon name="rss" size="16"></lucide-icon> RSS Feeds
        </button>
        <button class="tab" [class.active]="activeTab() === 'html'" (click)="activeTab.set('html')">
          <lucide-icon name="globe" size="16"></lucide-icon> HTML Pages
        </button>
        <button class="tab" [class.active]="activeTab() === 'topics'" (click)="activeTab.set('topics')">
          <lucide-icon name="hash" size="16"></lucide-icon> Topic Rules
        </button>
        <button class="tab" [class.active]="activeTab() === 'categories'" (click)="activeTab.set('categories')">
          <lucide-icon name="layers" size="16"></lucide-icon> Categories
        </button>
      </div>

      <div class="card glass main-card">
        @if (activeTab() === 'rss') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Configured Feeds</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="btn-primary" (click)="openCreate('rss')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Feed
            </button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Status</th><th>Name</th><th>Category</th><th>URL</th><th>Trust</th><th class="text-right">Actions</th>
              </tr></thead>
              <tbody>
                @for (feed of api.feeds(); track feed.id) {
                  <tr>
                    <td>
                      <button [disabled]="!auth.hasPermission('OP_WRITE_SOURCES')" class="toggle-btn" [class.toggle-on]="feed.enabled" (click)="toggleFeed(feed)">
                        <span class="toggle-knob"></span>
                      </button>
                    </td>
                    <td class="font-medium">{{ feed.name }}</td>
                    <td><span class="badge badge-neutral bg-none">{{ feed.category?.name || 'Uncategorized' }}</span></td>
                    <td class="muted text-sm url-cell" [title]="feed.url">{{ feed.url }}</td>
                    <td><span class="badge badge-neutral bg-none">{{ feed.trust | number:'1.2-2' }}</span></td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn mr-1" (click)="openEdit('rss', feed)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn danger" (click)="confirmDelete('rss', feed)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                    </td>
                  </tr>
                }
                @if (api.feeds().length === 0) {
                  <tr><td colspan="6" class="text-center py-6 muted">No feeds configured yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (activeTab() === 'html') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Targeted Pages</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="btn-primary" (click)="openCreate('html')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Source
            </button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Status</th><th>Name</th><th>Category</th><th>URL</th><th>Type</th><th>Selectors</th><th>Trust</th><th class="text-right">Actions</th>
              </tr></thead>
              <tbody>
                @for (page of api.pages(); track page.id) {
                  <tr>
                    <td>
                      <button [disabled]="!auth.hasPermission('OP_WRITE_SOURCES')" class="toggle-btn" [class.toggle-on]="page.enabled" (click)="togglePage(page)">
                        <span class="toggle-knob"></span>
                      </button>
                    </td>
                    <td class="font-medium">{{ page.name }}</td>
                    <td><span class="badge badge-neutral bg-none">{{ page.category?.name || 'Uncategorized' }}</span></td>
                    <td class="muted text-sm url-cell" [title]="page.url">{{ page.url }}</td>
                    <td><span class="badge badge-neutral bg-none" style="font-size:0.7rem;">{{ page.type || 'html_list' }}</span></td>
                    <td class="text-sm">
                      <div class="muted">List: <code>{{ page.listSelector }}</code></div>
                      <div class="muted">Link: <code>{{ page.linkSelector || 'N/A' }}</code></div>
                    </td>
                    <td><span class="badge badge-neutral bg-none">{{ page.trust | number:'1.2-2' }}</span></td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn mr-1" (click)="openEdit('html', page)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn danger" (click)="confirmDelete('html', page)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                    </td>
                  </tr>
                }
                @if (api.pages().length === 0) {
                  <tr><td colspan="8" class="text-center py-6 muted">No pages configured yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (activeTab() === 'topics') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Scoring Rules</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_RULES')" class="btn-primary" (click)="openCreate('topics')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Rule
            </button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Status</th><th>Topic Keyword</th><th>Regex Pattern</th><th>Weight</th><th class="text-right">Actions</th>
              </tr></thead>
              <tbody>
                @for (topic of api.topics(); track topic.id) {
                  <tr>
                    <td>
                      <button class="toggle-btn" [class.toggle-on]="topic.active" (click)="toggleTopic(topic)">
                        <span class="toggle-knob"></span>
                      </button>
                    </td>
                    <td class="font-medium primary-text">#{{ topic.topicKey }}</td>
                    <td class="muted text-sm"><code>{{ topic.patterns.join(' | ') }}</code></td>
                    <td>
                      <span class="badge" [class.badge-success]="topic.weight > 1" [class.badge-danger]="topic.weight < 1">
                        {{ topic.weight | number:'1.2-2' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_RULES')" class="icon-btn mr-1" (click)="openEdit('topics', topic)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_RULES')" class="icon-btn danger" (click)="confirmDelete('topics', topic)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                    </td>
                  </tr>
                }
                @if (api.topics().length === 0) {
                  <tr><td colspan="5" class="text-center py-6 muted">No rules configured yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (activeTab() === 'categories') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Content Categories</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="btn-primary" (click)="openCreate('categories')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Category
            </button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Base Weight</th><th class="text-right">Actions</th></tr></thead>
              <tbody>
                @for (cat of api.categories(); track cat.id) {
                  <tr>
                    <td class="muted">{{ cat.id }}</td>
                    <td class="font-medium">{{ cat.name }}</td>
                    <td><span class="badge badge-neutral bg-none">{{ cat.weight | number:'1.0-2' }}</span></td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn mr-1" (click)="openEdit('categories', cat)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn danger" (click)="confirmDelete('categories', cat)"><lucide-icon name="trash-2" size="16"></lucide-icon></button>
                    </td>
                  </tr>
                }
                @if (api.categories().length === 0) {
                  <tr><td colspan="4" class="text-center py-6 muted">No categories created yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="showModal.set(false)">
        <div class="modal card glass slide-up" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>{{ editingItem ? 'Edit' : 'Add New' }} {{ getModalTitle() }}</h3>
            <button class="icon-btn" (click)="showModal.set(false)"><lucide-icon name="x" size="20"></lucide-icon></button>
          </div>

          <div class="modal-body mt-4">
            @if (activeTabMode === 'rss') {
              <div class="form-group">
                <label>Feed Name</label>
                <input class="input" [(ngModel)]="formData.name" placeholder="e.g. HackerNews Top">
              </div>
              <div class="form-group">
                <label>RSS URL</label>
                <input class="input" [(ngModel)]="formData.url" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>Description <span class="hint-inline">optional</span></label>
                <input class="input" [(ngModel)]="formData.description" placeholder="What does this source cover?">
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Category</label>
                  <select class="input" [(ngModel)]="selectedCategoryId">
                    <option [ngValue]="null">Uncategorized</option>
                    @for (cat of api.categories(); track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Base Trust Weight</label>
                  <input type="number" class="input" [(ngModel)]="formData.trust" step="0.1" min="0" max="10">
                </div>
              </div>
              <div class="form-group status-group">
                <label>Status</label>
                <div class="flex items-center gap-3">
                  <button class="toggle-btn" [class.toggle-on]="formData.enabled" (click)="formData.enabled = !formData.enabled">
                    <span class="toggle-knob"></span>
                  </button>
                  <span class="status-label" [class.active-label]="formData.enabled">{{ formData.enabled ? 'Active' : 'Disabled' }}</span>
                </div>
              </div>
            }

            @if (activeTabMode === 'html') {
              <div class="grid-2">
                <div class="form-group">
                  <label>Page Name</label>
                  <input class="input" [(ngModel)]="formData.name" placeholder="e.g. Acme Corp Blog">
                </div>
                <div class="form-group">
                  <label>Page Type</label>
                  <select class="input" [(ngModel)]="formData.type">
                    <option value="html_list">html_list</option>
                    <option value="html_detail">html_detail</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Target URL</label>
                <input class="input" [(ngModel)]="formData.url" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>Category</label>
                <select class="input" [(ngModel)]="selectedCategoryId">
                  <option [ngValue]="null">Uncategorized</option>
                  @for (cat of api.categories(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>List Selector (CSS)</label>
                  <input class="input" [(ngModel)]="formData.listSelector" placeholder=".article-item">
                </div>
                <div class="form-group">
                  <label>Title Selector</label>
                  <input class="input" [(ngModel)]="formData.titleSelector" placeholder="h2.title">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Link Selector</label>
                  <input class="input" [(ngModel)]="formData.linkSelector" placeholder="a.read-more">
                </div>
                <div class="form-group">
                  <label>Date Selector <span class="hint-inline">CSS / format string</span></label>
                  <input class="input" [(ngModel)]="formData.dateSelector" placeholder=".post-date">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Base Trust Weight</label>
                  <input type="number" class="input" [(ngModel)]="formData.trust" step="0.1" min="0" max="10">
                </div>
                <div class="form-group status-group">
                  <label>Status</label>
                  <div class="flex items-center gap-3">
                    <button class="toggle-btn" [class.toggle-on]="formData.enabled" (click)="formData.enabled = !formData.enabled">
                      <span class="toggle-knob"></span>
                    </button>
                    <span class="status-label" [class.active-label]="formData.enabled">{{ formData.enabled ? 'Active' : 'Disabled' }}</span>
                  </div>
                </div>
              </div>
            }

            @if (activeTabMode === 'topics') {
              <div class="form-group">
                <label>Topic Identifier</label>
                <input class="input" [(ngModel)]="formData.topicKey" placeholder="e.g. digital_lending">
              </div>
              <div class="form-group">
                <label>Description <span class="hint-inline">optional</span></label>
                <input class="input" [(ngModel)]="formData.description" placeholder="Short human-readable name">
              </div>
              <div class="form-group">
                <label>Regex Patterns <span class="hint-inline">pipe-separated</span></label>
                <input class="input" [(ngModel)]="patternsInput" placeholder="\\b(bnpl|buy.?now.?pay.?later)\\b">
                <span class="field-hint">Use | to separate multiple patterns. Each must be valid regex.</span>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Weight Multiplier</label>
                  <input type="number" class="input" [(ngModel)]="formData.weight" step="0.1" min="0" max="100">
                </div>
                <div class="form-group status-group">
                  <label>Status</label>
                  <div class="flex items-center gap-3">
                    <button class="toggle-btn" [class.toggle-on]="formData.active" (click)="formData.active = !formData.active">
                      <span class="toggle-knob"></span>
                    </button>
                    <span class="status-label" [class.active-label]="formData.active">{{ formData.active ? 'Active' : 'Disabled' }}</span>
                  </div>
                </div>
              </div>
            }

            @if (activeTabMode === 'categories') {
              <div class="form-group">
                <label>Category Name</label>
                <input class="input" [(ngModel)]="formData.name" placeholder="e.g. Regulatory">
              </div>
              <div class="form-group">
                <label>Description <span class="hint-inline">optional</span></label>
                <input class="input" [(ngModel)]="formData.description" placeholder="What kinds of sources go here?">
              </div>
              <div class="form-group">
                <label>Importance Weight</label>
                <input type="number" class="input" [(ngModel)]="formData.weight" step="0.1" min="0" max="10">
                <span class="field-hint">Added to every article score from this category.</span>
              </div>
            }
          </div>

          @if (saveError()) {
            <div class="alert alert-danger mt-3">{{ saveError() }}</div>
          }

          <div class="modal-footer mt-6 flex justify-end gap-2">
            <button class="btn-secondary" (click)="showModal.set(false)">Cancel</button>
            <button class="btn-primary" (click)="saveItem()" [disabled]="saving()">
              <lucide-icon name="check" size="16"></lucide-icon> {{ saving() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .sources-container { animation: fadeIn 0.4s ease-out; max-width: 1200px; margin: 0 auto; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .page-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.25rem; }
    .tab-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .premium-tabs { display: flex; gap: 8px; border-bottom: 2px solid var(--border-light); padding-bottom: 0; }
    .tab { background: transparent; border: none; padding: 12px 24px; font-weight: 600; font-size: 0.95rem; color: var(--text-muted); cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 8px; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab:hover { color: var(--text-main); }
    .tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
    .main-card { min-height: 400px; padding: 2rem; }
    .toggle-btn { position: relative; width: 36px; height: 20px; border-radius: 99px; border: none; padding: 0; background: var(--border-strong); cursor: pointer; transition: background 0.25s; flex-shrink: 0; }
    .toggle-btn.toggle-on { background: var(--success-color); }
    .toggle-knob { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: left 0.25s; box-shadow: 0 1px 4px var(--code-bg); }
    .toggle-btn.toggle-on .toggle-knob { left: 19px; }
    .status-group { display: flex; flex-direction: column; justify-content: flex-end; }
    .status-label { font-size: 0.85rem; color: var(--text-muted); }
    .active-label { color: var(--success-color); }
    .bg-none { background: var(--code-bg) !important; color: var(--text-main) !important; border-color: var(--border-strong) !important; }
    .font-medium { font-weight: 500; }
    .text-sm { font-size: 0.85rem; }
    .primary-text { color: var(--primary-color); }
    .mr-1 { margin-right: 4px; }
    code { font-family: 'JetBrains Mono', monospace; background: var(--code-bg); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-strong); color: var(--text-main); }
    .url-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .py-6 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
    .text-right { text-align: right; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { width: 90%; max-width: 560px; padding: 24px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-strong); max-height: 90vh; overflow-y: auto; }
    .slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 16px; }
    .modal-header h3 { font-size: 1.25rem; margin: 0; font-weight: 600; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .block { display: block; }
    select.input { cursor: pointer; }
    select.input option { background: var(--surface-base); color: var(--text-main); }
    .hint-inline { font-size: 0.7rem; color: var(--text-darkest); font-weight: 400; margin-left: 4px; }
    .field-hint { font-size: 0.75rem; color: var(--text-darkest); margin-top: 4px; display: block; }
    .alert-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); padding: 10px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.85rem; }
  `]
})
export class SourcesComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal<Tab>('rss');

  showModal = signal(false);
  saving = signal(false);
  saveError = signal<string | null>(null);
  editingItem: Feed | HtmlPage | TopicRule | Category | null = null;
  activeTabMode: Tab = 'rss';
  // The form is intentionally loose-typed (it switches shape per tab).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any = {};
  patternsInput = '';
  selectedCategoryId: number | null = null;

  ngOnInit(): void {
    this.api.loadFeeds();
    this.api.loadPages();
    this.api.loadTopics();
    this.api.loadCategories();
  }

  openCreate(tab: Tab): void {
    this.activeTabMode = tab;
    this.editingItem = null;
    this.saveError.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  openEdit(tab: Tab, item: Feed | HtmlPage | TopicRule | Category): void {
    this.activeTabMode = tab;
    this.editingItem = item;
    this.saveError.set(null);
    this.formData = { ...item };
    if (tab === 'rss' || tab === 'html') {
      this.selectedCategoryId = (item as Feed | HtmlPage).category?.id ?? null;
    }
    if (tab === 'topics' && Array.isArray((item as TopicRule).patterns)) {
      this.patternsInput = (item as TopicRule).patterns.join('|');
    } else {
      this.patternsInput = '';
    }
    this.showModal.set(true);
  }

  resetForm(): void {
    this.selectedCategoryId = null;
    this.patternsInput = '';
    if (this.activeTabMode === 'rss') {
      this.formData = { name: '', url: '', description: '', trust: 1.0, enabled: true };
    } else if (this.activeTabMode === 'html') {
      this.formData = { name: '', url: '', description: '', trust: 1.0, enabled: true, type: 'html_list', listSelector: '', titleSelector: '', linkSelector: '', dateSelector: '' };
    } else if (this.activeTabMode === 'categories') {
      this.formData = { name: '', description: '', weight: 1.0 };
    } else {
      this.formData = { topicKey: '', description: '', patterns: [], weight: 1.0, active: true };
    }
  }

  getModalTitle(): string {
    switch (this.activeTabMode) {
      case 'rss': return 'RSS Feed';
      case 'html': return 'HTML Source';
      case 'categories': return 'Category';
      default: return 'Topic Rule';
    }
  }

  toggleFeed(feed: Feed): void {
    const req: FeedRequest = this.toFeedRequest({ ...feed, enabled: !feed.enabled });
    this.api.saveFeed(req).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.api.loadFeeds(),
      error: err => console.error('toggleFeed failed', err),
    });
  }

  togglePage(page: HtmlPage): void {
    const req: HtmlPageRequest = this.toPageRequest({ ...page, enabled: !page.enabled });
    this.api.savePage(req).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.api.loadPages(),
      error: err => console.error('togglePage failed', err),
    });
  }

  toggleTopic(topic: TopicRule): void {
    const updated: TopicRule = { ...topic, active: !topic.active };
    this.api.saveTopic(updated).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.api.loadTopics(),
      error: err => console.error('toggleTopic failed', err),
    });
  }

  confirmDelete(tab: Tab, item: { id?: number; name?: string; topicKey?: string }): void {
    if (item.id == null) return;
    const label = item.name ?? item.topicKey ?? `#${item.id}`;
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;

    const action$ =
      tab === 'rss' ? this.api.deleteFeed(item.id) :
      tab === 'html' ? this.api.deletePage(item.id) :
      tab === 'topics' ? this.api.deleteTopic(item.id) :
      this.api.deleteCategory(item.id);
    const reload = () =>
      tab === 'rss' ? this.api.loadFeeds() :
      tab === 'html' ? this.api.loadPages() :
      tab === 'topics' ? this.api.loadTopics() :
      this.api.loadCategories();

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => reload(),
      error: err => { console.error('delete failed', err); alert('Delete failed: ' + (err?.error?.message ?? err?.message ?? 'unknown')); },
    });
  }

  saveItem(): void {
    if (this.saving()) return;
    this.saveError.set(null);

    try {
      this.saving.set(true);
      if (this.activeTabMode === 'rss') {
        if (!this.validateUrl(this.formData.url) || !this.formData.name) {
          this.saveError.set('Name and a valid http(s) URL are required.');
          this.saving.set(false);
          return;
        }
        const req = this.toFeedRequest(this.formData);
        this.api.saveFeed(req).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { this.api.loadFeeds(); this.showModal.set(false); this.saving.set(false); },
          error: err => this.handleSaveError(err),
        });
      } else if (this.activeTabMode === 'html') {
        if (!this.validateUrl(this.formData.url) || !this.formData.name || !this.formData.listSelector) {
          this.saveError.set('Name, valid URL and List Selector are required.');
          this.saving.set(false);
          return;
        }
        const req = this.toPageRequest(this.formData);
        this.api.savePage(req).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { this.api.loadPages(); this.showModal.set(false); this.saving.set(false); },
          error: err => this.handleSaveError(err),
        });
      } else if (this.activeTabMode === 'topics') {
        const patterns = this.patternsInput.split('|').map(p => p.trim()).filter(Boolean);
        if (!this.formData.topicKey || patterns.length === 0) {
          this.saveError.set('Topic key and at least one pattern are required.');
          this.saving.set(false);
          return;
        }
        for (const p of patterns) {
          try { new RegExp(p); } catch (e) {
            this.saveError.set(`Invalid regex: "${p}"`);
            this.saving.set(false);
            return;
          }
        }
        const payload: TopicRule = { ...this.formData, patterns };
        this.api.saveTopic(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { this.api.loadTopics(); this.showModal.set(false); this.saving.set(false); },
          error: err => this.handleSaveError(err),
        });
      } else if (this.activeTabMode === 'categories') {
        if (!this.formData.name) {
          this.saveError.set('Category name is required.');
          this.saving.set(false);
          return;
        }
        const payload: CategoryRequest = {
          id: this.formData.id,
          name: this.formData.name,
          description: this.formData.description,
          weight: Number(this.formData.weight ?? 1),
        };
        this.api.saveCategory(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { this.api.loadCategories(); this.showModal.set(false); this.saving.set(false); },
          error: err => this.handleSaveError(err),
        });
      }
    } catch (e) {
      console.error(e);
      this.saving.set(false);
    }
  }

  private toFeedRequest(f: Feed & { id?: number }): FeedRequest {
    return {
      id: f.id,
      name: f.name,
      url: f.url,
      description: f.description,
      trust: Number(f.trust ?? 1),
      enabled: !!f.enabled,
      categoryId: this.selectedCategoryId ?? f.category?.id ?? null,
    };
  }

  private toPageRequest(p: HtmlPage & { id?: number }): HtmlPageRequest {
    return {
      id: p.id,
      name: p.name,
      url: p.url,
      description: p.description,
      type: p.type,
      listSelector: p.listSelector,
      titleSelector: p.titleSelector,
      linkSelector: p.linkSelector,
      dateSelector: p.dateSelector,
      trust: Number(p.trust ?? 1),
      enabled: !!p.enabled,
      categoryId: this.selectedCategoryId ?? p.category?.id ?? null,
    };
  }

  private validateUrl(url: string | undefined): boolean {
    if (!url) return false;
    return /^https?:\/\/.+/i.test(url);
  }

  private handleSaveError(err: { error?: { message?: string }; message?: string }): void {
    console.error('save failed', err);
    this.saveError.set(err?.error?.message ?? err?.message ?? 'Save failed');
    this.saving.set(false);
  }
}
