import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  BarChart3,
  Database, 
  Code, 
  Shield, 
  Settings, 
  HelpCircle, 
  Layers, 
  FileCode, 
  CreditCard,
  UserCog,
  Link2,
  Lock,
  Terminal,
  FileSearch,
  Zap,
  AlertTriangle,
  BarChartHorizontal,
  Home,
  KeyRound
} from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';

// User role types
type UserRole = 'all' | 'manager' | 'developer' | 'admin';

// Navigation item interface
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
  beta?: boolean;
  children?: NavigationItem[];
}

// Navigation category interface
interface NavigationCategory {
  label: string;
  items: NavigationItem[];
}

// Navigation configuration
interface NavigationConfig {
  [key: string]: NavigationCategory;
}

// Navigation configuration
const navigationConfig: NavigationConfig = {
  CORE: {
    label: 'CORE',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        roles: ['all'],
        children: [
          {
            id: 'org-health',
            label: 'Org Health',
            href: '/dashboard/org-health',
            icon: BarChart3,
            roles: ['manager', 'admin', 'developer'],
          },
          {
            id: 'org-general-stats',
            label: 'Org General Stats',
            href: '/dashboard/org-general-stats',
            icon: BarChart3,
            roles: ['manager', 'admin', 'developer'],
          },
        ]
      },
    ],
  },
  BUSINESS_INSIGHTS: {
    label: 'BUSINESS INSIGHTS',
    items: [
      {
        id: 'metadata-analytics',
        label: 'Metadata Analytics',
        href: '/metadata-analytics',
        icon: BarChart3,
        roles: ['manager', 'admin'],
      },
      {
        id: 'api-usage',
        label: 'API Usage Analytics',
        href: '/dashboard/api-usage',
        icon: Zap,
        roles: ['manager', 'admin'],
      },
      {
        id: 'field-intelligence',
        label: 'Field Intelligence',
        href: '/dashboard/field-intelligence',
        icon: FileSearch,
        roles: ['manager', 'admin'],
      },
      {
        id: 'data-dictionary',
        label: 'Data Dictionary',
        href: '/data-dictionary',
        icon: Database,
        roles: ['manager', 'admin', 'developer'],
      },
      {
        id: 'tech-debt-scanner',
        label: 'Technical Debt Scanner',
        href: '/tech-debt-scanner',
        icon: BarChartHorizontal,
        roles: ['manager', 'admin'],
      },
    ],
  },
  DEVELOPMENT_TOOLS: {
    label: 'DEVELOPMENT TOOLS',
    items: [
      {
        id: 'data-model-analyzer',
        label: 'Data Model Analyzer',
        href: '/data-model-analyzer',
        icon: Database,
        roles: ['developer', 'admin'],
      },
      {
        id: 'soql-editor',
        label: 'SOQL/SOSL Editor',
        href: '/soql-editor',
        icon: Code,
        roles: ['developer', 'admin'],
      },
      {
        id: 'dependency-analyzer',
        label: 'Dependency Analyzer',
        href: '/metadata-dependency-analyzer',
        icon: Link2,
        roles: ['developer', 'admin'],
      },
      {
        id: 'apex-debug-analyzer',
        label: 'Apex Debug Analyzer',
        href: '/apex-debug-analyzer',
        icon: Terminal,
        roles: ['developer', 'admin'],
      },
      {
        id: 'code-analysis',
        label: 'Code Analysis',
        href: '/code-analysis',
        icon: AlertTriangle,
        roles: ['developer', 'admin'],
      },
    ],
  },
  ADMINISTRATION: {
    label: 'ADMINISTRATION',
    items: [
      {
        id: 'security-analyzer',
        label: 'Security Analyzer',
        href: '/security-analyzer',
        icon: Shield,
        roles: ['admin'],
      },
      {
        id: 'access-tool',
        label: 'Access Tool',
        href: '/access-tool',
        icon: KeyRound,
        roles: ['admin'],
      },
      {
        id: 'automation-analyzer',
        label: 'Automation Analyzer',
        href: '/automation-analyzer',
        icon: Layers,
        roles: ['admin'],
      },
      {
        id: 'ui-component-analyzer',
        label: 'UI Component Analyzer',
        href: '/ui-component-analyzer',
        icon: FileCode,
        roles: ['admin'],
      },
    ],
  },
  SETTINGS: {
    label: 'SETTINGS',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['all'],
      },
      {
        id: 'admin-panel',
        label: 'Admin Panel',
        href: '/admin',
        icon: UserCog,
        roles: ['admin'],
      },
      {
        id: 'help-support',
        label: 'Help & Support',
        href: '/support',
        icon: HelpCircle,
        roles: ['all'],
      },
      {
        id: 'subscription',
        label: 'Subscription',
        href: '/subscription',
        icon: CreditCard,
        roles: ['manager', 'admin'],
      },
    ],
  },
};

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
        label: category.label,
        items: filteredItems
      };
    }
  });
  
  return filteredConfig;
}

// Collapsed Navigation Component
function CollapsedNavigation({ 
  onCategoryClick, 
  activeCategory,
  currentPath
}: { 
  onCategoryClick: (categoryKey: string) => void; 
  activeCategory: string | null;
  currentPath: string;
}) {
  const [, navigate] = useLocation();
  
  // Find if the current path matches any child item in Dashboard
  const isChildActive = (item: NavigationItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => child.href === currentPath);
  };
  
  return (
    <aside className="w-[54px] bg-white border-r border-neutral-200 flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b border-neutral-200 flex justify-center mb-4">
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xs">
          MS
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {Object.entries(navigationConfig).map(([key, category]) => (
          <div 
            key={key}
            className="mb-2"
          >
            <button
              className={cn(
                "w-full flex flex-col items-center justify-center p-2 rounded-md",
                activeCategory === key
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
              onClick={() => onCategoryClick(key)}
              title={category.label}
            >
              <div className="w-6 h-6 flex items-center justify-center rounded-md mb-1">
                {key === "CORE" && <Home className="h-4 w-4" />}
                {key === "BUSINESS_INSIGHTS" && <BarChart3 className="h-4 w-4" />}
                {key === "DEVELOPMENT_TOOLS" && <Code className="h-4 w-4" />}
                {key === "ADMINISTRATION" && <Shield className="h-4 w-4" />}
                {key === "SETTINGS" && <Settings className="h-4 w-4" />}
              </div>
              <span className="text-[8px] uppercase font-semibold tracking-tight text-center leading-none px-1">
                {key === "CORE" && "Home"}
                {key === "BUSINESS_INSIGHTS" && "Insights"}
                {key === "DEVELOPMENT_TOOLS" && "Dev"}
                {key === "ADMINISTRATION" && "Admin"}
                {key === "SETTINGS" && "Settings"}
              </span>
            </button>
            
            {/* Show child indicators for items with children in collapsed view */}
            {key === "CORE" && 
              category.items.map(item => 
                item.children && item.children.length > 0 && (
                  <div key={`${item.id}-children`} className="mt-1 flex justify-center">
                    <div className="flex flex-col gap-1">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => navigate(child.href)}
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            currentPath === child.href
                              ? "bg-primary-100 text-primary-700"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          )}
                          title={child.label}
                        >
                          <child.icon className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )
            }
          </div>
        ))}
      </div>
    </aside>
  );
}

// Expanded Navigation Component
function ExpandedNavigation({ 
  selectedRole, 
  onRoleChange, 
  currentPath,
  expandedCategory
}: { 
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentPath: string;
  expandedCategory?: string | null;
}) {
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
      // Filter items including children based on search term
      const matchedItems = category.items.filter((item: NavigationItem) => {
        // Check if the main item matches
        const mainItemMatches = item.label.toLowerCase().includes(term);
        
        // Check if any child items match
        const hasMatchingChild = item.children?.some(child => 
          child.label.toLowerCase().includes(term)
        ) || false;
        
        return mainItemMatches || hasMatchingChild;
      });
      
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
    
    // Check if any child is active to auto-expand parent
    const hasActiveChild = item.children ? 
      item.children.some(child => currentPath === child.href) : false;
    
    // Auto-open the dropdown if a child route is active
    const [isOpen, setIsOpen] = useState(hasActiveChild);
    
    // Handle parent item with children
    if (item.children) {
      return (
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "flex items-center w-full justify-between px-3 py-2 text-sm font-medium rounded-md",
              (isActive || hasActiveChild)
                ? "bg-primary-50 text-primary-600" 
                : "text-neutral-700 hover:bg-neutral-100"
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              {Icon && <Icon className="h-5 w-5 mr-3" />}
              <span>{item.label}</span>
              {item.beta && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                  Beta
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          
          {/* Child items */}
          {isOpen && (
            <div className="pl-8 space-y-1">
              {item.children.map((child) => (
                <Button
                  key={child.id}
                  variant="ghost"
                  className={cn(
                    "flex items-center w-full justify-start px-3 py-2 text-sm font-medium rounded-md",
                    currentPath === child.href
                      ? "bg-primary-50 text-primary-600" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}
                  onClick={() => navigate(child.href)}
                >
                  {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                  <span>{child.label}</span>
                  {child.beta && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                      Beta
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Regular item without children
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
        {Icon && <Icon className="h-5 w-5 mr-3" />}
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
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto relative">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold mr-2">
            MS
          </div>
          <h1 className="text-lg font-semibold">MetaScope</h1>
        </div>
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

// Navigation Container Component
interface NavigationContainerProps {
  defaultCollapsed?: boolean;
}

export default function SideNavigation({ defaultCollapsed = false }: NavigationContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  // Always use 'all' role since we removed the dropdown
  const [selectedRole, setSelectedRole] = useState<UserRole>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Load user preferences from localStorage on mount
  useEffect(() => {
    const savedIsCollapsed = localStorage.getItem('navigationCollapsed');
    
    if (savedIsCollapsed !== null) {
      setIsCollapsed(savedIsCollapsed === 'true');
    }
    
    // Always use 'all' role, ignore saved preference
    setSelectedRole('all');
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
    // Flatten all items including children
    const allItems: NavigationItem[] = [];
    
    Object.values(navigationConfig).forEach(category => {
      category.items.forEach(item => {
        allItems.push(item);
        
        // Add children items if they exist
        if (item.children && item.children.length > 0) {
          item.children.forEach(child => {
            allItems.push(child);
          });
        }
      });
    });
    
    return allItems.find(item => location === item.href || 
      (location === '/' && item.href === '/dashboard'));
  };
  
  // Find which category contains the active item
  const findActiveCategory = (): string | null => {
    const activeItem = findActiveItem();
    if (!activeItem) return null;
    
    // Check if the item is a direct child of a category
    const foundCategory = Object.entries(navigationConfig).find(([_, category]) => 
      category.items.some(item => item.id === activeItem.id)
    );
    
    if (foundCategory) {
      return foundCategory[0];
    }
    
    // Check if the item is a child of an item in a category
    for (const [categoryKey, category] of Object.entries(navigationConfig)) {
      for (const item of category.items) {
        if (item.children && item.children.some(child => child.id === activeItem.id)) {
          return categoryKey;
        }
      }
    }
    
    return null;
  };

  // Handle category click in collapsed navigation
  const handleCategoryClick = (categoryKey: string) => {
    setIsCollapsed(false);
    setExpandedCategory(categoryKey);
  };

  // Always use 'all' role since we removed the dropdown
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole('all');
  };

  // Toggle handler
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="relative h-full flex flex-col">
      {isCollapsed ? (
        <CollapsedNavigation 
          onCategoryClick={handleCategoryClick}
          activeCategory={findActiveCategory()}
          currentPath={location}
        />
      ) : (
        <ExpandedNavigation 
          selectedRole={selectedRole}
          onRoleChange={handleRoleChange}
          currentPath={location}
          expandedCategory={expandedCategory}
        />
      )}
      
      {/* Single toggle button matching Field Intelligence controls */}
      <button 
        onClick={handleToggle}
        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        className="absolute top-4 right-0 translate-x-1/2 bg-white border border-neutral-200 rounded-md p-1 shadow-sm hover:bg-neutral-50 flex items-center justify-center z-20"
        style={{ width: "24px", height: "24px" }}
      >
        <ChevronRight className={`h-4 w-4 text-neutral-600 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}
