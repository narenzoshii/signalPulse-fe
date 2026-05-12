import { Injectable, signal, effect, Injector, runInInjectionContext, inject } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'signalpulse.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private injector = inject(Injector);

  /** Current theme; tracks system preference until user explicitly chooses. */
  readonly theme = signal<Theme>(this.resolveInitial());

  constructor() {
    // Apply to <html data-theme="..."> whenever it changes.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const t = this.theme();
        document.documentElement.setAttribute('data-theme', t);
      });
    });

    // If the user hasn't chosen, follow system preference changes.
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          this.theme.set(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private resolveInitial(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }
}
