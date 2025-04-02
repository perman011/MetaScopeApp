import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface ReferenceNode {
  id: string;
  type: string;
  label: string;
}

interface WhereIsUsedVizProps {
  componentName?: string;
  references?: ReferenceNode[];
  loading?: boolean;
  className?: string;
}

export default function WhereIsUsedViz({
  componentName = "Selected Component",
  references = [],
  loading = false,
  className = ""
}: WhereIsUsedVizProps) {
  // Define mock data if no references provided
  const defaultReferences: ReferenceNode[] = [
    { id: "1", type: "apex", label: "A" },
    { id: "2", type: "object", label: "B" },
    { id: "3", type: "trigger", label: "C" },
    { id: "4", type: "flow", label: "D" },
    { id: "5", type: "page", label: "E" },
  ];
  
  const displayReferences = references.length > 0 ? references : defaultReferences;
  
  // Type color mapping
  const typeColors: Record<string, string> = {
    apex: "#6366f1",
    object: "#10b981",
    trigger: "#ef4444",
    flow: "#f59e0b",
    page: "#ec4899",
    component: "#8b5cf6",
    default: "#94a3b8"
  };
  
  // Calculate positions for the nodes in a radial layout
  const centerNode = { x: 90, y: 90 };
  const radius = 60;
  const positionedNodes = displayReferences.map((node, index) => {
    const angle = (index / displayReferences.length) * 2 * Math.PI;
    const x = centerNode.x + radius * Math.cos(angle);
    const y = centerNode.y + radius * Math.sin(angle);
    return { ...node, x, y };
  });
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Where is Used</CardTitle>
        <CardDescription>
          Items that reference {componentName}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-44 relative">
          <svg width="100%" height="100%" viewBox="0 0 180 180">
            {/* Draw connection lines */}
            {positionedNodes.map((node, index) => (
              <line
                key={`line-${index}`}
                x1={centerNode.x}
                y1={centerNode.y}
                x2={node.x}
                y2={node.y}
                stroke="#e2e8f0"
                strokeWidth={2}
              />
            ))}
            
            {/* Draw the reference nodes */}
            {positionedNodes.map((node, index) => {
              const nodeColor = typeColors[node.type] || typeColors.default;
              
              return (
                <g key={`node-${index}`} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={16}
                    fill={nodeColor}
                    opacity={0.2}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={14}
                    fill={nodeColor}
                    stroke={nodeColor}
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
            
            {/* Draw the center node */}
            <circle
              cx={centerNode.x}
              cy={centerNode.y}
              r={25}
              fill="#6366f1"
              opacity={0.8}
            />
            <circle
              cx={centerNode.x}
              cy={centerNode.y}
              r={22}
              fill="#6366f1"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={centerNode.x}
              y={centerNode.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              C
            </text>
          </svg>
          
          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex items-center space-x-1 text-xs">
            <Badge variant="outline" className="bg-white">
              <span className="w-2 h-2 rounded-full mr-1 bg-primary"></span>
              Referenced by {displayReferences.length}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}