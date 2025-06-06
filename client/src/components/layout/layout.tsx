import React, { ReactNode } from 'react';
import SideNavigation from './side-navigation';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export function Layout({ children, showSidebar = true, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* TopNavBar is removed from here as it's already included in App.tsx */}
      
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <SideNavigation />}
        
        <main className={cn(
          "flex-1 overflow-auto p-4 md:p-6",
          className
        )}>
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}