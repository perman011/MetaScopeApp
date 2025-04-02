import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SecurityIssuesList from "@/components/security/security-issues-list";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { HealthScoreIssue } from "@shared/schema"; 

export default function SecurityAnalyzer() {
  const { activeOrg } = useOrgContext();

  // Fetch health score for active org
  const { data: healthScore, isLoading } = useQuery<{ issues: HealthScoreIssue[] }>({
    queryKey: [`/api/orgs/${activeOrg?.id}/health`],
    enabled: !!activeOrg,
  });

  // Analyze org if no health score exists
  useEffect(() => {
    if (activeOrg && !isLoading && !healthScore) {
      const analyzeOrg = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/analyze`);
        } catch (error) {
          console.error("Error analyzing org:", error);
        }
      };
      analyzeOrg();
    }
  }, [activeOrg, healthScore, isLoading]);

  // Filter security issues from all issues
  const securityIssues = healthScore?.issues?.filter(
    (issue: HealthScoreIssue) => issue.category === 'security'
  ) || [];

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Security Analyzer Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Security & Access Analyzer</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Analyze security configurations and identify vulnerabilities
          </p>
        </div>

        <Tabs defaultValue="issues">
          <TabsList className="mb-4">
            <TabsTrigger value="issues">Security Issues</TabsTrigger>
            <TabsTrigger value="profiles">Profiles & Permissions</TabsTrigger>
            <TabsTrigger value="sharing">Sharing Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Security Issues</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : !securityIssues || securityIssues.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-neutral-500">No security issues found</p>
                  </div>
                ) : (
                  <SecurityIssuesList issues={securityIssues} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Profiles & Permission Sets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">Profile analysis will be available in a future update</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sharing">
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Sharing Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">Sharing analysis will be available in a future update</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
