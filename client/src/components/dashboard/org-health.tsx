import { useOrgContext } from "@/hooks/use-org";
import { useQuery } from "@tanstack/react-query";
import SimplifiedOrgHealth from "@/components/dashboard/simplified-org-health";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScore, HealthScoreIssue } from "@shared/schema";
import { useState, useEffect } from "react";
import ConnectSalesforceOrgDialog from "@/components/connect-salesforce-org-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Generate mock health score data for testing
function generateMockHealthScore() {
  // Create mock issues with the correct types
  const mockIssues: HealthScoreIssue[] = [
    {
      id: "SEC-001",
      severity: "critical",
      category: "security",
      title: "Public API endpoints lack proper authentication",
      description: "Several REST API endpoints exposed to external systems do not require proper authentication tokens.",
      impact: "Potential data breach and unauthorized access to sensitive information.",
      recommendation: "Implement OAuth 2.0 token-based authentication for all public API endpoints."
    },
    {
      id: "COMP-001",
      severity: "warning",
      category: "apex",
      title: "Excessive SOQL queries in Apex triggers",
      description: "Multiple Apex triggers contain SOQL queries inside loops, which may hit governor limits.",
      impact: "Performance degradation and potential system failures with large data volumes.",
      recommendation: "Refactor code to perform SOQL queries outside of loops and use collections."
    },
    {
      id: "COMP-002",
      severity: "info",
      category: "dataModel",
      title: "Unused custom fields on standard objects",
      description: "12 custom fields across 5 standard objects have not been accessed in over 6 months.",
      impact: "Increased complexity and maintenance overhead for administrators.",
      recommendation: "Review and consider removing or archiving unused custom fields."
    }
  ];
  
  // Create the mock health score data
  const mockHealthScore = {
    id: 1,
    orgId: 999,
    overallScore: 87,
    securityScore: 92,
    dataModelScore: 85,
    automationScore: 78,
    apexScore: 89,
    uiComponentScore: 91,
    complexityScore: 45,
    performanceRisk: 28,
    technicalDebt: 32,
    metadataVolume: 4250,
    customizationLevel: 76,
    lastAnalyzed: new Date(),
    issues: mockIssues
  };
  
  return mockHealthScore as HealthScore;
}

export default function OrgHealth() {
  const { activeOrg } = useOrgContext();
  const [openConnectDialog, setOpenConnectDialog] = useState(false);
  const [mockData, setMockData] = useState<HealthScore | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const { toast } = useToast();

  // Fetch health score for active org
  const { 
    data: healthScore, 
    isLoading: isHealthScoreLoading,
    refetch: refetchHealthScore
  } = useQuery<HealthScore>({
    queryKey: [`/api/orgs/${activeOrg?.id}/health`],
    enabled: !!activeOrg && !useMockData,
  });

  // Load mock data on component mount if no health score data is available
  useEffect(() => {
    if (!mockData) {
      setMockData(generateMockHealthScore());
    }
  }, [mockData]);

  // Handler for auto-fixing issues
  const handleAutoFix = async (issueId: string) => {
    if (!activeOrg && !useMockData) return;
    
    try {
      toast({
        title: "Attempting to fix issue",
        description: "Please wait while we apply the fix...",
      });
      
      if (useMockData) {
        // Just simulate a delay for mock data
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // We could modify mock data here if needed
        toast({
          title: "Issue fixed successfully",
          description: "The issue has been resolved (mock fix).",
        });
        return;
      }
      
      // Real API call for connected org
      await apiRequest(
        "POST", 
        `/api/orgs/${activeOrg!.id}/health/fix-issue`,
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
      <div className="p-6 text-center space-y-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <h3 className="text-xl font-medium mb-2">No Salesforce Org Connected</h3>
            <p className="text-neutral-500 mb-6">
              Connect a Salesforce org to view health analytics and improve your org configuration.
            </p>
            <div className="flex space-x-4 justify-center">
              <Button onClick={() => setOpenConnectDialog(true)}>
                Connect Salesforce Org
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUseMockData(true)}
              >
                Load Test Data
              </Button>
            </div>
            {openConnectDialog && (
              <ConnectSalesforceOrgDialog 
                onSuccess={() => setOpenConnectDialog(false)}
              >
                <></>
              </ConnectSalesforceOrgDialog>
            )}
          </CardContent>
        </Card>
        
        {useMockData && mockData && (
          <div className="max-w-4xl mx-auto">
            <SimplifiedOrgHealth 
              healthScore={mockData} 
              isLoading={false}
              onIssueClick={(issueId) => {
                toast({
                  title: "Issue Selected",
                  description: `Viewing details for issue ${issueId} (test data)`,
                });
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Display directly the SimplifiedOrgHealth component without tabs */}
      <div className="max-w-4xl mx-auto">
        <SimplifiedOrgHealth 
          healthScore={healthScore} 
          isLoading={isHealthScoreLoading}
          onIssueClick={(issueId) => {
            // Show toast with issue information
            toast({
              title: "Issue Selected",
              description: `Viewing details for issue ${issueId}`,
            });
          }}
        />
      </div>
    </div>
  );
}