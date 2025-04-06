import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight } from 'lucide-react';
import ExpandedNavigation from './expanded-navigation';
import CollapsedNavigation from './collapsed-navigation';
import { navigationConfig, UserRole } from './navigation-config';

interface NavigationContainerProps {
  defaultCollapsed?: boolean;
}

export default function NavigationContainer({ defaultCollapsed = false }: NavigationContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [selectedRole, setSelectedRole] = useState<UserRole>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Load user preferences from localStorage on mount
  useEffect(() => {
    const savedIsCollapsed = localStorage.getItem('navigationCollapsed');
    const savedRole = localStorage.getItem('navigationRole');
    
    if (savedIsCollapsed !== null) {
      setIsCollapsed(savedIsCollapsed === 'true');
    }
    
    if (savedRole) {
      setSelectedRole(savedRole as UserRole);
    }
  }, []);
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('navigationCollapsed', isCollapsed.toString());
  }, [isCollapsed]);
  
  useEffect(() => {
    localStorage.setItem('navigationRole', selectedRole);
  }, [selectedRole]);
  
  // Find the active navigation item based on the current path
  const findActiveItem = () => {
    const allItems = getAllNavigationItems();
    return allItems.find(item => location === item.href || 
      (location === '/' && item.href === '/dashboard'));
  };
  
  // Get all navigation items flattened
  const getAllNavigationItems = () => {
    return Object.values(navigationConfig).flatMap(category => category.items);
  };
  
  // Toggle navigation collapse state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Handle role selection change
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };
  
  // Find which category contains the active item
  const findActiveCategory = (): string | null => {
    const activeItem = findActiveItem();
    if (!activeItem) return null;
    
    const foundCategory = Object.entries(navigationConfig).find(([_, category]) => 
      category.items.some(item => item.id === activeItem.id)
    );
    
    return foundCategory ? foundCategory[0] : null;
  };

  // Handle category click in collapsed navigation
  const handleCategoryClick = (categoryKey: string) => {
    setIsCollapsed(false);
    setExpandedCategory(categoryKey);
  };

  return (
    <div className="relative h-full flex flex-col">
      {isCollapsed ? (
        <CollapsedNavigation 
          onCategoryClick={handleCategoryClick}
          activeCategory={findActiveCategory()}
        />
      ) : (
        <ExpandedNavigation 
          selectedRole={selectedRole}
          onRoleChange={handleRoleChange}
          currentPath={location}
          expandedCategory={expandedCategory !== null ? expandedCategory : findActiveCategory()}
        />
      )}
      
      <button 
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-white border border-neutral-200 rounded-full p-1 shadow-sm z-10 hover:bg-neutral-50"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      >
        <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}

// Utility functions
export function getNavigationByRole(role: UserRole) {
  if (role === 'all') {
    return navigationConfig;
  }
  
  const filteredConfig: typeof navigationConfig = {};
  
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