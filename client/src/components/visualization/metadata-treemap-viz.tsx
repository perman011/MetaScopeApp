import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for the TreeMap data structure
export interface TreemapNode {
  name: string;
  size?: number;
  children?: TreemapNode[];
  color?: string;
  category?: string;
  count?: number;
  [key: string]: any; // Allow for additional metadata
}

export interface MetadataTreemapProps {
  data?: TreemapNode[];
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

// Custom color scheme for different categories of metadata
const categoryColors: Record<string, string> = {
  "ApexClass": "#3b82f6",     // blue
  "ApexTrigger": "#f59e0b",   // amber
  "CustomObject": "#10b981",  // green
  "CustomField": "#22c55e",   // lighter green
  "Flow": "#8b5cf6",          // purple
  "ValidationRule": "#ec4899", // pink
  "LightningComponent": "#ef4444", // red
  "VisualforcePage": "#6366f1", // indigo
  "default": "#64748b",        // slate
  "other": "#9ca3af"           // gray
};

// Custom tooltip for TreeMap
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 border shadow-sm rounded-md">
        <p className="font-medium">{data.name}</p>
        {data.category && (
          <p className="text-sm text-neutral-600">Type: {data.category}</p>
        )}
        {data.count !== undefined && (
          <p className="text-sm text-neutral-600">Count: {data.count}</p>
        )}
        {data.size !== undefined && (
          <p className="text-sm text-neutral-600">Size: {data.size}</p>
        )}
        {data.value !== undefined && (
          <p className="text-sm text-neutral-600">Value: {data.value}</p>
        )}
        {/* Display additional custom properties if they exist */}
        {data.coverage !== undefined && (
          <p className="text-sm text-neutral-600">Coverage: {data.coverage}%</p>
        )}
        {data.lastModified && (
          <p className="text-sm text-neutral-600">Modified: {data.lastModified}</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom TreeMap node - render content based on available space
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, depth, name, category, root, index } = props;
  
  // Determine if there's enough space to render text
  const minTextWidth = name.length * 6;
  const minTextHeight = 20;
  const hasEnoughSpace = width > minTextWidth && height > minTextHeight;
  
  // Determine node color based on category
  const nodeCategory = category || 'default';
  const bgColor = categoryColors[nodeCategory] || categoryColors.default;
  
  // Adjust opacity for visual hierarchy - deeper nodes are more transparent
  const opacity = Math.max(0.7, 1 - depth * 0.2);
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
        fillOpacity={opacity}
        stroke="#fff"
        strokeWidth={1}
      />
      {hasEnoughSpace && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#fff"
            fontWeight={depth === 1 ? "bold" : "normal"}
            fontSize={depth === 1 ? 14 : 12}
          >
            {name}
          </text>
          {props.count !== undefined && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
            >
              {props.count}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default function MetadataTreemapViz({
  data,
  loading = false,
  title = "Metadata Distribution",
  description = "Visualization of metadata components by type and size",
  className = ""
}: MetadataTreemapProps) {
  // Default sample data if none provided
  const defaultData: TreemapNode[] = [
    {
      name: 'Metadata Components',
      children: [
        { 
          name: 'Apex', 
          children: [
            { name: 'Classes', category: 'ApexClass', size: 60, count: 60 },
            { name: 'Triggers', category: 'ApexTrigger', size: 15, count: 15 }
          ] 
        },
        { 
          name: 'Custom Objects', 
          children: [
            { name: 'Standard', category: 'CustomObject', size: 20, count: 20 },
            { name: 'Custom', category: 'CustomObject', size: 35, count: 35 }
          ] 
        },
        { 
          name: 'Automations', 
          children: [
            { name: 'Flows', category: 'Flow', size: 25, count: 25 },
            { name: 'Validation Rules', category: 'ValidationRule', size: 18, count: 18 },
          ] 
        },
        { 
          name: 'UI', 
          children: [
            { name: 'Lightning Components', category: 'LightningComponent', size: 40, count: 40 },
            { name: 'Visualforce Pages', category: 'VisualforcePage', size: 22, count: 22 },
          ] 
        },
      ]
    }
  ];

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
              <Treemap
                data={displayData}
                dataKey="size"
                ratio={4/3}
                stroke="#fff"
                content={<CustomTreemapContent />}
                animationDuration={500}
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}