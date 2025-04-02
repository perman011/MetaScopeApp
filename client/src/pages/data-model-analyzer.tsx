import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ModelVisualizer from "@/components/data-model/model-visualizer";
import EnhancedSchemaVisualizer from "@/components/data-model/enhanced-schema-visualizer";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";

interface ObjectMetadata {
  objects: Array<{
    name: string;
    label: string;
    fields?: any[];
    relationships?: any[];
  }>;
}

export default function DataModelAnalyzer() {
  const { activeOrg } = useOrgContext();
  const [useEnhancedVisualizer, setUseEnhancedVisualizer] = useState(true);

  // Fetch metadata for active org
  const { data: metadata, isLoading } = useQuery<any[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg,
  });

  // Sync metadata if none exists
  useEffect(() => {
    if (activeOrg && !isLoading && (!metadata || metadata.length === 0)) {
      const syncMetadata = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {});
        } catch (error) {
          console.error("Error syncing metadata:", error);
        }
      };
      syncMetadata();
    }
  }, [activeOrg, metadata, isLoading]);

  // Log the raw metadata for debugging
  console.log("Raw metadata from server:", metadata);
  
  // Filter object metadata from all metadata, or create a placeholder if needed
  let objectMetadata: any = undefined;
  
  // Try different metadata formats
  if (metadata) {
    // 1. Try to find CustomObject in an array of metadata items
    if (Array.isArray(metadata)) {
      console.log("Metadata is an array with", metadata.length, "items");
      
      // Look for CustomObject data
      const customObjectItem = metadata.find((m: any) => m.type === 'CustomObject');
      if (customObjectItem?.data) {
        console.log("Found CustomObject metadata");
        objectMetadata = customObjectItem.data;
      }
      
      // Look for CustomObjectStructure which has the format we need
      const structuredObjectItem = metadata.find((m: any) => m.name === 'CustomObjectStructure');
      if (!objectMetadata && structuredObjectItem?.data) {
        console.log("Found CustomObjectStructure metadata");
        objectMetadata = structuredObjectItem.data;
      }
      
      // Look for SObjects data as a fallback
      const sobjectsItem = metadata.find((m: any) => m.type === 'SObjects' || m.name === 'SObjectStructure');
      if (!objectMetadata && sobjectsItem?.data) {
        console.log("Creating object model from SObjects data");
        objectMetadata = {
          objects: Object.entries(sobjectsItem.data).map(([name, details]: [string, any]) => ({
            name,
            label: details.label || name,
            fields: Object.entries(details.fields || {}).map(([fieldName, fieldDetails]: [string, any]) => ({
              name: fieldName,
              label: fieldDetails.label || fieldName,
              type: fieldDetails.type || 'string',
              ...fieldDetails
            })),
            relationships: details.relationships || []
          }))
        };
      }
      
      // Try to find metadata items and construct object structure if needed
      if (!objectMetadata) {
        // Check if we can find objects directly in the array
        const customObjectItems = metadata.filter((m: any) => m.type === 'CustomObject' && m.name !== 'CustomObjectStructure');
        if (customObjectItems.length > 0) {
          console.log(`Found ${customObjectItems.length} individual object items`);
          objectMetadata = {
            objects: customObjectItems.map((item: any) => ({
              name: item.name,
              label: item.label || item.name,
              fields: item.fields || [],
              relationships: item.relationships || []
            }))
          };
        }
      }
    } 
    // 2. Try direct object metadata
    else if (metadata.objects) {
      console.log("Found direct objects array in metadata");
      objectMetadata = metadata;
    }
    // 3. Try if metadata itself is structured as key-value pairs of objects
    else if (typeof metadata === 'object' && !Array.isArray(metadata)) {
      console.log("Treating metadata as key-value object map");
      objectMetadata = {
        objects: Object.entries(metadata).map(([name, details]: [string, any]) => ({
          name,
          label: details.label || name,
          fields: Array.isArray(details.fields) ? details.fields : 
            Object.entries(details.fields || {}).map(([fieldName, fieldDetails]: [string, any]) => ({
              name: fieldName,
              label: fieldDetails.label || fieldName,
              type: fieldDetails.type || 'string',
              ...fieldDetails
            })),
          relationships: details.relationships || []
        }))
      };
    }
  }
  
  // Log the result for debugging
  if (objectMetadata) {
    console.log("Processed object metadata with", objectMetadata.objects?.length || 0, "objects");
  } else {
    console.log("Could not extract object metadata from the response");
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Data Model Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Data Model Analyzer</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Visualize and analyze your Salesforce object model
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-600">Enhanced Visualizer</span>
            <Switch 
              checked={useEnhancedVisualizer} 
              onCheckedChange={setUseEnhancedVisualizer} 
            />
          </div>
        </div>

        <Tabs defaultValue="graph">
          <TabsList className="mb-4">
            <TabsTrigger value="graph">Graph View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="details">Field Details</TabsTrigger>
          </TabsList>

          <TabsContent value="graph">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Object Relationship Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100vh-280px)] min-h-[500px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : !activeOrg ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                      <h3 className="text-xl font-medium text-neutral-700 mb-3">Connect a Salesforce Org</h3>
                      <p className="text-neutral-600 mb-6">
                        To visualize your Salesforce data model, you need to connect a Salesforce organization first.
                      </p>
                      <div className="flex items-center justify-center">
                        <Button className="flex items-center" asChild>
                          <a href="/">
                            <div className="mr-2">+</div> Connect Salesforce Org
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : !objectMetadata ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                      <h3 className="text-xl font-medium text-neutral-700 mb-3">No Metadata Available</h3>
                      <p className="text-neutral-600 mb-6">
                        We couldn't find any object metadata for this organization. This may happen if the sync process hasn't completed or if there was an issue retrieving the metadata.
                      </p>
                      <Button
                        onClick={() => apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {})}
                        className="flex items-center"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync Metadata
                      </Button>
                    </div>
                  </div>
                ) : useEnhancedVisualizer ? (
                  <EnhancedSchemaVisualizer metadata={objectMetadata} />
                ) : (
                  <ModelVisualizer metadata={objectMetadata} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Objects List</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : !activeOrg ? (
                  <div className="h-64 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">Connect a Salesforce Org</h3>
                      <p className="text-neutral-600 mb-4">
                        To view Salesforce objects, connect an organization first.
                      </p>
                    </div>
                  </div>
                ) : !objectMetadata ? (
                  <div className="h-64 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">No Metadata Available</h3>
                      <p className="text-neutral-600 mb-4">
                        Sync the organization metadata to see objects.
                      </p>
                      <Button
                        onClick={() => apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {})}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync Metadata
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
                          <th className="px-6 py-3">Fields</th>
                          <th className="px-6 py-3">Relationships</th>
                        </tr>
                      </thead>
                      <tbody>
                        {objectMetadata.objects.map((obj) => (
                          <tr key={obj.name} className="border-b hover:bg-neutral-50">
                            <td className="px-6 py-4 font-medium">{obj.name}</td>
                            <td className="px-6 py-4">{obj.label}</td>
                            <td className="px-6 py-4">{obj.fields?.length || 0}</td>
                            <td className="px-6 py-4">{obj.relationships?.length || 0}</td>
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
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : !activeOrg ? (
                  <div className="h-64 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">Connect a Salesforce Org</h3>
                      <p className="text-neutral-600">
                        To view field details, connect an organization first.
                      </p>
                    </div>
                  </div>
                ) : !objectMetadata ? (
                  <div className="h-64 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">No Metadata Available</h3>
                      <p className="text-neutral-600 mb-4">
                        Sync the organization metadata to see field details.
                      </p>
                      <Button
                        onClick={() => apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {})}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync Metadata
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-neutral-700">Select Object</label>
                      <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option value="">Select an object</option>
                        {objectMetadata.objects.map((obj) => (
                          <option key={obj.name} value={obj.name}>{obj.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-neutral-500">Select an object to view its field details</p>
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
