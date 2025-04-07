import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgStat } from '@/types/salesforce-stats';
import { getStatusColor, formatNumber, formatPercentage } from '@/lib/utils';

interface KPICardProps {
  stat: OrgStat;
  className?: string;
}

export function KPICard({ stat, className }: KPICardProps) {
  const percentage = (stat.value / stat.limit) * 100;
  const statusColor = getStatusColor(stat.value, stat.limit);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatNumber(stat.value)}
          {stat.unit && <span className="text-sm ml-1">{stat.unit}</span>}
        </div>
        <Progress 
          value={percentage} 
          className="h-2 mt-2" 
          variant={statusColor}
        />
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        <div>
          {formatPercentage(stat.value, stat.limit)} of {formatNumber(stat.limit)}
          {stat.unit && <span>{stat.unit}</span>}
        </div>
      </CardFooter>
    </Card>
  );
}