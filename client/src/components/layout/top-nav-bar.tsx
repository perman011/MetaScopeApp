import { useAuth } from "@/hooks/use-auth";
import { useOrgContext } from "@/hooks/use-org";
import OrgSelector from "@/components/common/org-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { Loader2, Menu, X } from "lucide-react";
import { useState } from "react";

export default function TopNavBar() {
  const { user, logoutMutation } = useAuth();
  const { activeOrg } = useOrgContext();
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>MetaScope</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Help
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Docs
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Org Selector */}
          {user && <OrgSelector />}
          
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
                <DropdownMenuItem onClick={() => navigate("/")}>
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/");
                setIsMobileMenuOpen(false);
              }}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/data-model-analyzer");
                setIsMobileMenuOpen(false);
              }}
            >
              Data Model Analyzer
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/soql-editor");
                setIsMobileMenuOpen(false);
              }}
            >
              SOQL/SOSL Editor
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/security-analyzer");
                setIsMobileMenuOpen(false);
              }}
            >
              Security Analyzer
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
