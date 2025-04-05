import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sankey, ResponsiveContainer, Tooltip, Rectangle, Layer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Define the data structure for Sankey diagram
export interface SankeyNode {
  name: string;
  category?: string;
  value?: number;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  metadata?: any;
}

export interface DataLineageSankeyProps {
  data?: {
    nodes: SankeyNode[];
    links: SankeyLink[];
  };
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

// Custom tooltip content component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    
    if (data.source && data.target) {
      // This is a link tooltip
      return (
        <div className="bg-white p-2 border shadow-sm rounded-md">
          <p className="font-medium">Connection</p>
          <p className="text-sm">From: {data.source.name}</p>
          <p className="text-sm">To: {data.target.name}</p>
          <p className="text-sm text-muted-foreground">Flow: {data.value}</p>
        </div>
      );
    } else {
      // This is a node tooltip
      return (
        <div className="bg-white p-2 border shadow-sm rounded-md">
          <p className="font-medium">{data.name}</p>
          {data.category && (
            <p className="text-sm text-muted-foreground">Type: {data.category}</p>
          )}
          {data.value && (
            <p className="text-sm text-muted-foreground">Value: {data.value}</p>
          )}
        </div>
      );
    }
  }
  return null;
};

// Category color mapping
const categoryColors: Record<string, string> = {
  "source": "#3b82f6",      // blue
  "process": "#10b981",     // green
  "destination": "#ef4444", // red
  "trigger": "#f59e0b",     // yellow
  "service": "#8b5cf6",     // purple
  "default": "#64748b"      // slate
};

// Node label formatter to ensure they fit nicely
const nodeNameFormatter = (name: string) => {
  if (name.length > 20) {
    return name.substring(0, 18) + '...';
  }
  return name;
};

// Custom node renderer for better styling
const CustomSankeyNode = (props: any) => {
  const { x, y, width, height, index, payload } = props;
  const category = payload.category || "default";
  const color = categoryColors[category] || categoryColors.default;
  
  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity="0.9"
      />
      <text
        x={x + (x < 250 ? width + 5 : -5)}
        y={y + height / 2}
        textAnchor={x < 250 ? 'start' : 'end'}
        fontSize={10}
        fill="#64748b"
      >
        {nodeNameFormatter(payload.name)}
      </text>
    </g>
  );
};

export default function DataLineageSankeyViz({
  data,
  loading = false,
  title = "Data Lineage Flow",
  description = "Visualization of how data flows between different components",
  className = ""
}: DataLineageSankeyProps) {
  // Default sample data if none provided
  const defaultData = {
    nodes: [
      { name: 'Account Object', category: 'source' },
      { name: 'Contact Object', category: 'source' },
      { name: 'Opportunity Object', category: 'source' },
      { name: 'Lead Object', category: 'source' },
      { name: 'Account Trigger', category: 'trigger' },
      { name: 'Contact Flow', category: 'process' },
      { name: 'Lead Process', category: 'process' },
      { name: 'Opportunity Automation', category: 'process' },
      { name: 'Reports', category: 'destination' },
      { name: 'Dashboards', category: 'destination' },
      { name: 'External System', category: 'destination' }
    ],
    links: [
      { source: 0, target: 4, value: 12 },  // Account → Account Trigger
      { source: 0, target: 5, value: 8 },   // Account → Contact Flow
      { source: 1, target: 5, value: 15 },  // Contact → Contact Flow 
      { source: 2, target: 7, value: 10 },  // Opportunity → Opportunity Automation
      { source: 3, target: 6, value: 14 },  // Lead → Lead Process
      { source: 4, target: 8, value: 5 },   // Account Trigger → Reports
      { source: 5, target: 8, value: 7 },   // Contact Flow → Reports
      { source: 5, target: 9, value: 6 },   // Contact Flow → Dashboards
      { source: 6, target: 0, value: 3 },   // Lead Process → Account
      { source: 6, target: 1, value: 8 },   // Lead Process → Contact
      { source: 7, target: 9, value: 5 },   // Opportunity Automation → Dashboards
      { source: 7, target: 10, value: 8 }   // Opportunity Automation → External System
    ]
  };

  const displayData = data || defaultData;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-[500px]">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Skeleton className="h-[480px] w-full rounded-md" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={displayData}
                node={CustomSankeyNode}
                nodePadding={40}
                margin={{
                  top: 20,
                  right: 160,
                  bottom: 20,
                  left: 40,
                }}
                link={{ stroke: '#d1d5db', strokeOpacity: 0.2 }}
              >
                <Tooltip content={<CustomTooltip />} />
              </Sankey>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}