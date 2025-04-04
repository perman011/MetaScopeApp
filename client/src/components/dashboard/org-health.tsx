import { useOrgContext } from "@/hooks/use-org";
import { useQuery } from "@tanstack/react-query";
import HealthScoreOverview from "@/components/dashboard/health-score-overview";
import ActionableInsights from "@/components/dashboard/actionable-insights";
import ConfigurationRadarChart from "@/components/visualization/configuration-radar-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@shared/schema";

export default function OrgHealth() {
  const { activeOrg } = useOrgContext();

  // Fetch health score for active org
  const { data: healthScore, isLoading: isHealthScoreLoading } = useQuery<HealthScore>({
    queryKey: [`/api/orgs/${activeOrg?.id}/health`],
    enabled: !!activeOrg,
  });

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <HealthScoreOverview healthScore={healthScore || undefined} isLoading={isHealthScoreLoading} />
      
      {/* Actionable Insights */}
      {activeOrg && (
        <ActionableInsights orgId={activeOrg.id} />
      )}
      
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
      
      {!activeOrg && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No Salesforce Org Connected</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Connect a Salesforce org to view health analytics.
            </p>
            <Button>Connect Salesforce Org</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}