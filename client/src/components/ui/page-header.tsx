import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  className,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon && <div className="mr-2">{icon}</div>}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}