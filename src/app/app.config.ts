import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { appInterceptor } from './core/interceptors/app.interceptor';
import { AuthService } from './core/services/auth.service';
import {
  LucideAngularModule,
  LayoutDashboard, Calendar, Settings, Settings2, Database, Activity, RefreshCw, Play, Pause, PlayCircle,
  PauseCircle, Trash2, Edit3, Globe, Plus, LogOut, Mail, Sliders, Save, Server, ShieldCheck, ShieldPlus,
  Route, Layers, ArrowRightCircle, Check, Hash, Rss, X, Clock, Link2, Cog, User, UserPlus, Shield,
  RotateCw, UserCog, ShieldUser, Sun, Moon, BarChart3, TrendingUp, Zap,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([appInterceptor])),

    // Probe the server for an existing session before the first route renders.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return firstValueFrom(auth.bootstrap()).catch(() => false);
    }),

    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard, Calendar, Settings, Settings2, Database, Activity, RefreshCw, Play, Pause,
        PlayCircle, PauseCircle, Trash2, Edit3, Globe, Plus, LogOut, Mail, Sliders, Save,
        Server, ShieldCheck, ShieldPlus, Route, Layers, ArrowRightCircle, Check, Hash, Rss, X, Clock,
        Link2, Cog, User, UserPlus, Shield, RotateCw, UserCog, ShieldUser,
        Sun, Moon, BarChart3, TrendingUp, Zap,
      })
    ),
  ],
};
