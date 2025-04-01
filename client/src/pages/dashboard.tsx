import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";
import HealthScoreOverview from "@/components/dashboard/health-score-overview";
import DataModelOverview from "@/components/dashboard/data-model-overview";
import SOQLEditorPreview from "@/components/dashboard/soql-editor-preview";
import SecurityAnalyzerPreview from "@/components/dashboard/security-analyzer-preview";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
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

  return (
    <div className="flex flex-col h-screen">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Dashboard Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Overview of your Salesforce org's health and metadata
              </p>
            </div>
            
            {/* Health Score Overview */}
            <HealthScoreOverview healthScore={healthScore} isLoading={isHealthScoreLoading} />
            
            {/* Data Model Overview */}
            <DataModelOverview metadata={metadata} isLoading={isMetadataLoading} />
            
            {/* Key Components */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SOQL/SOSL Editor Preview */}
              <SOQLEditorPreview />
              
              {/* Security Analyzer Preview */}
              <SecurityAnalyzerPreview issues={healthScore?.issues} isLoading={isHealthScoreLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
