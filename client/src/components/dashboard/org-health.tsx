import { useOrgContext } from "@/hooks/use-org";
import { useQuery } from "@tanstack/react-query";
import SimplifiedOrgHealth from "@/components/dashboard/simplified-org-health";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScore, HealthScoreIssue } from "@shared/schema";
import { useState } from "react";
import ConnectSalesforceOrgDialog from "@/components/connect-salesforce-org-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrgHealth() {
  const { activeOrg } = useOrgContext();
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