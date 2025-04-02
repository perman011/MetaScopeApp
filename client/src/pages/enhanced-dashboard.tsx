import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import ConfigurationMoodRingCard from "@/components/configuration-mood-ring-card";
import DependencyAnalyzerViz from "@/components/visualization/dependency-analyzer-viz";
import WhereIsUsedViz from "@/components/visualization/where-is-used-viz";
import AutomationAnalyticsViz from "@/components/visualization/automation-analytics-viz";
import ConfigurationRadarChart from "@/components/visualization/configuration-radar-chart";

export default function EnhancedDashboard() {
  const { activeOrg } = useOrgContext();

  // Fetch health score for active org
  const { data: healthScore, isLoading: isHealthScoreLoading } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/health`],
    enabled: !!activeOrg,
  });

  // Fetch metadata for active org
  const { data: metadata, isLoading: isMetadataLoading } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg,
  });

  // Analyze org if no health score exists
  useEffect(() => {
    if (activeOrg && !isHealthScoreLoading && !healthScore) {
      const analyzeOrg = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/analyze`);
        } catch (error) {
          console.error("Error analyzing org:", error);
        }
      };
      analyzeOrg();
    }
  }, [activeOrg, healthScore, isHealthScoreLoading]);

  // Sync metadata if none exists
  useEffect(() => {
    if (activeOrg && !isMetadataLoading && (!metadata || metadata.length === 0)) {
      const syncMetadata = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {});
        } catch (error) {
          console.error("Error syncing metadata:", error);
        }
      };
      syncMetadata();
    }
  }, [activeOrg, metadata, isMetadataLoading]);

  // Convert metadata to dependency data format if available
  const dependencyData = {
    nodes: [],
    links: []
  };

  if (metadata && Array.isArray(metadata)) {
    // Simple conversion logic - in a real implementation, we'd have more sophisticated
    // data processing to extract actual dependency relationships
    const metadataTypes = new Set<string>();
    metadata.forEach((item: any) => {
      if (item.type) metadataTypes.add(item.type);
    });

    // Populate nodes
    metadata.slice(0, 10).forEach((item: any, index: number) => {
      dependencyData.nodes.push({
        id: `${index}`,
        name: item.name || `Item ${index}`,
        type: item.type || 'Unknown',
        category: getCategoryForType(item.type || 'Unknown')
      });
    });

    // Add some sample links
    for (let i = 0; i < dependencyData.nodes.length - 1; i++) {
      if (Math.random() > 0.3) { // 70% chance to create a link
        dependencyData.links.push({
          source: `${i}`,
          target: `${i + 1}`,
          type: Math.random() > 0.5 ? 'Parent-Child' : 'Referenced'
        });
      }
    }
  }

  // Helper function to categorize metadata types
  function getCategoryForType(type: string): string {
    if (type.toLowerCase().includes('apex')) return 'Apex';
    if (type.toLowerCase().includes('object')) return 'Standard';
    if (type.toLowerCase().includes('flow') || type.toLowerCase().includes('workflow')) return 'Automation';
    if (type.toLowerCase().includes('component') || type.toLowerCase().includes('page')) return 'UI';
    if (type.toLowerCase().includes('profile') || type.toLowerCase().includes('permission')) return 'Security';
    return 'Custom';
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Overview of your Salesforce org's health and metadata
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled={!activeOrg} onClick={async () => {
              if (!activeOrg) return;
              try {
                await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {});
                await apiRequest("POST", `/api/orgs/${activeOrg.id}/analyze`);
              } catch (error) {
                console.error("Error refreshing data:", error);
              }
            }}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Data
            </Button>
          </div>
        </div>
        
        {!activeOrg ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Salesforce Org Connected</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Connect a Salesforce org to view your dashboard analytics and visualizations.
              </p>
              <Button>Connect Salesforce Org</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main health overview */}
            <div className="mb-6">
              <ConfigurationMoodRingCard 
                healthScore={healthScore} 
                className="w-full"
              />
            </div>
            
            {/* Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* First column */}
              <div className="space-y-6">
                <DependencyAnalyzerViz 
                  loading={isMetadataLoading}
                  data={dependencyData}
                />
              </div>
              
              {/* Second column */}
              <div className="space-y-6">
                <WhereIsUsedViz 
                  componentName={activeOrg?.name || "Current Org"}
                  loading={isMetadataLoading}
                />
                <AutomationAnalyticsViz loading={isMetadataLoading} />
              </div>
              
              {/* Third column */}
              <div className="space-y-6">
                <ConfigurationRadarChart
                  healthScore={healthScore}
                  loading={isHealthScoreLoading}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}