import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { appInterceptor } from './core/interceptors/app.interceptor';
import { LucideAngularModule, LayoutDashboard, Calendar, Settings, Database, Activity, RefreshCw, Play, Pause, PlayCircle, PauseCircle, Trash2, Edit3, Globe, Plus, LogOut, Mail, Sliders, Save, Server, ShieldCheck, Route, Layers, ArrowRightCircle, Check, Hash, Rss, X, Clock, Link2, Cog, User, Shield, RotateCw, UserCog, ShieldUser } from 'lucide-angular';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([appInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({ LayoutDashboard, Calendar, Settings, Database, Activity, RefreshCw, Play, Pause, PlayCircle, PauseCircle, Trash2, Edit3, Globe, Plus, LogOut, Mail, Sliders, Save, Server, ShieldCheck, Route, Layers, ArrowRightCircle, Check, Hash, Rss, X, Clock, Link2, Cog, User, Shield, RotateCw, UserCog, ShieldUser }))
  ]
};
