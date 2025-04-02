import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DependencyNode {
  id: string;
  name: string;
  type: string;
  category: string;
}

interface DependencyLink {
  source: string;
  target: string;
  type: string;
}

interface DependencyAnalyzerVizProps {
  loading?: boolean;
  data?: {
    nodes: DependencyNode[];
    links: DependencyLink[];
  };
  onSelectNode?: (nodeId: string) => void;
  onChangeLayout?: (layout: string) => void;
  className?: string;
}

export default function DependencyAnalyzerViz({
  loading = false,
  data,
  onSelectNode,
  onChangeLayout,
  className = ''
}: DependencyAnalyzerVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLayout, setCurrentLayout] = useState('circular');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Generate placeholder data if none is provided
  const vizData = data || {
    nodes: [
      { id: '1', name: 'Account', type: 'CustomObject', category: 'Standard' },
      { id: '2', name: 'Contact', type: 'CustomObject', category: 'Standard' },
      { id: '3', name: 'Opportunity', type: 'CustomObject', category: 'Standard' },
      { id: '4', name: 'AccountTrigger', type: 'ApexTrigger', category: 'Apex' },
      { id: '5', name: 'ContactService', type: 'ApexClass', category: 'Apex' },
      { id: '6', name: 'OpportunityController', type: 'ApexClass', category: 'Apex' },
      { id: '7', name: 'AccountFlow', type: 'Flow', category: 'Automation' },
    ],
    links: [
      { source: '1', target: '2', type: 'Parent-Child' },
      { source: '1', target: '3', type: 'Parent-Child' },
      { source: '1', target: '4', type: 'Referenced' },
      { source: '2', target: '5', type: 'Referenced' },
      { source: '3', target: '6', type: 'Referenced' },
      { source: '1', target: '7', type: 'Referenced' },
    ]
  };
  
  // Filtering nodes based on search term
  const filteredNodes = searchTerm 
    ? vizData.nodes.filter(node => 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : vizData.nodes;
    
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
  
  // Filter links to only include connections between filtered nodes
  const filteredLinks = vizData.links.filter(link => 
    filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
  );
  
  // Category colors for visualization
  const categoryColors: Record<string, string> = {
    'Standard': '#3b82f6', // Blue
    'Custom': '#10b981',   // Green
    'Apex': '#6366f1',     // Indigo
    'Automation': '#f59e0b', // Amber
    'UI': '#ec4899',       // Pink
    'Reporting': '#06b6d4', // Cyan
    'Security': '#ef4444',  // Red
  };
  
  // Handle layout change
  const handleLayoutChange = (layout: string) => {
    setCurrentLayout(layout);
    if (onChangeLayout) {
      onChangeLayout(layout);
    }
  };
  
  // Handle node selection
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    if (onSelectNode) {
      onSelectNode(nodeId);
    }
  };
  
  // For visualization we would normally use D3 or another library
  // But for now we'll create a simple SVG visualization
  const renderVisualization = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-80">
          <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dependency graph...</p>
        </div>
      );
    }
    
    // Base coordinates for a simple circular layout
    // In a real implementation, we would use force-directed or other layouts
    const centerX = 250;
    const centerY = 200;
    const radius = 160;
    
    // Position nodes in a circle
    const positionedNodes = filteredNodes.map((node, index) => {
      const angle = (index / filteredNodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...node, x, y };
    });
    
    return (
      <div className="relative h-80 border rounded-md overflow-hidden bg-white">
        <svg width="100%" height="100%" viewBox="0 0 500 400" className="dependency-graph">
          {/* Draw the links */}
          {filteredLinks.map((link, index) => {
            const sourceNode = positionedNodes.find(n => n.id === link.source);
            const targetNode = positionedNodes.find(n => n.id === link.target);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <g key={`link-${index}`}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={selectedNode === sourceNode.id || selectedNode === targetNode.id ? "#0f172a" : "#94a3b8"}
                  strokeWidth={selectedNode === sourceNode.id || selectedNode === targetNode.id ? 2 : 1}
                  strokeDasharray={link.type === 'Referenced' ? "4,4" : undefined}
                />
              </g>
            );
          })}
          
          {/* Draw the nodes */}
          {positionedNodes.map((node) => {
            const nodeColor = categoryColors[node.category] || '#94a3b8';
            const isSelected = node.id === selectedNode;
            
            return (
              <g key={`node-${node.id}`} onClick={() => handleNodeClick(node.id)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 18 : 12}
                  fill={isSelected ? nodeColor : `${nodeColor}50`}
                  stroke={nodeColor}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <text
                  x={node.x}
                  y={node.y + 30}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isSelected ? "bold" : "normal"}
                  fill={isSelected ? "#0f172a" : "#475569"}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Controls overlay */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <Button variant="outline" size="icon" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Reset View">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <CardTitle className="text-lg">Dependency Analysis</CardTitle>
            <CardDescription>
              Visualize component relationships and dependencies
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={currentLayout} onValueChange={handleLayoutChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="force">Force-Directed</SelectItem>
                <SelectItem value="tree">Hierarchical</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search components..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            {Object.entries(categoryColors).map(([category, color]) => (
              <Badge 
                key={category}
                variant="outline" 
                className="flex items-center py-1"
                style={{ borderColor: color, color }}
              >
                <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: color }}></span>
                {category}
              </Badge>
            ))}
          </div>
        </div>
        
        {renderVisualization()}
        
        <div className="text-xs text-muted-foreground">
          {filteredNodes.length} components and {filteredLinks.length} relationships shown
        </div>
      </CardContent>
    </Card>
  );
}