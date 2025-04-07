import React from 'react';
import { KPICard } from './kpi-card';
import { OrgStat, StatCategory, CATEGORY_DISPLAY_NAMES } from '@/types/salesforce-stats';

interface KPIGridProps {
  stats: OrgStat[];
  className?: string;
}

export function KPIGrid({ stats, className }: KPIGridProps) {
  // Group stats by category
  const statsByCategory = stats.reduce((acc, stat) => {
    const category = stat.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(stat);
    return acc;
  }, {} as Record<string, OrgStat[]>);

  // Get categories in specific order
  const orderedCategories: StatCategory[] = ['api', 'users', 'metadata', 'automation', 'storage'];
  const categories = Object.keys(statsByCategory)
    .sort((a, b) => {
      const indexA = orderedCategories.indexOf(a as StatCategory);
      const indexB = orderedCategories.indexOf(b as StatCategory);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  if (stats.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No stats available</div>;
  }

  return (
    <div className={className}>
      {categories.map(category => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-medium mb-4">
            {CATEGORY_DISPLAY_NAMES[category as StatCategory] || category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statsByCategory[category].map((stat) => (
              <KPICard key={stat.key} stat={stat} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}