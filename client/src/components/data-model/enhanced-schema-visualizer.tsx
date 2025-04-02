import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { Loader2, Search, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { toast as globalToast, notify, safeToast } from '@/hooks/use-toast';

// Define TypeScript interfaces for our data
interface FieldMetadata {
  name: string;
  label: string;
  type: string;
  required: boolean;
  unique: boolean;
  externalId?: boolean;
  precision?: number;
  scale?: number;
  length?: number;
  referenceTo?: string;
  relationshipName?: string;
}

interface RelationshipMetadata {
  name: string;
  field: string;
  object: string;
  // Allow more flexible type names but standardize them during processing
  type: 'Lookup' | 'MasterDetail' | 'Master Detail' | 'Master-Detail' | 'SelfJoin' | 'Self Join' | 'Self-Join' | 'ManyToMany' | 'Many To Many' | 'Many-to-Many';
  childObject?: string;
  childField?: string;
}

interface ObjectMetadata {
  name: string;
  label: string;
  apiName: string;
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
  custom: boolean;
}

interface SchemaMetadata {
  objects: ObjectMetadata[];
}

interface EnhancedSchemaVisualizerProps {
  metadata: any; // Accept any format of metadata that might be returned from the server
  selectedLayout?: string; // Optional prop to receive layout from parent
}

export default function EnhancedSchemaVisualizer({ metadata, selectedLayout: propLayout = 'cose' }: EnhancedSchemaVisualizerProps) {
  const cyRef = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  const { toast } = useToast();
  
  // State for UI controls
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayout, setSelectedLayout] = useState(propLayout);
  const [showStandardObjects, setShowStandardObjects] = useState(true);
  const [showCustomObjects, setShowCustomObjects] = useState(true);
  const [selectedObject, setSelectedObject] = useState<ObjectMetadata | null>(null);
  const [relationshipTypes, setRelationshipTypes] = useState({
    lookup: true,
    masterDetail: true,
    selfJoin: true,
    manyToMany: true,
  });

  // Handler for search function
  const handleSearch = () => {
    // Search updates automatically via the useEffect hook with searchQuery dependency
    console.log(`Searching for: ${searchQuery}`);
    
    // Show toast notification for search
    if (searchQuery.trim()) {
      try {
        if (filteredObjects.length > 0) {
          safeToast({
            title: "Search Results", 
            description: `Found ${filteredObjects.length} object${filteredObjects.length !== 1 ? 's' : ''} matching "${searchQuery}"`,
            variant: "default"
          });
        } else {
          safeToast({
            title: "No Results Found",
            description: `No objects match "${searchQuery}". Try a different search term.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error showing search toast:", error);
      }
    }
  };

  // Process metadata to enhance it with needed properties
  const processMetadata = (): SchemaMetadata => {
    console.log("Processing metadata:", metadata);
    
    // Check if we have a valid metadata object
    if (!metadata) {
      console.warn("No metadata available");
      return { objects: [] };
    }
    
    // Handle different metadata formats
    let objectsToProcess: any[] = [];
    
    if (metadata.objects && Array.isArray(metadata.objects)) {
      // Standard format with objects array
      objectsToProcess = metadata.objects;
      console.log(`Found ${objectsToProcess.length} objects in standard format`);
    } else if (metadata.data && metadata.data.objects && Array.isArray(metadata.data.objects)) {
      // Nested format with data.objects array
      objectsToProcess = metadata.data.objects;
      console.log(`Found ${objectsToProcess.length} objects in nested data format`);
    } else if (typeof metadata === 'object' && !Array.isArray(metadata)) {
      // Object format (key-value pairs of objects)
      // Convert to array for processing
      objectsToProcess = Object.entries(metadata).map(([name, details]: [string, any]) => ({
        name,
        label: details.label || name,
        fields: Array.isArray(details.fields) ? details.fields : 
          Object.entries(details.fields || {}).map(([fieldName, fieldDetails]: [string, any]) => ({
            name: fieldName,
            ...fieldDetails
          })),
        relationships: details.relationships || []
      }));
      console.log(`Converted object format to array with ${objectsToProcess.length} objects`);
    }
    
    if (objectsToProcess.length === 0) {
      console.warn("No objects found in metadata");
      return { objects: [] };
    }
    
    const enhancedObjects: ObjectMetadata[] = objectsToProcess.map(obj => {
      const relationships: RelationshipMetadata[] = [];
      
      // Process fields to extract relationships
      // First ensure fields is an array
      const fieldsArray = Array.isArray(obj.fields) ? obj.fields : 
        Object.entries(obj.fields || {}).map(([name, details]: [string, any]) => ({
          name,
          ...details
        }));
      
      const enhancedFields = (fieldsArray || []).map((field: any) => {
        // Check if field is a relationship field
        if (field.type === 'reference' && field.referenceTo) {
          // Determine relationship type
          const type = field.relationshipName?.endsWith('__r') ? 'MasterDetail' : 'Lookup';
          
          // Convert referenceTo to array if it's not already
          const referenceToArray = Array.isArray(field.referenceTo) ? 
            field.referenceTo : [field.referenceTo];
          
          // Add to relationships array
          relationships.push({
            name: field.relationshipName || `${field.name}Rel`,
            field: field.name,
            object: referenceToArray[0],
            type: type as 'Lookup' | 'MasterDetail',
          });
        }
        
        return {
          name: field.name,
          label: field.label || field.name,
          type: field.type,
          required: field.required || field.nillable === false || false,
          unique: field.unique || false,
          externalId: field.externalId || false,
          precision: field.precision,
          scale: field.scale,
          length: field.length,
          referenceTo: field.referenceTo,
          relationshipName: field.relationshipName,
        } as FieldMetadata;
      });
      
      // Process existing relationships data if available
      if (obj.relationships && Array.isArray(obj.relationships)) {
        obj.relationships.forEach((rel: any) => {
          if (!relationships.some(r => r.name === rel.name)) {
            relationships.push({
              name: rel.name,
              field: rel.field || rel.fieldName || '',
              object: rel.object || rel.referenceTo,
              type: rel.type || 'Lookup',
              childObject: rel.childObject,
              childField: rel.childField,
            });
          }
        });
      }
      
      return {
        name: obj.name,
        label: obj.label || obj.name,
        apiName: obj.apiName || obj.name,
        fields: enhancedFields,
        relationships,
        custom: obj.name.includes('__c'),
      } as ObjectMetadata;
    });
    
    console.log(`Processed ${enhancedObjects.length} objects with relationships`);
    return { objects: enhancedObjects };
  };

  const processedMetadata = processMetadata();
  
  // Filter objects based on search and settings
  const filteredObjects = processedMetadata.objects.filter(obj => {
    const matchesSearch = !searchQuery || 
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      obj.label.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTypeFilter = 
      (obj.custom && showCustomObjects) || 
      (!obj.custom && showStandardObjects);
    
    return matchesSearch && matchesTypeFilter;
  });

  // Set up Cytoscape when component mounts or metadata changes
  useEffect(() => {
    if (!cyRef.current) return;
    
    // Initialize Cytoscape
    cy.current = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#0176d3',
            'width': '90px', // Slightly wider for better text accommodation
            'height': '90px', // Slightly taller to accommodate wrapped text
            'shape': 'round-rectangle', // Rounded squares instead of circles
            'color': 'white',
            'font-weight': 'bold',
            'text-wrap': 'wrap', // Enable text wrapping
            'text-max-width': '80px', // Increase max width for text to reduce wrapping
            'font-size': '12px', // Slightly larger font for better readability
            'text-margin-y': 5, // Add vertical margin (in px) for better text positioning
            'text-outline-width': 0, // Remove text outline for cleaner appearance
            'text-outline-opacity': 0,
            'text-background-opacity': 0.2, // Slight background behind text for better contrast
            'text-background-color': '#000',
            'text-background-padding': '3px',
          }
        },
        {
          selector: 'node.standard',
          style: {
            'background-color': '#0176d3',
          }
        },
        {
          selector: 'node.custom',
          style: {
            'background-color': '#ff9e2c',
          }
        },
        {
          selector: 'node.selected',
          style: {
            'border-width': 3,
            'border-color': '#16325c',
            'font-size': '12px',
          }
        },
        {
          selector: 'node.hidden',
          style: {
            'display': 'none',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#5a7d9a', // Default blue for lookup
            'target-arrow-color': '#5a7d9a',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          }
        },
        {
          selector: 'edge.lookup',
          style: {
            'line-color': '#5a7d9a', // Blue for lookup
            'target-arrow-color': '#5a7d9a',
          }
        },
        {
          selector: 'edge.masterdetail',
          style: {
            'line-color': '#ea8c55', // Orange for master-detail
            'target-arrow-color': '#ea8c55',
            'width': 3,
          }
        },
        {
          selector: 'edge.selfjoin',
          style: {
            'line-color': '#8a49a8', // Purple for self-join
            'target-arrow-color': '#8a49a8',
            'curve-style': 'bezier',
          }
        },
        {
          selector: 'edge.manytomany',
          style: {
            'line-color': '#3EB489', // Green for many-to-many
            'target-arrow-color': '#3EB489',
            'target-arrow-shape': 'diamond',
          }
        },
        {
          selector: 'edge.hidden',
          style: {
            'display': 'none',
          }
        },
      ],
      layout: {
        name: selectedLayout,
        padding: 30,
        // We cast to any here because the TypeScript definitions for Cytoscape aren't complete
        // Additional properties like animate and fit are commonly used but not in the type definitions
      } as any,
      wheelSensitivity: 0.3,
    });

    // Add nodes (objects) with uniform size
    filteredObjects.forEach(obj => {
      cy.current?.add({
        group: 'nodes',
        data: { 
          id: obj.name, 
          label: obj.label,
          // No longer using dynamic sizing since we want uniform node sizes
        },
        classes: obj.custom ? 'custom' : 'standard'
      });
    });

    // Add edges (relationships)
    filteredObjects.forEach(obj => {
      obj.relationships.forEach(rel => {
        // Only add relationship if both objects are in the graph
        if (filteredObjects.some(o => o.name === rel.object)) {
          // Convert the relationship type to a valid class name without spaces
          // and ensure it matches one of our expected types
          const typeClass = rel.type.toLowerCase().replace(/[- ]/g, '');
          const normalizedType = 
            typeClass.includes('master') ? 'masterdetail' :
            typeClass.includes('self') ? 'selfjoin' :
            typeClass.includes('many') ? 'manytomany' : 'lookup';
          
          cy.current?.add({
            group: 'edges',
            data: {
              id: `${obj.name}-${rel.name}-${rel.object}`,
              source: obj.name,
              target: rel.object,
              type: normalizedType // Store normalized type
            },
            classes: normalizedType // Use consistent class name
          });
        }
      });
    });

    // Set up event handlers
    cy.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      cy.current?.elements().removeClass('selected');
      node.addClass('selected');
      
      // Find the corresponding object and update selected object
      const selectedObj = processedMetadata.objects.find(obj => obj.name === node.id());
      if (selectedObj) {
        setSelectedObject(selectedObj);
        setRightPanelCollapsed(false);
      }
    });

    cy.current.on('tap', (evt) => {
      if (evt.target === cy.current) {
        // Clicked on background
        cy.current?.elements().removeClass('selected');
        setSelectedObject(null);
      }
    });

    // Run layout
    cy.current.layout({ name: selectedLayout, animate: true } as any).run();

    // Cleanup
    return () => {
      if (cy.current) {
        cy.current.destroy();
        cy.current = null;
      }
    };
  }, [metadata, filteredObjects, selectedLayout]);

  // Effect to update visibility based on relationship types
  useEffect(() => {
    if (!cy.current) return;
    
    // Apply filters to all edges based on their type
    cy.current.edges().forEach(edge => {
      const type = edge.data('type');
      
      // Check if we should show this type of relationship
      if (type === 'lookup' && !relationshipTypes.lookup) {
        edge.addClass('hidden');
      } else if (type === 'masterdetail' && !relationshipTypes.masterDetail) {
        edge.addClass('hidden');
      } else if (type === 'selfjoin' && !relationshipTypes.selfJoin) {
        edge.addClass('hidden');
      } else if (type === 'manytomany' && !relationshipTypes.manyToMany) {
        edge.addClass('hidden');
      } else {
        edge.removeClass('hidden');
      }
    });
    
    // Apply styles to ensure correct colors
    cy.current.style()
      .selector('edge.lookup').style({
        'line-color': '#5a7d9a',
        'target-arrow-color': '#5a7d9a',
      })
      .selector('edge.masterdetail').style({
        'line-color': '#ea8c55',
        'target-arrow-color': '#ea8c55',
        'width': 3,
      })
      .selector('edge.selfjoin').style({
        'line-color': '#8a49a8',
        'target-arrow-color': '#8a49a8',
      })
      .selector('edge.manytomany').style({
        'line-color': '#3EB489',
        'target-arrow-color': '#3EB489',
        'target-arrow-shape': 'diamond',
      })
      .update();
      
  }, [relationshipTypes]);

  // Effect to filter based on search
  useEffect(() => {
    if (!cy.current) return;
    
    cy.current.elements().removeClass('hidden');
    
    if (!searchQuery) return;
    
    cy.current.nodes().forEach(node => {
      const matches = node.data('label').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      node.id().toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matches) {
        node.addClass('hidden');
        // Hide connected edges
        node.connectedEdges().addClass('hidden');
      }
    });
  }, [searchQuery]);

  // Update layout when it changes from internal state or prop
  useEffect(() => {
    if (!cy.current) return;
    cy.current.layout({ name: selectedLayout, animate: true } as any).run();
  }, [selectedLayout]);
  
  // Update selected layout when propLayout changes
  useEffect(() => {
    setSelectedLayout(propLayout);
  }, [propLayout]);

  // Handle zoom controls
  const handleZoomIn = () => {
    if (!cy.current) return;
    cy.current.zoom(cy.current.zoom() * 1.2);
  };

  const handleZoomOut = () => {
    if (!cy.current) return;
    cy.current.zoom(cy.current.zoom() / 1.2);
  };

  const handleReset = () => {
    if (!cy.current) return;
    cy.current.fit();
  };

  // Handle panel toggle
  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  };

  // Check if there's any data to display
  const hasData = processedMetadata.objects.length > 0;

  // If no data, show a message instead
  if (!hasData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h3 className="text-xl font-medium text-neutral-700 mb-3">No Object Metadata Available</h3>
          <p className="text-neutral-600 mb-6">
            To visualize your Salesforce data model, you need to connect a Salesforce organization first.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" className="flex items-center" asChild>
              <a href="/">
                <div className="mr-2">←</div> Go to Dashboard
              </a>
            </Button>
            <Button className="flex items-center">
              <div className="mr-2">+</div> Connect Salesforce Org
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full bg-white">
      {/* Left Panel */}
      <div 
        className={`h-full bg-white border-r border-neutral-200 transition-all duration-300 ${
          leftPanelCollapsed ? 'w-0 overflow-hidden' : 'w-72'
        }`}
      >
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-semibold text-neutral-700">Controls</h3>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-54px)]">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Objects</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <div className="flex">
                <Input 
                  type="text" 
                  placeholder="Search by name..." 
                  className="pl-8 rounded-r-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  className="rounded-l-none"
                  onClick={() => handleSearch()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Layout Selection */}
          <div className="space-y-2">
            <Label>Layout Algorithm</Label>
            <Select
              value={selectedLayout}
              onValueChange={setSelectedLayout}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layout..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cose">Force-Directed (Default)</SelectItem>
                <SelectItem value="circle">Circular</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="concentric">Concentric</SelectItem>
                <SelectItem value="breadthfirst">Hierarchical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Object Filters */}
          <div className="space-y-2">
            <Label>Object Types</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="standardObjects" 
                  checked={showStandardObjects} 
                  onCheckedChange={() => setShowStandardObjects(!showStandardObjects)}
                />
                <label 
                  htmlFor="standardObjects" 
                  className="text-sm cursor-pointer"
                >
                  Standard Objects
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="customObjects" 
                  checked={showCustomObjects} 
                  onCheckedChange={() => setShowCustomObjects(!showCustomObjects)}
                />
                <label 
                  htmlFor="customObjects" 
                  className="text-sm cursor-pointer"
                >
                  Custom Objects
                </label>
              </div>
            </div>
          </div>
          
          {/* Relationship Filters */}
          <div className="space-y-2">
            <Label>Relationship Types</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lookupRel" 
                  checked={relationshipTypes.lookup} 
                  onCheckedChange={() => setRelationshipTypes({...relationshipTypes, lookup: !relationshipTypes.lookup})}
                />
                <label 
                  htmlFor="lookupRel" 
                  className="text-sm cursor-pointer flex items-center space-x-2"
                >
                  <span className="w-6 h-1 bg-[#5a7d9a] inline-block"></span>
                  <span>Lookup</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="masterDetailRel" 
                  checked={relationshipTypes.masterDetail} 
                  onCheckedChange={() => setRelationshipTypes({...relationshipTypes, masterDetail: !relationshipTypes.masterDetail})}
                />
                <label 
                  htmlFor="masterDetailRel" 
                  className="text-sm cursor-pointer flex items-center space-x-2"
                >
                  <span className="w-6 h-1 bg-[#ea8c55] inline-block"></span>
                  <span>Master-Detail</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="selfJoinRel" 
                  checked={relationshipTypes.selfJoin} 
                  onCheckedChange={() => setRelationshipTypes({...relationshipTypes, selfJoin: !relationshipTypes.selfJoin})}
                />
                <label 
                  htmlFor="selfJoinRel" 
                  className="text-sm cursor-pointer flex items-center space-x-2"
                >
                  <span className="w-6 h-1 bg-[#8a49a8] inline-block"></span>
                  <span>Self-Join</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="manyToManyRel" 
                  checked={relationshipTypes.manyToMany} 
                  onCheckedChange={() => setRelationshipTypes({...relationshipTypes, manyToMany: !relationshipTypes.manyToMany})}
                />
                <label 
                  htmlFor="manyToManyRel" 
                  className="text-sm cursor-pointer flex items-center space-x-2"
                >
                  <span className="w-6 h-1 bg-[#3EB489] inline-block"></span>
                  <span>Many-to-Many</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Left Panel Toggle Button (on the right edge of the left panel) */}
      <button 
        onClick={toggleLeftPanel}
        className="absolute top-1/2 -translate-y-1/2 bg-primary-600 text-white h-8 w-6 rounded-r-md flex items-center justify-center z-10 transition-all duration-300 shadow-md"
        style={{ 
          left: leftPanelCollapsed ? 0 : 72, // Width of the left panel is w-72 (72px)
          transform: 'translateY(-50%)', // Keep transform consistent
        }}
        aria-label={leftPanelCollapsed ? "Show controls panel" : "Hide controls panel"}
      >
        {leftPanelCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex bg-white rounded-md shadow-sm">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw size={16} />
          </Button>
        </div>
        
        {/* Graph Container */}
        <div 
          ref={cyRef} 
          className="w-full h-full"
        >
          {!cy.current && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel */}
      <div 
        className={`h-full bg-white border-l border-neutral-200 transition-all duration-300 overflow-hidden ${
          rightPanelCollapsed ? 'w-0' : 'w-80'
        }`}
      >
        {selectedObject ? (
          <>
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-lg font-semibold text-neutral-700">
                {selectedObject.label}
                <Badge 
                  variant={selectedObject.custom ? "secondary" : "outline"} 
                  className="ml-2"
                >
                  {selectedObject.custom ? 'Custom' : 'Standard'}
                </Badge>
              </h3>
              <p className="text-sm text-neutral-500 mt-1">{selectedObject.name}</p>
            </div>
            
            <div className="p-4 overflow-y-auto h-[calc(100%-54px)]">
              <Tabs defaultValue="fields">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="fields" className="flex-1">Fields</TabsTrigger>
                  <TabsTrigger value="relationships" className="flex-1">Relationships</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fields">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                      <tr>
                        <th className="px-2 py-2">Field</th>
                        <th className="px-2 py-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedObject.fields.sort((a, b) => a.name.localeCompare(b.name)).map((field) => (
                        <tr key={field.name} className="border-b border-neutral-200 hover:bg-neutral-50">
                          <td className="px-2 py-2 font-medium">
                            {field.label}
                            {field.required && (
                              <Badge variant="destructive" className="ml-1 px-1 py-0">
                                *
                              </Badge>
                            )}
                            <div className="text-xs text-neutral-500">{field.name}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div>{field.type}</div>
                            {field.unique && <Badge className="mt-1 px-1 py-0">Unique</Badge>}
                            {field.externalId && <Badge className="mt-1 px-1 py-0">External ID</Badge>}
                            {field.referenceTo && (
                              <div className="text-xs text-primary-600 mt-1">
                                → {Array.isArray(field.referenceTo) ? field.referenceTo.join(', ') : field.referenceTo}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TabsContent>
                
                <TabsContent value="relationships">
                  {selectedObject.relationships.length === 0 ? (
                    <p className="text-neutral-500 text-sm p-4">No relationships defined</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedObject.relationships.map((rel) => (
                        <Card key={rel.name} className="overflow-hidden">
                          <div className="flex items-center">
                            <div 
                              className={`w-1 self-stretch ${
                                rel.type === 'MasterDetail' ? 'bg-[#ea8c55]' : 
                                rel.type === 'SelfJoin' ? 'bg-[#8a49a8]' : 
                                rel.type === 'ManyToMany' ? 'bg-[#3EB489]' : 
                                'bg-[#5a7d9a]'
                              }`}
                            />
                            <CardContent className="p-3 flex-1">
                              <div className="font-medium">{rel.name}</div>
                              <div className="text-sm text-neutral-600">
                                Type: {rel.type}
                              </div>
                              <div className="text-sm text-neutral-600">
                                Related Object: {rel.object}
                              </div>
                              {rel.field && (
                                <div className="text-sm text-neutral-600">
                                  Field: {rel.field}
                                </div>
                              )}
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-neutral-500">
            <p>Select an object to view details</p>
          </div>
        )}
      </div>
      
      {/* Right Panel Toggle Button (on the left edge of the right panel) */}
      <button 
        onClick={toggleRightPanel}
        className="absolute top-1/2 -translate-y-1/2 bg-primary-600 text-white h-8 w-6 rounded-l-md flex items-center justify-center z-10 transition-all duration-300 shadow-md"
        style={{ 
          right: rightPanelCollapsed ? 0 : 80, // Width of right panel is w-80 (80px)
          transform: 'translateY(-50%)' // Keep transform consistent
        }}
        aria-label={rightPanelCollapsed ? "Show details panel" : "Hide details panel"}
      >
        {rightPanelCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
}