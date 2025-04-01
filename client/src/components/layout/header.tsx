import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <h1 className="ml-2 text-lg font-semibold text-neutral-800">Salesforce Metadata Analyzer</h1>
        </div>
        <nav className="hidden md:flex ml-8">
          <Link href="/dashboard">
            <a className={`px-3 py-2 text-sm font-medium ${location === "/dashboard" ? "text-primary-500 border-b-2 border-primary-500" : "text-neutral-600 hover:text-primary-500"}`}>
              Dashboard
            </a>
          </Link>
          <Link href="/organizations">
            <a className={`px-3 py-2 text-sm font-medium ${location === "/organizations" ? "text-primary-500 border-b-2 border-primary-500" : "text-neutral-600 hover:text-primary-500"}`}>
              Organizations
            </a>
          </Link>
          <Link href="/settings">
            <a className={`px-3 py-2 text-sm font-medium ${location === "/settings" ? "text-primary-500 border-b-2 border-primary-500" : "text-neutral-600 hover:text-primary-500"}`}>
              Settings
            </a>
          </Link>
          <a href="https://github.com/your-repo/salesforce-metadata-analyzer" target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-primary-500">
            Help
          </a>
        </nav>
      </div>
      
      {user && (
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 focus:outline-none">
              <span>{user.name}</span>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <a className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/profile`}>
                  <a className="flex items-center cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Avatar>
            <AvatarFallback className="bg-primary-100 text-primary-500">
              {user ? getInitials(user.name) : ''}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  );
}
