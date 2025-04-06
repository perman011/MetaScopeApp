import React from 'react';
import { ChevronDown } from 'lucide-react';
import { navigationConfig } from './navigation-config';
import { cn } from '@/lib/utils';

interface CollapsedNavigationProps {
  onCategoryClick: (categoryKey: string) => void;
  activeCategory: string | null;
}

export default function CollapsedNavigation({ onCategoryClick, activeCategory }: CollapsedNavigationProps) {
  return (
    <aside className="w-16 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-neutral-200 flex justify-center">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
          MS
        </div>
      </div>
      
      <nav className="flex-1 p-2">
        {Object.entries(navigationConfig).map(([key, category]) => (
          <button
            key={key}
            className={cn(
              "w-full flex items-center justify-between p-2 mb-1 rounded-md text-xs font-semibold",
              activeCategory === key 
                ? "bg-primary-50 text-primary-700" 
                : "text-neutral-600 hover:bg-neutral-100"
            )}
            onClick={() => onCategoryClick(key)}
          >
            <span className="truncate">{category.label}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        ))}
      </nav>
    </aside>
  );
}