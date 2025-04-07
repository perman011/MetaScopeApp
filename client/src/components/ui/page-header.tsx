import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  heading,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between pb-4', className)} {...props}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}