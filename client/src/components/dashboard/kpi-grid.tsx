import React from 'react';
import { KPICard } from './kpi-card';
import { OrgStat, StatCategory, CATEGORY_DISPLAY_NAMES } from '@/types/salesforce-stats';
import { cn } from '@/lib/utils';

interface KPIGridProps {
  stats: OrgStat[];
  className?: string;
  filterByCategory?: StatCategory;
}

export function KPIGrid({ stats, className, filterByCategory }: KPIGridProps) {
  // Filter stats by category if provided
  const filteredStats = filterByCategory
    ? stats.filter(stat => stat.category === filterByCategory)
    : stats;
  
  // Group stats by category
  const groupedStats = filteredStats.reduce<Record<string, OrgStat[]>>((acc, stat) => {
    const category = stat.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(stat);
    return acc;
  }, {});
  
  // Get categories in a specific order (if no filter is applied)
  const categories = filterByCategory
    ? [filterByCategory]
    : Object.keys(groupedStats).sort((a, b) => {
        // Define a specific order for categories
        const order: Record<string, number> = {
          'api': 1,
          'users': 2,
          'metadata': 3,
          'automation': 4,
          'storage': 5,
          'uncategorized': 6
        };
        return (order[a] || 99) - (order[b] || 99);
      });
  
  return (
    <div className={cn("space-y-8", className)}>
      {categories.map(category => (
        <div key={category} className="space-y-4">
          {!filterByCategory && (
            <h3 className="text-xl font-semibold">
              {CATEGORY_DISPLAY_NAMES[category as StatCategory] || 'General Stats'}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedStats[category].map(stat => (
              <KPICard key={stat.key} stat={stat} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}