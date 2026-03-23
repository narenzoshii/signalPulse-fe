import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-sources',
  standalone: true,
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
        <button class="tab" [class.active]="activeTab === 'rss'" (click)="activeTab = 'rss'">
          <lucide-icon name="rss" size="16"></lucide-icon> RSS Feeds
        </button>
        <button class="tab" [class.active]="activeTab === 'html'" (click)="activeTab = 'html'">
          <lucide-icon name="globe" size="16"></lucide-icon> HTML Pages
        </button>
        <button class="tab" [class.active]="activeTab === 'topics'" (click)="activeTab = 'topics'">
          <lucide-icon name="hash" size="16"></lucide-icon> Topic Rules
        </button>
        <button class="tab" [class.active]="activeTab === 'categories'" (click)="activeTab = 'categories'">
          <lucide-icon name="layers" size="16"></lucide-icon> Categories
        </button>
      </div>

      <div class="card glass main-card">
        <!-- ==================== RSS TAB ==================== -->
        @if (activeTab === 'rss') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Configured Feeds</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="btn-primary" (click)="openCreate('rss')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Feed
            </button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>URL</th>
                  <th>Trust</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (feed of api.feeds(); track feed.id) {
                  <tr>
                    <td>
                      <button [disabled]="!auth.hasPermission('OP_WRITE_SOURCES')" class="toggle-btn" [class.toggle-on]="feed.enabled" (click)="toggleFeed(feed)" [title]="feed.enabled ? 'Active — click to disable' : 'Disabled — click to enable'">
                        <span class="toggle-knob"></span>
                      </button>
                    </td>

                    <td class="font-medium">{{ feed.name }}</td>
                    <td><span class="badge badge-neutral bg-none">{{ feed.category?.name || 'Uncategorized' }}</span></td>
                    <td class="muted text-sm url-cell" [title]="feed.url">{{ feed.url }}</td>
                    <td><span class="badge badge-neutral bg-none">{{ feed.trust | number:'1.2-2' }}</span></td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn mr-1" (click)="openEdit('rss', feed)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn danger" (click)="api.deleteFeed(feed.id).subscribe(() => api.loadFeeds())">
                        <lucide-icon name="trash-2" size="16"></lucide-icon>
                      </button>
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

        <!-- ==================== HTML TAB ==================== -->
        @if (activeTab === 'html') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Targeted Pages</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="btn-primary" (click)="openCreate('html')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Source
            </button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>URL</th>
                  <th>Type</th>
                  <th>Selectors</th>
                  <th>Trust</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (page of api.pages(); track page.id) {
                  <tr>
                    <td>
                      <button [disabled]="!auth.hasPermission('OP_WRITE_SOURCES')" class="toggle-btn" [class.toggle-on]="page.enabled" (click)="togglePage(page)" [title]="page.enabled ? 'Active — click to disable' : 'Disabled — click to enable'">
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
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn danger" (click)="api.deletePage(page.id).subscribe(() => api.loadPages())">
                        <lucide-icon name="trash-2" size="16"></lucide-icon>
                      </button>
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

        <!-- ==================== TOPICS TAB ==================== -->
        @if (activeTab === 'topics') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Scoring Rules</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_RULES')" class="btn-primary" (click)="openCreate('topics')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Rule
            </button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Topic Keyword</th>
                  <th>Regex Pattern</th>
                  <th>Weight</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (topic of api.topics(); track topic.id) {
                  <tr>
                    <td>
                      <button class="toggle-btn" [class.toggle-on]="topic.active" (click)="toggleTopic(topic)" [title]="topic.active ? 'Active — click to disable' : 'Disabled — click to enable'">
                        <span class="toggle-knob"></span>
                      </button>
                    </td>
                    <td class="font-medium primary-text">#{{ topic.topicKey }}</td>
                    <td class="muted text-sm"><code>{{ topic.patterns?.join(' | ') }}</code></td>
                    <td>
                      <span class="badge" [class.badge-success]="topic.weight > 1" [class.badge-danger]="topic.weight < 1">
                        {{ topic.weight | number:'1.2-2' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_RULES')" class="icon-btn mr-1" (click)="openEdit('topics', topic)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_RULES')" class="icon-btn danger" (click)="api.deleteTopic(topic.id).subscribe(() => api.loadTopics())">
                        <lucide-icon name="trash-2" size="16"></lucide-icon>
                      </button>
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

        <!-- ==================== CATEGORIES TAB ==================== -->
        @if (activeTab === 'categories') {
          <div class="flex justify-between items-center mb-6">
            <h2 class="tab-title">Content Categories</h2>
            <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="btn-primary" (click)="openCreate('categories')">
              <lucide-icon name="plus" size="16"></lucide-icon> Add Category
            </button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Base Weight</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of api.categories(); track cat.id) {
                  <tr>
                    <td class="muted">{{ cat.id }}</td>
                    <td class="font-medium">{{ cat.name }}</td>
                    <td>
                      <span class="badge badge-neutral bg-none">{{ cat.weight }}</span>
                    </td>
                    <td class="text-right">
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn mr-1" (click)="openEdit('categories', cat)"><lucide-icon name="edit-3" size="16"></lucide-icon></button>
                      <button *ngIf="auth.hasPermission('OP_WRITE_SOURCES')" class="icon-btn danger" (click)="api.deleteCategory(cat.id).subscribe(() => api.loadCategories())">
                        <lucide-icon name="trash-2" size="16"></lucide-icon>
                      </button>
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

    <!-- ==================== MODAL ==================== -->
    @if (showModal) {
      <div class="modal-backdrop">
        <div class="modal card glass slide-up">
          <div class="modal-header">
            <h3>{{ editingItem ? 'Edit' : 'Add New' }} {{ getModalTitle() }}</h3>
            <button class="icon-btn" (click)="showModal = false"><lucide-icon name="x" size="20"></lucide-icon></button>
          </div>

          <div class="modal-body mt-4">

            <!-- ---- RSS FORM ---- -->
            <div *ngIf="activeTabMode === 'rss'">
              <div class="form-group">
                <label>Feed Name</label>
                <input class="input" [(ngModel)]="formData.name" placeholder="e.g. HackerNews Top">
              </div>
              <div class="form-group">
                <label>RSS URL</label>
                <input class="input" [(ngModel)]="formData.url" placeholder="https://...">
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Category</label>
                  <select class="input" [(ngModel)]="selectedCategoryId">
                    <option [value]="0">Uncategorized</option>
                    @for (cat of api.categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Base Trust Weight</label>
                  <input type="number" class="input" [(ngModel)]="formData.trust" step="0.1">
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
            </div>

            <!-- ---- HTML FORM ---- -->
            <div *ngIf="activeTabMode === 'html'">
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
                  <option [value]="0">Uncategorized</option>
                  @for (cat of api.categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
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
                  <input class="input" [(ngModel)]="formData.dateSelector" placeholder=".post-date or MM/dd/yyyy">
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Base Trust Weight</label>
                  <input type="number" class="input" [(ngModel)]="formData.trust" step="0.1">
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
            </div>

            <!-- ---- TOPICS FORM ---- -->
            <div *ngIf="activeTabMode === 'topics'">
              <div class="form-group">
                <label>Topic Identifier</label>
                <input class="input" [(ngModel)]="formData.topicKey" placeholder="e.g. AI_ML">
              </div>
              <div class="form-group">
                <label>Regex Patterns <span class="hint-inline">pipe-separated</span></label>
                <input class="input" [(ngModel)]="formData.patterns" placeholder="(ai|machine learning)|(deep learning)">
                <span class="field-hint">Use | to separate multiple patterns</span>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label>Weight Multiplier</label>
                  <input type="number" class="input" [(ngModel)]="formData.weight" step="0.1" placeholder="1.0">
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
            </div>

            <!-- ---- CATEGORIES FORM ---- -->
            <div *ngIf="activeTabMode === 'categories'">
              <div class="form-group">
                <label>Category Name</label>
                <input class="input" [(ngModel)]="formData.name" placeholder="e.g. Digital Lending">
              </div>
              <div class="form-group">
                <label>Importance Weight</label>
                <input type="number" class="input" [(ngModel)]="formData.weight" placeholder="10">
                <span class="field-hint">Added to every article score from this category.</span>
              </div>
            </div>

          </div>

          <div class="modal-footer mt-6 flex justify-end gap-2">
            <button class="btn-secondary" (click)="showModal = false">Cancel</button>
            <button class="btn-primary" (click)="saveItem()">
              <lucide-icon name="check" size="16"></lucide-icon> Save Configuration
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

    /* Toggle Switch */
    .toggle-btn { position: relative; width: 36px; height: 20px; border-radius: 99px; border: none; padding: 0; background: var(--border-strong); cursor: pointer; transition: background 0.25s; flex-shrink: 0; }
    .toggle-btn.toggle-on { background: var(--success-color); }
    .toggle-knob { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .toggle-btn.toggle-on .toggle-knob { left: 19px; }

    .status-group { display: flex; flex-direction: column; justify-content: flex-end; }
    .status-label { font-size: 0.85rem; color: var(--text-muted); }
    .active-label { color: var(--success-color); }

    .bg-none { background: rgba(0,0,0,0.3) !important; color: var(--text-main) !important; border-color: var(--border-strong) !important; }
    .font-medium { font-weight: 500; }
    .text-sm { font-size: 0.85rem; }
    .primary-text { color: var(--primary-color); }
    .mr-1 { margin-right: 4px; }
    code { font-family: 'JetBrains Mono', monospace; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-strong); color: var(--text-main); }

    .url-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .py-6 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
    .text-right { text-align: right; }

    /* Modal */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
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
  `]
})
export class SourcesComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  activeTab = 'rss';

  showModal = false;
  editingItem: any = null;
  activeTabMode = 'rss';
  formData: any = {};
  selectedCategoryId: number = 0;

  ngOnInit() {
    this.api.loadFeeds();
    this.api.loadPages();
    this.api.loadTopics();
    this.api.loadCategories();
  }

  openCreate(tab: string) {
    this.activeTabMode = tab;
    this.editingItem = null;
    this.resetForm();
    this.showModal = true;
  }

  openEdit(tab: string, item: any) {
    this.activeTabMode = tab;
    this.editingItem = item;
    // Deep copy; for topics convert array back to pipe string for the textarea
    this.formData = { ...item };
    this.selectedCategoryId = item.category?.id || 0;
    if (tab === 'topics' && Array.isArray(item.patterns)) {
      this.formData.patterns = item.patterns.join('|');
    }
    this.showModal = true;
  }

  resetForm() {
    this.selectedCategoryId = 0;
    if (this.activeTabMode === 'rss') {
      this.formData = { trust: 1.0, enabled: true };
    } else if (this.activeTabMode === 'html') {
      this.formData = { trust: 0.9, enabled: true, type: 'html_list' };
    } else if (this.activeTabMode === 'categories') {
      this.formData = { weight: 5 };
    } else {
      this.formData = { weight: 1.0, active: true };
    }
  }

  getModalTitle() {
    return this.activeTabMode === 'rss' ? 'RSS Feed' :
           this.activeTabMode === 'html' ? 'HTML Source' : 
           this.activeTabMode === 'categories' ? 'Category' : 'Topic Rule';
  }

  // ---- Toggle active/enabled inline ----
  toggleFeed(feed: any) {
    const updated = { ...feed, enabled: !feed.enabled };
    this.api.saveFeed(updated).subscribe(() => this.api.loadFeeds());
  }
  togglePage(page: any) {
    const updated = { ...page, enabled: !page.enabled };
    this.api.savePage(updated).subscribe(() => this.api.loadPages());
  }
  toggleTopic(topic: any) {
    const updated = { ...topic, active: !topic.active };
    this.api.saveTopic(updated).subscribe(() => this.api.loadTopics());
  }

  saveItem() {
    if (this.selectedCategoryId > 0) {
      this.formData.category = { id: this.selectedCategoryId };
    } else {
      this.formData.category = null;
    }

    if (this.activeTabMode === 'rss') {
      this.api.saveFeed(this.formData).subscribe(() => { this.api.loadFeeds(); this.showModal = false; });
    } else if (this.activeTabMode === 'html') {
      this.api.savePage(this.formData).subscribe(() => { this.api.loadPages(); this.showModal = false; });
    } else if (this.activeTabMode === 'topics') {
      const payload = {
        ...this.formData,
        patterns: typeof this.formData.patterns === 'string'
          ? this.formData.patterns.split('|').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
          : (this.formData.patterns || [])
      };
      this.api.saveTopic(payload).subscribe(() => { this.api.loadTopics(); this.showModal = false; });
    } else if (this.activeTabMode === 'categories') {
      this.api.saveCategory(this.formData).subscribe(() => { this.api.loadCategories(); this.showModal = false; });
    }
  }
}
