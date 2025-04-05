import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Treemap, ResponsiveContainer, Tooltip, Tooltip as RechartsTooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Define the data structure for treemap
interface TreemapItem {
  name: string;
  size?: number;
  children?: TreemapItem[];
  fill?: string;
}

export interface MetadataTreemapProps {
  data?: TreemapItem;
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

// Custom tooltip content component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border shadow-sm rounded-md">
        <p className="font-medium">{data.name}</p>
        {data.size && (
          <p className="text-sm text-muted-foreground">
            {data.size} {data.size === 1 ? 'component' : 'components'}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function MetadataTreemapViz({
  data,
  loading = false,
  title = "Metadata Hierarchy",
  description = "Visualization of metadata structure by type and count",
  className = ""
}: MetadataTreemapProps) {
  // Default sample data if none provided
  const defaultData: TreemapItem = {
    name: "Metadata",
    children: [
      {
        name: "Objects",
        children: [
          { name: "Custom Objects", size: 45, fill: "#4f46e5" },
          { name: "Standard Objects", size: 32, fill: "#3b82f6" }
        ]
      },
      {
        name: "Apex",
        children: [
          { name: "Classes", size: 124, fill: "#ef4444" },
          { name: "Triggers", size: 38, fill: "#f97316" }
        ]
      },
      {
        name: "Automation",
        children: [
          { name: "Flows", size: 56, fill: "#10b981" },
          { name: "Process Builders", size: 28, fill: "#22c55e" }
        ]
      },
      {
        name: "UI",
        children: [
          { name: "Lightning Components", size: 72, fill: "#8b5cf6" },
          { name: "Visualforce Pages", size: 43, fill: "#a855f7" }
        ]
      },
      {
        name: "Layout",
        children: [
          { name: "Page Layouts", size: 65, fill: "#ec4899" },
          { name: "Record Types", size: 27, fill: "#f43f5e" }
        ]
      }
    ]
  };

  const displayData = data || defaultData;
  const hasValidData = displayData && displayData.children && displayData.children.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-[400px]">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Skeleton className="h-[380px] w-full rounded-md" />
            </div>
          ) : !hasValidData ? (
            <div className="h-full w-full flex items-center justify-center text-gray-500">
              No metadata hierarchy data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={displayData.children}
                dataKey="size"
                nameKey="name"
                aspectRatio={4/3}
                stroke="#fff"
                fill="#8884d8"
              >
                <RechartsTooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}