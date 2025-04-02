import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ModelVisualizer from "@/components/data-model/model-visualizer";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

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

  // Filter object metadata from all metadata
  const objectMetadata = metadata?.find((m: any) => m.type === 'CustomObject')?.data as ObjectMetadata | undefined;

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Data Model Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Data Model Analyzer</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Visualize and analyze your Salesforce object model
          </p>
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
                ) : !objectMetadata ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-neutral-500">No object metadata available</p>
                  </div>
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
                ) : !objectMetadata ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-neutral-500">No object metadata available</p>
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
                ) : !objectMetadata ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-neutral-500">No object metadata available</p>
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
