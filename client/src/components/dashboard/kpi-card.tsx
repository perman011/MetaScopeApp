import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgStat } from '@/types/salesforce-stats';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KPICardProps {
  stat: OrgStat;
  className?: string;
}

export function KPICard({ stat, className }: KPICardProps) {
  // Calculate percentage
  const percentage = Math.min(100, (stat.value / stat.limit) * 100);
  
  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage < 60) return 'bg-emerald-500';
    if (percentage < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Format the value with units if available
  const formatValue = (value: number) => {
    return stat.unit ? `${value.toLocaleString()} ${stat.unit}` : value.toLocaleString();
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          {stat.label}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Current: {formatValue(stat.value)}</p>
                <p>Limit: {formatValue(stat.limit)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(stat.value)}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>0</span>
          <span>Limit: {formatValue(stat.limit)}</span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2" 
          indicatorClassName={getColorClass()} 
        />
      </CardContent>
    </Card>
  );
}