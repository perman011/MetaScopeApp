import { useOrgContext } from "@/hooks/use-org";
import { useQuery } from "@tanstack/react-query";
import HealthScoreOverview from "@/components/dashboard/health-score-overview";
import ActionableInsightsCard from "@/components/dashboard/actionable-insights-card";
import OrgHealthCard from "@/components/dashboard/org-health-card";
import IssueDetailsCard from "@/components/dashboard/issue-details-card";
import ConfigurationRadarChart from "@/components/visualization/configuration-radar-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScore, HealthScoreIssue } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import ConnectSalesforceOrgDialog from "@/components/connect-salesforce-org-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrgHealth() {
  const { activeOrg } = useOrgContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [openConnectDialog, setOpenConnectDialog] = useState(false);
  const { toast } = useToast();

  // Fetch health score for active org
  const { 
    data: healthScore, 
    isLoading: isHealthScoreLoading,
    refetch: refetchHealthScore
  } = useQuery<HealthScore>({
    queryKey: [`/api/orgs/${activeOrg?.id}/health`],
    enabled: !!activeOrg,
  });

  // Handler for auto-fixing issues
  const handleAutoFix = async (issueId: string) => {
    if (!activeOrg) return;
    
    try {
      toast({
        title: "Attempting to fix issue",
        description: "Please wait while we apply the fix...",
      });
      
      // This would be a real API call in production
      await apiRequest(
        "POST", 
        `/api/orgs/${activeOrg.id}/health/fix-issue`,
        { issueId }
      );
      
      // Refetch health score to show updated data
      await refetchHealthScore();
      
      toast({
        title: "Issue fixed successfully",
        description: "The issue has been resolved in your Salesforce org.",
      });
    } catch (error) {
      console.error("Error fixing issue:", error);
      toast({
        title: "Failed to fix issue",
        description: "An error occurred while trying to fix the issue. Please try again or fix manually.",
        variant: "destructive",
      });
    }
  };

  if (!activeOrg) {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <h3 className="text-xl font-medium mb-2">No Salesforce Org Connected</h3>
            <p className="text-neutral-500 mb-6">
              Connect a Salesforce org to view health analytics and improve your org configuration.
            </p>
            <Button onClick={() => setOpenConnectDialog(true)}>
              Connect Salesforce Org
            </Button>
            {openConnectDialog && (
              <ConnectSalesforceOrgDialog 
                onSuccess={() => setOpenConnectDialog(false)}
              >
                <></>
              </ConnectSalesforceOrgDialog>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues & Recommendations</TabsTrigger>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Health Score Overview */}
          <HealthScoreOverview 
            healthScore={healthScore || undefined} 
            isLoading={isHealthScoreLoading} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Card */}
            <OrgHealthCard 
              healthScore={healthScore} 
              isLoading={isHealthScoreLoading} 
            />
            
            {/* Actionable Insights */}
            <ActionableInsightsCard
              issues={healthScore?.issues as HealthScoreIssue[] | undefined}
              isLoading={isHealthScoreLoading}
              onAutoFix={handleAutoFix}
            />
          </div>
          
          {/* Configuration Radar */}
          {healthScore && (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Configuration Health Radar</h3>
                <div className="h-80">
                  <ConfigurationRadarChart healthScore={healthScore} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="issues">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Issues & Recommendations</h2>
            <p className="text-neutral-600">
              Review and address the following issues to improve your Salesforce org health.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isHealthScoreLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-60 w-full" />
                ))
              ) : healthScore?.issues && (healthScore.issues as HealthScoreIssue[]).length > 0 ? (
                (healthScore.issues as HealthScoreIssue[]).map((issue: HealthScoreIssue) => (
                  <IssueDetailsCard
                    key={issue.id}
                    issue={issue}
                    onAutoFix={handleAutoFix}
                    isFixable={["SEC-003", "SEC-004", "COMP-001", "AUTO-002"].includes(issue.id)}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h3 className="text-lg font-medium text-green-600 mb-2">No Issues Found</h3>
                  <p className="text-neutral-600">
                    Your Salesforce org looks great! We didn't detect any issues that need attention.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="metrics">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Health Metrics</h2>
            <p className="text-neutral-600">
              Detailed metrics about your Salesforce org health and configuration.
            </p>
            
            {isHealthScoreLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : healthScore ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard 
                  title="Complexity Score" 
                  value={healthScore.complexityScore} 
                  description="Overall complexity of your Salesforce configuration"
                  maxValue={100}
                  higherIsBetter={false}
                />
                <MetricCard 
                  title="Performance Risk" 
                  value={healthScore.performanceRisk} 
                  description="Risk of performance issues due to configuration"
                  maxValue={100}
                  higherIsBetter={false}
                />
                <MetricCard 
                  title="Technical Debt" 
                  value={healthScore.technicalDebt} 
                  description="Amount of technical debt in your org"
                  maxValue={100}
                  higherIsBetter={false}
                />
                <MetricCard 
                  title="Metadata Volume" 
                  value={healthScore.metadataVolume} 
                  description="Volume of metadata components in your org"
                  format="count"
                />
                <MetricCard 
                  title="Customization Level" 
                  value={healthScore.customizationLevel} 
                  description="Level of customization in your org"
                  maxValue={100}
                />
                <MetricCard 
                  title="Overall Health" 
                  value={healthScore.overallScore} 
                  description="Overall health score of your Salesforce org"
                  maxValue={100}
                />
              </div>
            ) : (
              <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-600">
                  No health metrics available. Please refresh the page or reconnect your Salesforce org.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for metrics
function MetricCard({ 
  title, 
  value, 
  description, 
  maxValue = 100,
  higherIsBetter = true,
  format = "score"
}: { 
  title: string;
  value: number; 
  description: string;
  maxValue?: number;
  higherIsBetter?: boolean;
  format?: "score" | "count" | "percentage";
}) {
  const getColor = () => {
    if (format === "count") return "text-blue-600";
    
    const percentage = (value / maxValue) * 100;
    
    if (higherIsBetter) {
      if (percentage >= 80) return "text-green-600";
      if (percentage >= 60) return "text-amber-600";
      return "text-red-600";
    } else {
      if (percentage <= 30) return "text-green-600";
      if (percentage <= 60) return "text-amber-600";
      return "text-red-600";
    }
  };
  
  const formatValue = () => {
    if (format === "count") return value.toLocaleString();
    if (format === "percentage") return `${value}%`;
    return `${value}/${maxValue}`;
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
        <div className={`text-2xl font-bold mt-1 ${getColor()}`}>
          {formatValue()}
        </div>
        <p className="text-xs text-neutral-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}