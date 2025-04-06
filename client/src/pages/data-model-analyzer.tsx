import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EnhancedSchemaVisualizer from "@/components/data-model/enhanced-schema-visualizer";
import TableView from "@/components/data-model/table-view";
import { useOrg } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, RefreshCw, AlertCircle, Info, Database, Filter } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockSalesforceMetadata } from "@/lib/mock-data";

// Improved type definitions for field metadata
interface FieldMetadata {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  referenceTo?: string | string[];
  relationshipName?: string;
  precision?: number;
  scale?: number;
  length?: number;
  picklistValues?: Array<{ label: string; value: string; }>;
  defaultValue?: any;
  description?: string;
  isCustom?: boolean;
}

// Improved type definitions for relationship metadata
interface RelationshipMetadata {
  name: string;
  field?: string;
  object: string;
  type: string; // Changed from enum to string to accommodate mock data
  childObject?: string;
  childField?: string;
}

// Improved type definitions for object metadata
interface ObjectData {
  name: string;
  label: string;
  apiName?: string;
  custom?: boolean; // Added to match mock data structure
  isCustom?: boolean; // Kept for backwards compatibility with existing code
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
}

interface ObjectMetadata {
  objects: ObjectData[];
}

export default function DataModelAnalyzer() {
  const { activeOrg } = useOrg();
  // Enhanced Visualizer toggle switches between Graph View (Cytoscape.js) and Tabular View
  // Do NOT render both views simultaneously – unmount one completely on toggle
  // Layout dropdown permanently removed
  const [useGraphView, setUseGraphView] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedObjectName, setSelectedObjectName] = useState<string>("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string>("cose"); // Default layout

  // Fetch metadata for active org
  const { data: metadata, isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg,
  });

  // Sync metadata if none exists or when sync button is clicked
  const syncMetadata = async () => {
    if (!activeOrg) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {
        types: ["CustomObject", "SObjects"] // Ensure we specifically request object metadata
      });
      
      // Refetch the metadata after sync
      await refetch();
      setIsSyncing(false);
    } catch (error) {
      console.error("Error syncing metadata:", error);
      setSyncError("Failed to sync metadata. Please try again.");
      setIsSyncing(false);
    }
  };

  // Sync metadata if none exists on initial load
  useEffect(() => {
    if (activeOrg && !isLoading && (!metadata || metadata.length === 0)) {
      syncMetadata();
    }
  }, [activeOrg, metadata, isLoading]);

  // Log the raw metadata for debugging
  console.log("Raw metadata from server:", metadata);
  
  // Process object metadata from API response with improved error handling
  const processMetadata = (): ObjectMetadata | null => {
    if (!metadata) return null;
    
    try {
      // 1. Try to find CustomObject in an array of metadata items
      if (Array.isArray(metadata)) {
        console.log("Metadata is an array with", metadata.length, "items");
        
        // Look for CustomObject data
        const customObjectItem = metadata.find((m: any) => m.type === 'CustomObject');
        if (customObjectItem?.data) {
          console.log("Found CustomObject metadata");
          
          // Check if data.items exists (common format)
          if (Array.isArray(customObjectItem.data.items)) {
            return {
              objects: customObjectItem.data.items.map((item: any) => ({
                name: item.name,
                label: item.label || item.name,
                apiName: item.name,
                fields: Array.isArray(item.fields) ? item.fields.map((field: any) => ({
                  ...field,
                  label: field.label || field.name
                })) : [],
                relationships: Array.isArray(item.relationships) ? item.relationships : [],
                isCustom: item.name.includes('__c')
              }))
            };
          }
          
          // Otherwise, use the data directly if it has the expected structure
          if (Array.isArray(customObjectItem.data)) {
            return {
              objects: customObjectItem.data.map((item: any) => ({
                name: item.name,
                label: item.label || item.name,
                apiName: item.name,
                fields: Array.isArray(item.fields) ? item.fields.map((field: any) => ({
                  ...field,
                  label: field.label || field.name
                })) : [],
                relationships: Array.isArray(item.relationships) ? item.relationships : [],
                isCustom: item.name.includes('__c')
              }))
            };
          }
        }
        
        // Look for SObjects data as a fallback
        const sobjectsItem = metadata.find((m: any) => m.type === 'SObjects' || m.name === 'SObjectStructure');
        if (sobjectsItem?.data) {
          console.log("Creating object model from SObjects data");
          
          if (typeof sobjectsItem.data === 'object' && !Array.isArray(sobjectsItem.data)) {
            return {
              objects: Object.entries(sobjectsItem.data).map(([name, details]: [string, any]) => ({
                name,
                label: details.label || name,
                apiName: name,
                fields: typeof details.fields === 'object' && !Array.isArray(details.fields) ?
                  Object.entries(details.fields).map(([fieldName, fieldDetails]: [string, any]) => ({
                    name: fieldName,
                    label: fieldDetails.label || fieldName,
                    type: fieldDetails.type || 'string',
                    ...fieldDetails
                  })) : Array.isArray(details.fields) ? details.fields : [],
                relationships: Array.isArray(details.relationships) ? details.relationships : [],
                isCustom: name.includes('__c')
              }))
            };
          }
        }
        
        // Try to construct from individual object metadata items
        const customObjectItems = metadata.filter((m: any) => 
          (m.type === 'CustomObject' || m.type === 'SObject') && 
          m.name !== 'CustomObjectStructure' && 
          m.name !== 'SObjectStructure'
        );
        
        if (customObjectItems.length > 0) {
          console.log(`Found ${customObjectItems.length} individual object items`);
          return {
            objects: customObjectItems.map((item: any) => ({
              name: item.name,
              label: item.label || item.name,
              apiName: item.name,
              fields: Array.isArray(item.fields) ? item.fields : 
                (item.data && Array.isArray(item.data.fields)) ? item.data.fields : [],
              relationships: Array.isArray(item.relationships) ? item.relationships : 
                (item.data && Array.isArray(item.data.relationships)) ? item.data.relationships : [],
              isCustom: item.name.includes('__c')
            }))
          };
        }
      }
      
      // 2. If metadata itself is the object metadata with objects array
      if (!Array.isArray(metadata) && metadata && typeof metadata === 'object' && 'objects' in metadata && Array.isArray((metadata as any).objects)) {
        console.log("Found direct objects array in metadata");
        return metadata as ObjectMetadata;
      }
      
      // 3. If we can't process it from the available formats, return null
      console.log("Could not process metadata from the available formats");
      return null;
    } catch (error) {
      console.error("Error processing metadata:", error);
      return null;
    }
  };
  
  // Get processed metadata
  const objectMetadata = processMetadata();
  
  // Log the result for debugging
  if (objectMetadata) {
    console.log("Processed object metadata with", objectMetadata.objects?.length || 0, "objects");
  } else {
    console.log("Could not extract object metadata from the response");
  }
  
  // Get the selected object details
  const selectedObject = selectedObjectName 
    ? objectMetadata?.objects.find(obj => obj.name === selectedObjectName) 
    : null;

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Data Model Header */}
        <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Data Model Analyzer</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Visualize and analyze your Salesforce object model
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Graph View</span>
              <Switch 
                checked={useGraphView} 
                onCheckedChange={setUseGraphView} 
              />
            </div>
            {activeOrg && (
              <Button 
                onClick={syncMetadata} 
                variant="outline" 
                disabled={isSyncing}
                className="flex items-center"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> 
                    Sync Metadata
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {syncError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}
        
        {!activeOrg && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>No Salesforce Org Connected</AlertTitle>
            <AlertDescription>
              Please connect to a Salesforce organization to analyze its data model.
            </AlertDescription>
          </Alert>
        )}
        
        {/* KPI Stats Panel */}
        {objectMetadata && objectMetadata.objects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-500 mb-1">Total Objects</p>
                  <h3 className="text-3xl font-bold text-neutral-800">{objectMetadata.objects.length}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-500 mb-1">Total Fields</p>
                  <h3 className="text-3xl font-bold text-neutral-800">
                    {objectMetadata.objects.reduce((sum, obj) => sum + (obj.fields?.length || 0), 0)}
                  </h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-500 mb-1">Custom vs Standard</p>
                  <h3 className="text-3xl font-bold text-neutral-800">
                    <span className="text-amber-500">{objectMetadata.objects.filter(obj => obj.isCustom).length}</span>
                    <span className="text-xl text-neutral-400 mx-1">/</span>
                    <span className="text-blue-500">{objectMetadata.objects.filter(obj => !obj.isCustom).length}</span>
                  </h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-500 mb-1">Custom Fields %</p>
                  <h3 className="text-3xl font-bold text-neutral-800">
                    {Math.round(
                      (objectMetadata.objects.reduce(
                        (sum, obj) => sum + (obj.fields?.filter(f => f.isCustom)?.length || 0), 0
                      ) / 
                      Math.max(1, objectMetadata.objects.reduce(
                        (sum, obj) => sum + (obj.fields?.length || 0), 0
                      ))) * 100
                    )}%
                  </h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-500 mb-1">Most Referenced</p>
                  <h3 className="text-xl font-bold text-neutral-800 truncate">
                    {(() => {
                      const refCounts = new Map<string, number>();
                      objectMetadata.objects.forEach(obj => {
                        obj.relationships?.forEach(rel => {
                          const count = refCounts.get(rel.object) || 0;
                          refCounts.set(rel.object, count + 1);
                        });
                      });
                      const entries = Array.from(refCounts.entries());
                      if (entries.length === 0) return "None";
                      entries.sort((a, b) => b[1] - a[1]);
                      return entries[0][0];
                    })()}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="graph" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="graph">Graph View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="details">Field Details</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="graph">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between py-3">
                <CardTitle>Object Relationship Map</CardTitle>
                {objectMetadata && objectMetadata.objects.length > 0 && (
                  <div className="text-sm text-neutral-500">
                    {objectMetadata.objects.length} objects found
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0 h-[calc(100vh-280px)] min-h-[500px]">
                {isLoading || isSyncing ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
                      <p className="text-neutral-600">
                        {isSyncing ? 'Syncing metadata from Salesforce...' : 'Loading object metadata...'}
                      </p>
                    </div>
                  </div>
                ) : !activeOrg ? (
                  <div className="h-[calc(100vh-280px)]">
                    {useGraphView ? (
                      <EnhancedSchemaVisualizer metadata={mockSalesforceMetadata} selectedLayout={selectedLayout} />
                    ) : (
                      <TableView metadata={mockSalesforceMetadata} />
                    )}
                  </div>
                ) : !objectMetadata || objectMetadata.objects.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                      <h3 className="text-xl font-medium text-neutral-700 mb-3">No Metadata Available</h3>
                      <p className="text-neutral-600 mb-6">
                        We couldn't find any object metadata for this organization. This may happen if the sync process hasn't completed or if there was an issue retrieving the metadata.
                      </p>
                      <Button
                        onClick={syncMetadata}
                        className="flex items-center"
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" /> 
                            Sync Metadata
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : useGraphView ? (
                  <EnhancedSchemaVisualizer 
                    metadata={objectMetadata} 
                    selectedLayout={selectedLayout}
                  />
                ) : (
                  <TableView 
                    metadata={objectMetadata}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Objects List</CardTitle>
                  {objectMetadata && (
                    <CardDescription>
                      Showing {objectMetadata.objects.length} objects from your Salesforce org
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading || isSyncing ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
                      <p className="text-neutral-600">
                        {isSyncing ? 'Syncing metadata from Salesforce...' : 'Loading object metadata...'}
                      </p>
                    </div>
                  </div>
                ) : !activeOrg ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                        <tr>
                          <th className="px-6 py-3">Object Name</th>
                          <th className="px-6 py-3">Label</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Fields</th>
                          <th className="px-6 py-3">Relationships</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockSalesforceMetadata.objects.map((obj) => (
                          <tr key={obj.name} className="border-b hover:bg-neutral-50">
                            <td className="px-6 py-4 font-medium">{obj.name}</td>
                            <td className="px-6 py-4">{obj.label}</td>
                            <td className="px-6 py-4">
                              <Badge variant={obj.custom ? "secondary" : "outline"}>
                                {obj.custom ? "Custom" : "Standard"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">{obj.fields?.length || 0}</td>
                            <td className="px-6 py-4">{obj.relationships?.length || 0}</td>
                            <td className="px-6 py-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedObjectName(obj.name)}
                              >
                                View Fields
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !objectMetadata || objectMetadata.objects.length === 0 ? (
                  <div className="h-64 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">No Metadata Available</h3>
                      <p className="text-neutral-600 mb-4">
                        Sync the organization metadata to see objects.
                      </p>
                      <Button
                        onClick={syncMetadata}
                        variant="outline"
                        size="sm"
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" /> 
                            Sync Metadata
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                        <tr>
                          <th className="px-6 py-3">Object Name</th>
                          <th className="px-6 py-3">Label</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Fields</th>
                          <th className="px-6 py-3">Relationships</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {objectMetadata.objects.map((obj) => (
                          <tr key={obj.name} className="border-b hover:bg-neutral-50">
                            <td className="px-6 py-4 font-medium">{obj.name}</td>
                            <td className="px-6 py-4">{obj.label}</td>
                            <td className="px-6 py-4">
                              <Badge variant={obj.isCustom ? "secondary" : "outline"}>
                                {obj.isCustom ? "Custom" : "Standard"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">{obj.fields?.length || 0}</td>
                            <td className="px-6 py-4">{obj.relationships?.length || 0}</td>
                            <td className="px-6 py-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedObjectName(obj.name)}
                              >
                                View Fields
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Field Details</CardTitle>
                <CardDescription>
                  Examine fields, data types, and relationships for Salesforce objects
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading || isSyncing ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
                      <p className="text-neutral-600">
                        {isSyncing ? 'Syncing metadata from Salesforce...' : 'Loading object metadata...'}
                      </p>
                    </div>
                  </div>
                ) : !activeOrg ? (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center space-x-4 mb-2">
                        <Database className="h-5 w-5 text-neutral-500" />
                        <h3 className="text-lg font-medium text-neutral-700">Select Object</h3>
                      </div>
                      <Select
                        value={selectedObjectName}
                        onValueChange={setSelectedObjectName}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an object" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSalesforceMetadata.objects
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map((obj) => (
                              <SelectItem key={obj.name} value={obj.name}>
                                {obj.label} ({obj.name})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedObjectName ? (
                      (() => {
                        const mockSelectedObject = mockSalesforceMetadata.objects.find(obj => obj.name === selectedObjectName);
                        if (!mockSelectedObject) return null;
                        
                        return (
                          <div>
                            <div className="mb-4 flex justify-between items-center">
                              <div>
                                <h3 className="text-xl font-semibold">{mockSelectedObject.label}</h3>
                                <p className="text-sm text-neutral-500">API Name: {mockSelectedObject.name}</p>
                              </div>
                              <Badge variant={mockSelectedObject.custom ? "secondary" : "outline"}>
                                {mockSelectedObject.custom ? "Custom Object" : "Standard Object"}
                              </Badge>
                            </div>
                            
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-4">
                                <h4 className="text-md font-medium">Fields</h4>
                                <Badge variant="outline">{mockSelectedObject.fields.length}</Badge>
                              </div>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                  <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                                    <tr>
                                      <th className="px-4 py-2">Field Label</th>
                                      <th className="px-4 py-2">API Name</th>
                                      <th className="px-4 py-2">Data Type</th>
                                      <th className="px-4 py-2">Required</th>
                                      <th className="px-4 py-2">Unique</th>
                                      <th className="px-4 py-2">Relationship</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mockSelectedObject.fields.map((field) => (
                                      <tr key={field.name} className="border-b hover:bg-neutral-50">
                                        <td className="px-4 py-2 font-medium">{field.label}</td>
                                        <td className="px-4 py-2">{field.name}</td>
                                        <td className="px-4 py-2">
                                          <Badge variant="outline" className="capitalize">
                                            {field.type}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                          {field.required ? "Yes" : "No"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {field.unique ? "Yes" : "No"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {field.referenceTo ? (
                                            <Badge variant="secondary">
                                              {Array.isArray(field.referenceTo) 
                                                ? field.referenceTo.join(', ') 
                                                : field.referenceTo}
                                            </Badge>
                                          ) : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            
                            {mockSelectedObject.relationships && mockSelectedObject.relationships.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <h4 className="text-md font-medium">Relationships</h4>
                                  <Badge variant="outline">{mockSelectedObject.relationships.length}</Badge>
                                </div>
                                
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                                      <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Related Object</th>
                                        <th className="px-4 py-2">Field</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {mockSelectedObject.relationships.map((rel, index) => (
                                        <tr key={index} className="border-b hover:bg-neutral-50">
                                          <td className="px-4 py-2 font-medium">{rel.name}</td>
                                          <td className="px-4 py-2">
                                            <Badge 
                                              variant="secondary"
                                            >
                                              {rel.type}
                                            </Badge>
                                          </td>
                                          <td className="px-4 py-2">{rel.object}</td>
                                          <td className="px-4 py-2">{rel.field || "-"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center p-8 bg-neutral-50 rounded-md">
                        <Filter className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-700 mb-2">No Object Selected</h3>
                        <p className="text-neutral-600">
                          Select an object from the dropdown to view its field details.
                        </p>
                      </div>
                    )}
                  </div>
                ) : !objectMetadata || objectMetadata.objects.length === 0 ? (
                  <div className="h-64 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">No Metadata Available</h3>
                      <p className="text-neutral-600 mb-4">
                        Sync the organization metadata to see field details.
                      </p>
                      <Button
                        onClick={syncMetadata}
                        variant="outline"
                        size="sm"
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" /> 
                            Sync Metadata
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center space-x-4 mb-2">
                        <Database className="h-5 w-5 text-neutral-500" />
                        <h3 className="text-lg font-medium text-neutral-700">Select Object</h3>
                      </div>
                      <Select
                        value={selectedObjectName}
                        onValueChange={setSelectedObjectName}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an object" />
                        </SelectTrigger>
                        <SelectContent>
                          {objectMetadata.objects
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map((obj) => (
                              <SelectItem key={obj.name} value={obj.name}>
                                {obj.label} ({obj.name})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedObject ? (
                      <div>
                        <div className="mb-4 flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-semibold">{selectedObject.label}</h3>
                            <p className="text-sm text-neutral-500">API Name: {selectedObject.name}</p>
                          </div>
                          <Badge variant={selectedObject.isCustom ? "secondary" : "outline"}>
                            {selectedObject.isCustom ? "Custom Object" : "Standard Object"}
                          </Badge>
                        </div>
                        
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-4">
                            <h4 className="text-md font-medium">Fields</h4>
                            <Badge variant="outline">{selectedObject.fields.length}</Badge>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                                <tr>
                                  <th className="px-4 py-2">Field Label</th>
                                  <th className="px-4 py-2">API Name</th>
                                  <th className="px-4 py-2">Data Type</th>
                                  <th className="px-4 py-2">Required</th>
                                  <th className="px-4 py-2">Unique</th>
                                  <th className="px-4 py-2">Relationship</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedObject.fields.map((field) => (
                                  <tr key={field.name} className="border-b hover:bg-neutral-50">
                                    <td className="px-4 py-2 font-medium">{field.label}</td>
                                    <td className="px-4 py-2">{field.name}</td>
                                    <td className="px-4 py-2">
                                      <Badge variant="outline" className="capitalize">
                                        {field.type}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                      {field.required ? "Yes" : "No"}
                                    </td>
                                    <td className="px-4 py-2">
                                      {field.unique ? "Yes" : "No"}
                                    </td>
                                    <td className="px-4 py-2">
                                      {field.referenceTo ? (
                                        <Badge variant="secondary">
                                          {Array.isArray(field.referenceTo) 
                                            ? field.referenceTo.join(', ') 
                                            : field.referenceTo}
                                        </Badge>
                                      ) : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        {selectedObject.relationships && selectedObject.relationships.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <h4 className="text-md font-medium">Relationships</h4>
                              <Badge variant="outline">{selectedObject.relationships.length}</Badge>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                                  <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2">Related Object</th>
                                    <th className="px-4 py-2">Field</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedObject.relationships.map((rel, index) => (
                                    <tr key={index} className="border-b hover:bg-neutral-50">
                                      <td className="px-4 py-2 font-medium">{rel.name}</td>
                                      <td className="px-4 py-2">
                                        <Badge 
                                          variant={
                                            rel.type === 'MasterDetail' ? 'destructive' : 
                                            rel.type === 'Lookup' ? 'secondary' :
                                            rel.type === 'SelfJoin' ? 'outline' : 'default'
                                          }
                                        >
                                          {rel.type}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2">{rel.object}</td>
                                      <td className="px-4 py-2">{rel.field || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-neutral-50 rounded-md">
                        <Filter className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-700 mb-2">No Object Selected</h3>
                        <p className="text-neutral-600">
                          Select an object from the dropdown to view detailed field information.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
