import { 
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
  Home
} from "lucide-react";

export type UserRole = 'all' | 'manager' | 'developer' | 'admin';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
  beta?: boolean;
}

export interface NavigationCategory {
  label: string;
  items: NavigationItem[];
}

export interface NavigationConfig {
  [key: string]: NavigationCategory;
}

export const navigationConfig: NavigationConfig = {
  CORE: {
    label: 'CORE',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        roles: ['all'],
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
        id: 'permissions-analyzer',
        label: 'Permissions Analyzer',
        href: '/permissions-analyzer',
        icon: Lock,
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