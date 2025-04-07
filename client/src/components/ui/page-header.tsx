import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  icon, 
  className = "" 
}: PageHeaderProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary-600">{icon}</div>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-sm text-neutral-500">
          {description}
        </p>
      )}
    </div>
  );
}