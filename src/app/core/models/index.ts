/**
 * Shared API types. Mirrors the backend DTOs in com.signalpulse.dto / entities.
 */

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  weight: number;
}

export interface Feed {
  id?: number;
  name: string;
  url: string;
  description?: string;
  trust: number;
  enabled: boolean;
  category?: Category | null;
}

export interface FeedRequest {
  id?: number;
  name: string;
  url: string;
  description?: string;
  trust: number;
  enabled: boolean;
  categoryId?: number | null;
}

export interface HtmlPage {
  id?: number;
  name: string;
  url: string;
  description?: string;
  type: 'html_list' | 'html_detail';
  listSelector: string;
  titleSelector?: string;
  linkSelector?: string;
  dateSelector?: string;
  trust: number;
  enabled: boolean;
  category?: Category | null;
}

export interface HtmlPageRequest extends Omit<HtmlPage, 'category'> {
  categoryId?: number | null;
}

export interface TopicRule {
  id?: number;
  topicKey: string;
  description?: string;
  weight: number;
  patterns: string[];
  active: boolean;
}

export interface CategoryRequest {
  id?: number;
  name: string;
  description?: string;
  weight: number;
}

export interface ScheduleConfig {
  id?: number;
  name: string;
  active: boolean;
  dailyTimes: string[];
  weeklyDays: string[];
  weeklyDigestEnabled: boolean;
}

export interface Privilege {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  privileges: Privilege[];
}

export interface RoleRequest {
  id?: number;
  name: string;
  privilegeIds: number[];
}

export interface User {
  id?: number;
  username: string;
  roles: Role[];
}

export interface UserRequest {
  id?: number;
  username: string;
  password?: string;
  roleIds: number[];
}

export interface CurrentUser {
  user: { username: string; roles: Array<{ name: string }> };
  authorities: string[];
}

export interface ScanResultSummary {
  id?: number;
  timestamp: string;
  articlesFound: number;
  durationMs: number;
  newItemsCount: number;
  status: string;
  triggerType?: string;
}

export interface DashboardStats {
  recentResults?: ScanResultSummary[];
  totalArticles?: number;
  [key: string]: unknown;
}

export interface ScannedArticle {
  id?: number;
  title: string;
  link: string;
  description?: string;
  source: string;
  publishedAt?: string;
  score?: number;
}
