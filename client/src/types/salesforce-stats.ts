/**
 * Represents a category for organizational statistics
 */
export type StatCategory = 'storage' | 'metadata' | 'api' | 'users' | 'automation';

/**
 * Interface for license details
 */
export interface LicenseDetail {
  name: string;
  used: number;
  total: number;
}

/**
 * Interface for a single organizational statistic
 */
export interface OrgStat {
  key: string;
  label: string;
  value: number;
  limit: number;
  unit?: string;
  category?: StatCategory;
  details?: LicenseDetail[]; // Used for license breakdown and other detailed stats
}

/**
 * Display names for each stat category
 */
export const CATEGORY_DISPLAY_NAMES: Record<StatCategory, string> = {
  storage: 'Storage',
  metadata: 'Metadata Components',
  api: 'API Usage',
  users: 'User Management',
  automation: 'Automation'
};

/**
 * Response type for organization stats API
 */
export interface OrgStatsResponse {
  stats: OrgStat[];
}