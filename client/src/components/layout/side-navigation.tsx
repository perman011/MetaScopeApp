import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3,
  Database, 
  Code, 
  Shield, 
  Settings, 
  HelpCircle, 
  Search, 
  Layers, 
  FileCode, 
  CreditCard,
  UserCog,
  Link2,
  Lock,
  Terminal,
  Table,
  FileSearch,
  Zap,
  GitBranch,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
}

function NavItem({ href, icon: Icon, children, active }: NavItemProps) {
  const [, navigate] = useLocation();

  return (
    <Button
      variant="ghost"
      className={cn(
        "flex items-center w-full justify-start px-2 py-2 text-sm font-medium rounded-md",
        active 
          ? "bg-primary-50 text-primary-600" 
          : "text-neutral-700 hover:bg-neutral-100"
      )}
      onClick={() => navigate(href)}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{children}</span>
    </Button>
  );
}

export default function SideNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4">
        <div className="relative">
          <Search className="h-4 w-4 text-neutral-500 absolute left-2.5 top-2.5" />
          <Input 
            type="text"
            placeholder="Search metadata..."
            className="w-full pl-8 pr-4 py-2 bg-neutral-100 text-sm placeholder-neutral-500 focus:bg-white" 
          />
        </div>
      </div>
      
      <nav className="flex-1 px-2 space-y-1">
        <NavItem href="/dashboard" icon={BarChart3} active={location === "/dashboard" || location === "/" || location === "/enhanced-dashboard"}>
          Dashboard
        </NavItem>
        
        <NavItem href="/data-model-analyzer" icon={Database} active={location === "/data-model-analyzer"}>
          Data Model Analyzer
        </NavItem>
        
        <NavItem href="/soql-editor" icon={Code} active={location === "/soql-editor"}>
          SOQL/SOSL Editor
        </NavItem>
        
        <NavItem href="/security-analyzer" icon={Shield} active={location === "/security-analyzer"}>
          Security Analyzer
        </NavItem>
        
        <NavItem href="/automation-analyzer" icon={Layers} active={location === "/automation-analyzer"}>
          Automation Analyzer
        </NavItem>
        
        <NavItem href="/ui-component-analyzer" icon={FileCode} active={location === "/ui-component-analyzer"}>
          UI Component Analyzer
        </NavItem>
        
        <NavItem href="/metadata-dependency-analyzer" icon={Link2} active={location === "/metadata-dependency-analyzer"}>
          Dependency Analyzer
        </NavItem>
        
        <NavItem href="/permissions-analyzer" icon={Lock} active={location === "/permissions-analyzer"}>
          Permissions Analyzer
        </NavItem>
        
        <NavItem href="/apex-debug-analyzer" icon={Terminal} active={location === "/apex-debug-analyzer"}>
          Apex Debug Analyzer
        </NavItem>
        
        <NavItem href="/metadata-analytics" icon={BarChart3} active={location === "/metadata-analytics"}>
          Metadata Analytics
        </NavItem>
        
        <NavItem href="/dashboard/field-intelligence" icon={FileSearch} active={location === "/dashboard/field-intelligence"}>
          Field Intelligence
        </NavItem>
        
        <NavItem href="/dashboard/api-usage" icon={Zap} active={location === "/dashboard/api-usage"}>
          API Usage Analytics
        </NavItem>
        
        <NavItem href="/code-analysis" icon={AlertTriangle} active={location === "/code-analysis"}>
          Code Analysis
        </NavItem>
        
        <div className="pt-4 mt-4 border-t border-neutral-200">
          <h3 className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Settings
          </h3>
          <div className="mt-1">
            {user?.isAdmin && (
              <NavItem href="/admin" icon={UserCog} active={location === "/admin"}>
                Admin Panel
              </NavItem>
            )}
            <NavItem href="/settings" icon={Settings}>
              Settings
            </NavItem>
            <NavItem href="/support" icon={HelpCircle}>
              Help & Support
            </NavItem>
            <NavItem href="/subscription" icon={CreditCard}>
              Subscription
            </NavItem>
          </div>
        </div>
      </nav>
    </aside>
  );
}
