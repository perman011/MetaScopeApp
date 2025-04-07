import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgStat } from '@/types/salesforce-stats';
import { getStatusColor, formatNumber, formatPercentage } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface KPICardProps {
  stat: OrgStat;
  className?: string;
}

export function KPICard({ stat, className }: KPICardProps) {
  const [expanded, setExpanded] = useState(false);
  const percentage = (stat.value / stat.limit) * 100;
  const statusColor = getStatusColor(stat.value, stat.limit);
  const hasDetails = stat.details && stat.details.length > 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>{stat.label}</span>
          {hasDetails && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </CardTitle>
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
        
        {/* License details breakdown */}
        {expanded && hasDetails && (
          <div className="mt-4 space-y-2 text-xs">
            <div className="font-medium">Breakdown by Type:</div>
            {stat.details.map((detail, index) => (
              <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2">
                <div className="truncate" title={detail.name}>{detail.name}</div>
                <div className="text-right">{detail.used}/{detail.total}</div>
                <div className="w-16">
                  <Progress 
                    value={(detail.used / detail.total) * 100} 
                    className="h-1.5" 
                    variant={getStatusColor(detail.used, detail.total)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        <div>
          {formatPercentage(stat.value, stat.limit)} of {formatNumber(stat.limit)}
          {stat.unit && <span> {stat.unit}</span>}
          {hasDetails && !expanded && (
            <button 
              onClick={() => setExpanded(true)}
              className="ml-2 underline text-xs hover:text-primary transition-colors"
            >
              View details
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}