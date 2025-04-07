/**
 * Interface for general organizational statistics
 */
export interface OrgStat {
  key: string;
  label: string;
  value: number;
  limit: number;
  unit?: string;
  category?: StatCategory;
}

/**
 * Categories for organization statistics
 */
export type StatCategory = 'storage' | 'metadata' | 'api' | 'users' | 'automation';

/**
 * Category display names in friendly format
 */
export const CATEGORY_DISPLAY_NAMES: Record<StatCategory, string> = {
  'storage': 'Storage',
  'metadata': 'Metadata Components',
  'api': 'API Usage',
  'users': 'Users',
  'automation': 'Automation'
};