import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navigationConfig, UserRole, NavigationItem, NavigationConfig } from './navigation-config';

// Utility function to filter navigation items by role
function getNavigationByRole(role: UserRole): NavigationConfig {
  if (role === 'all') {
    return navigationConfig;
  }
  
  const filteredConfig: NavigationConfig = {};
  
  Object.entries(navigationConfig).forEach(([key, category]) => {
    const filteredItems = category.items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });
    
    if (filteredItems.length > 0) {
      filteredConfig[key] = {
        ...category,
        items: filteredItems
      };
    }
  });
  
  return filteredConfig;
}

interface ExpandedNavigationProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentPath: string;
  expandedCategory?: string | null;
}

export default function ExpandedNavigation({ 
  selectedRole, 
  onRoleChange, 
  currentPath,
  expandedCategory
}: ExpandedNavigationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (expandedCategory) {
      initial[expandedCategory] = true;
    }
    return initial;
  });
  const [, navigate] = useLocation();
  
  // Filter navigation based on selected role
  const filteredNavigation = getNavigationByRole(selectedRole);
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Filter items based on search term
  const getFilteredItems = () => {
    if (!searchTerm.trim()) {
      return filteredNavigation;
    }
    
    const filtered: NavigationConfig = {};
    const term = searchTerm.trim().toLowerCase();
    
    Object.entries(filteredNavigation).forEach(([key, category]) => {
      const matchedItems = category.items.filter((item: NavigationItem) => 
        item.label.toLowerCase().includes(term)
      );
      
      if (matchedItems.length > 0) {
        filtered[key] = {
          label: category.label,
          items: matchedItems
        };
      }
    });
    
    return filtered;
  };
  
  // Navigation item component
  const NavItem = ({ item }: { item: NavigationItem }) => {
    const isActive = currentPath === item.href || 
      (currentPath === '/' && item.href === '/dashboard');
    const Icon = item.icon;
    
    return (
      <Button
        variant="ghost"
        className={cn(
          "flex items-center w-full justify-start px-3 py-2 text-sm font-medium rounded-md",
          isActive 
            ? "bg-primary-50 text-primary-600" 
            : "text-neutral-700 hover:bg-neutral-100"
        )}
        onClick={() => navigate(item.href)}
      >
        <Icon className="h-5 w-5 mr-3" />
        <span>{item.label}</span>
        {item.beta && (
          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
            Beta
          </span>
        )}
      </Button>
    );
  };
  
  const filteredItems = getFilteredItems();
  
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold mr-2">
            MS
          </div>
          <h1 className="text-lg font-semibold">MetaScope</h1>
        </div>
        
        <Select 
          value={selectedRole} 
          onValueChange={(value) => onRoleChange(value as UserRole)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Features</SelectItem>
              <SelectItem value="manager">Manager View</SelectItem>
              <SelectItem value="developer">Developer View</SelectItem>
              <SelectItem value="admin">Admin View</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="p-4">
        <div className="relative">
          <Search className="h-4 w-4 text-neutral-500 absolute left-2.5 top-2.5" />
          <Input 
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-4 py-2 bg-neutral-100 text-sm placeholder-neutral-500 focus:bg-white" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <nav className="flex-1 px-3 pb-4 space-y-1">
        {Object.entries(filteredItems).map(([key, category]) => (
          <div key={key} className="mb-2">
            <button
              className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider"
              onClick={() => toggleCategory(key)}
            >
              <span>{category.label}</span>
              {expandedCategories[key] ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            
            {expandedCategories[key] && (
              <div className="mt-1 pl-2 space-y-1">
                {category.items.map((item: NavigationItem) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}