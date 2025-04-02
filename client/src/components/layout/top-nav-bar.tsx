import { useAuth } from "@/hooks/use-auth";
import { useOrgContext } from "@/hooks/use-org";
import OrgSelectorDropdown from "@/components/org-selector-dropdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function TopNavBar() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  // Safely access org context only if we're within an OrgProvider
  let activeOrg = null;
  try {
    const orgContext = useOrgContext();
    activeOrg = orgContext.activeOrg;
  } catch (e) {
    // OrgContext not available, activeOrg remains null
  }

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div 
            className="text-primary-500 font-bold text-xl flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 5.5L4.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 5.5L19.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.3" />
            </svg>
            <span>MetaScope</span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Help
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Docs
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Org Selector */}
          {user && <OrgSelectorDropdown />}
          
          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <span className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium text-neutral-900">
                  {user.fullName || user.username}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-red-600 focus:text-red-600"
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Logout"
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
