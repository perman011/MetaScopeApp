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

export interface MetadataSankeyProps {
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
          <p className="font-medium">Dependency</p>
          <p className="text-sm">Source: {data.source.name}</p>
          <p className="text-sm">Target: {data.target.name}</p>
          {data.metadata?.referenceType && (
            <p className="text-sm text-muted-foreground">Type: {data.metadata.referenceType}</p>
          )}
          <p className="text-sm text-muted-foreground">Strength: {data.value}</p>
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
            <p className="text-sm text-muted-foreground">Count: {data.value}</p>
          )}
        </div>
      );
    }
  }
  return null;
};

// Metadata category color mapping
const categoryColors: Record<string, string> = {
  "ApexClass": "#3b82f6",     // blue
  "ApexTrigger": "#f59e0b",   // amber
  "CustomObject": "#10b981",  // green
  "CustomField": "#22c55e",   // lighter green
  "Flow": "#8b5cf6",          // purple
  "ValidationRule": "#ec4899", // pink
  "LightningComponent": "#ef4444", // red
  "VisualforcePage": "#6366f1", // indigo
  "default": "#64748b"        // slate
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
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        fontSize={10}
        fill="white"
      >
        {nodeNameFormatter(payload.name)}
      </text>
    </g>
  );
};

export default function MetadataSankeyViz({
  data,
  loading = false,
  title = "Metadata Dependencies",
  description = "Visualization of dependencies between metadata components",
  className = ""
}: MetadataSankeyProps) {
  // Default sample data if none provided
  const defaultData = {
    nodes: [
      { name: 'Account Object', category: 'CustomObject' },
      { name: 'Contact Object', category: 'CustomObject' },
      { name: 'AccountTrigger', category: 'ApexTrigger' },
      { name: 'ContactTrigger', category: 'ApexTrigger' },
      { name: 'AccountService', category: 'ApexClass' },
      { name: 'ContactService', category: 'ApexClass' },
      { name: 'LeadConversion', category: 'Flow' },
      { name: 'AccountDashboard', category: 'LightningComponent' }
    ],
    links: [
      { source: 0, target: 2, value: 3 },  // Account → AccountTrigger
      { source: 0, target: 4, value: 5 },  // Account → AccountService
      { source: 1, target: 3, value: 2 },  // Contact → ContactTrigger
      { source: 1, target: 5, value: 4 },  // Contact → ContactService 
      { source: 2, target: 4, value: 3 },  // AccountTrigger → AccountService
      { source: 3, target: 5, value: 2 },  // ContactTrigger → ContactService
      { source: 4, target: 6, value: 3 },  // AccountService → LeadConversion
      { source: 5, target: 6, value: 2 },  // ContactService → LeadConversion
      { source: 4, target: 7, value: 4 },  // AccountService → AccountDashboard
      { source: 6, target: 7, value: 2 }   // LeadConversion → AccountDashboard
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
        <div className="h-[450px]">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Skeleton className="h-[430px] w-full rounded-md" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={displayData}
                node={CustomSankeyNode}
                nodePadding={30}
                margin={{
                  top: 20,
                  right: 120,
                  bottom: 20,
                  left: 120,
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