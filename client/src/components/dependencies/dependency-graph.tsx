import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Info, 
  Maximize2, 
  Minimize2, 
  Search, 
  ZoomIn, 
  ZoomOut,
  Filter
} from "lucide-react";
import cytoscape from 'cytoscape';

interface DependencyGraphProps {
  orgId: number;
  componentId?: number;
  title?: string;
  description?: string;
  height?: string;
  showReverseDependencies?: boolean;
}

interface ComponentDependency {
  id: number;
  orgId: number;
  sourceComponentId: number;
  sourceComponentName: string;
  sourceComponentType: string;
  targetComponentId: number;
  targetComponentName: string;
  targetComponentType: string;
  dependencyType: string;
  dependencyStrength: 'weak' | 'medium' | 'strong';
  createdAt: string;
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ 
  orgId, 
  componentId, 
  title = "Component Dependencies", 
  description = "Visualizing relationships between Salesforce components",
  height = "600px",
  showReverseDependencies = false
}) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  
  // Fetch dependencies data
  const { data: dependenciesData, isLoading: isLoadingDependencies, error: dependenciesError } = useQuery<ComponentDependency[]>({
    queryKey: ['/api/orgs', orgId, 'components', componentId, 'dependencies'],
    queryFn: async () => {
      const response = await fetch(`/api/orgs/${orgId}/components/${componentId}/dependencies`);
      if (!response.ok) {
        throw new Error('Failed to fetch component dependencies');
      }
      return response.json();
    },
    enabled: !!orgId && !!componentId && !showReverseDependencies,
  });
  
  // Fetch reverse dependencies if specified
  const { data: reverseDependenciesData, isLoading: isLoadingReverseDependencies, error: reverseDependenciesError } = useQuery<ComponentDependency[]>({
    queryKey: ['/api/orgs', orgId, 'components', componentId, 'reverse-dependencies'],
    queryFn: async () => {
      const response = await fetch(`/api/orgs/${orgId}/components/${componentId}/reverse-dependencies`);
      if (!response.ok) {
        throw new Error('Failed to fetch reverse dependencies');
      }
      return response.json();
    },
    enabled: !!orgId && !!componentId && showReverseDependencies,
  });
  
  const isLoading = isLoadingDependencies || isLoadingReverseDependencies;
  const error = dependenciesError || reverseDependenciesError;
  const dependencies = showReverseDependencies ? reverseDependenciesData : dependenciesData;

  // Initialize and update Cytoscape graph
  useEffect(() => {
    if (!cyRef.current || isLoading || !dependencies || dependencies.length === 0) return;
    
    // Process data for visualization
    const nodes = new Map();
    const edges = [];
    
    // We need to compute this dynamically from our dependencies
    dependencies.forEach((dep) => {
      // Add source component as node if it doesn't exist
      if (!nodes.has(dep.sourceComponentId)) {
        nodes.set(dep.sourceComponentId, {
          id: `node-${dep.sourceComponentId}`,
          data: {
            id: `node-${dep.sourceComponentId}`,
            label: dep.sourceComponentName,
            type: dep.sourceComponentType,
            // Distinguish the focused component
            isFocus: componentId === dep.sourceComponentId,
          }
        });
      }
      
      // Add target component as node if it doesn't exist
      if (!nodes.has(dep.targetComponentId)) {
        nodes.set(dep.targetComponentId, {
          id: `node-${dep.targetComponentId}`,
          data: {
            id: `node-${dep.targetComponentId}`,
            label: dep.targetComponentName,
            type: dep.targetComponentType,
            // Distinguish the focused component
            isFocus: componentId === dep.targetComponentId,
          }
        });
      }
      
      // Add dependency as edge
      edges.push({
        data: {
          id: `edge-${dep.id}`,
          source: `node-${dep.sourceComponentId}`,
          target: `node-${dep.targetComponentId}`,
          type: dep.dependencyType,
          strength: dep.dependencyStrength
        }
      });
    });
    
    // Convert node map to array
    const nodeArray = Array.from(nodes.values());

    // Apply filtering if specified
    let filteredNodes = nodeArray;
    let filteredEdges = edges;
    
    if (filter) {
      const lowercaseFilter = filter.toLowerCase();
      
      // Filter nodes by name or type
      filteredNodes = nodeArray.filter(node => 
        node.data.label.toLowerCase().includes(lowercaseFilter) || 
        node.data.type.toLowerCase().includes(lowercaseFilter)
      );
      
      // Get IDs of filtered nodes
      const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
      
      // Filter edges to only include those connecting filtered nodes
      filteredEdges = edges.filter(edge => 
        filteredNodeIds.has(edge.data.source) && filteredNodeIds.has(edge.data.target)
      );
    }
    
    // Initialize Cytoscape
    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements: {
        nodes: filteredNodes,
        edges: filteredEdges
      },
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#9DC4FB',
            'border-width': 1,
            'border-color': '#5A8DEE',
            'width': 40,
            'height': 40,
            'font-size': '10px',
            'color': '#333333',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'text-overflow-wrap': 'anywhere'
          }
        },
        {
          selector: 'node[type="ApexClass"]',
          style: {
            'background-color': '#FFB74D',
            'border-color': '#FF9800'
          }
        },
        {
          selector: 'node[type="ApexTrigger"]',
          style: {
            'background-color': '#FF7043',
            'border-color': '#F4511E'
          }
        },
        {
          selector: 'node[type="LightningComponent"]',
          style: {
            'background-color': '#64B5F6',
            'border-color': '#2196F3'
          }
        },
        {
          selector: 'node[type="VisualForce"]',
          style: {
            'background-color': '#9CCC65',
            'border-color': '#8BC34A'
          }
        },
        {
          selector: 'node[type="CustomObject"]',
          style: {
            'background-color': '#BA68C8',
            'border-color': '#9C27B0'
          }
        },
        {
          selector: 'node[?isFocus]',
          style: {
            'border-width': 3,
            'border-color': '#E91E63',
            'width': 50,
            'height': 50,
            'font-weight': 'bold',
            'font-size': '12px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#BBBBBB',
            'target-arrow-color': '#BBBBBB',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge[strength="strong"]',
          style: {
            'width': 4,
            'line-color': '#E53935',
            'target-arrow-color': '#E53935'
          }
        },
        {
          selector: 'edge[strength="medium"]',
          style: {
            'width': 3,
            'line-color': '#FB8C00',
            'target-arrow-color': '#FB8C00'
          }
        },
        {
          selector: 'edge[strength="weak"]',
          style: {
            'width': 1,
            'line-style': 'dashed',
            'line-color': '#78909C',
            'target-arrow-color': '#78909C'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 4,
            'line-color': '#FFC107',
            'target-arrow-color': '#FFC107'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#FFC107'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: true,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        nodeOverlap: 10,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    });
    
    // Add event listeners
    cyInstance.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      console.log('Tapped node:', node.data());
      // Highlight connected edges
      cyInstance.current?.edges().removeClass('highlighted');
      node.connectedEdges().addClass('highlighted');
    });
    
    cyInstance.current.on('tap', function(evt) {
      if (evt.target === cyInstance.current) {
        // Clicked on background
        cyInstance.current?.edges().removeClass('highlighted');
      }
    });
    
    return () => {
      // Clean up
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [dependencies, componentId, isLoading, filter]);
  
  // Zoom functions
  const zoomIn = () => {
    cyInstance.current?.zoom({
      level: cyInstance.current.zoom() * 1.2,
      renderedPosition: { x: cyInstance.current.width() / 2, y: cyInstance.current.height() / 2 }
    });
  };
  
  const zoomOut = () => {
    cyInstance.current?.zoom({
      level: cyInstance.current.zoom() * 0.8,
      renderedPosition: { x: cyInstance.current.width() / 2, y: cyInstance.current.height() / 2 }
    });
  };
  
  const fitToScreen = () => {
    cyInstance.current?.fit();
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Count component types
  const getComponentTypeCounts = () => {
    if (!dependencies) return {};
    
    const counts: Record<string, number> = {};
    const processedIds = new Set<number>();
    
    dependencies.forEach(dep => {
      // Count source components
      if (!processedIds.has(dep.sourceComponentId)) {
        counts[dep.sourceComponentType] = (counts[dep.sourceComponentType] || 0) + 1;
        processedIds.add(dep.sourceComponentId);
      }
      
      // Count target components
      if (!processedIds.has(dep.targetComponentId)) {
        counts[dep.targetComponentType] = (counts[dep.targetComponentType] || 0) + 1;
        processedIds.add(dep.targetComponentId);
      }
    });
    
    return counts;
  };
  
  const componentTypeCounts = getComponentTypeCounts();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dependency data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!dependencies || dependencies.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Dependencies Found</AlertTitle>
            <AlertDescription>
              No component dependencies are currently available for this selection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter and legend */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          {/* Filter input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by name or type..."
              className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={filter || ''}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button 
                className="absolute right-2 top-2.5"
                onClick={() => setFilter(undefined)}
              >
                <span className="text-muted-foreground text-xs">×</span>
              </button>
            )}
          </div>
          
          {/* Component type counters */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(componentTypeCounts).map(([type, count]) => (
              <Badge key={type} variant="outline" className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ 
                  backgroundColor: 
                    type === 'ApexClass' ? '#FFB74D' : 
                    type === 'ApexTrigger' ? '#FF7043' :
                    type === 'LightningComponent' ? '#64B5F6' :
                    type === 'VisualForce' ? '#9CCC65' :
                    type === 'CustomObject' ? '#BA68C8' : '#9DC4FB'
                }}></span>
                {type}: {count}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Graph controls */}
        <div className="flex justify-end space-x-2 mb-2">
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fitToScreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Cytoscape container */}
        <div 
          ref={cyRef} 
          style={{ 
            width: '100%', 
            height: isFullscreen ? 'calc(100vh - 200px)' : height,
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}
        />
        
        {/* Legend */}
        <div className="mt-4 p-2 bg-muted rounded-md">
          <p className="text-xs font-medium mb-2">Legend:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFB74D' }}></span>
              <span className="text-xs">Apex Class</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF7043' }}></span>
              <span className="text-xs">Apex Trigger</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#64B5F6' }}></span>
              <span className="text-xs">Lightning Component</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9CCC65' }}></span>
              <span className="text-xs">Visualforce</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#BA68C8' }}></span>
              <span className="text-xs">Custom Object</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9DC4FB' }}></span>
              <span className="text-xs">Other Components</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span className="text-xs">Strong Dependency</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span className="text-xs">Medium Dependency</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 border-t border-dashed border-gray-500"></div>
              <span className="text-xs">Weak Dependency</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DependencyGraph;