import { useQuery } from "@tanstack/react-query";
import { HealthScore } from "@shared/schema";
import { ArrowUpIcon, ArrowDownIcon, Activity, AlertTriangle, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthScoreDashboardProps {
  orgId: number;
}

export default function HealthScoreDashboard({ orgId }: HealthScoreDashboardProps) {
  const { data: healthScore, isLoading, error } = useQuery<HealthScore>({
    queryKey: [`/api/orgs/${orgId}/health-scores`],
    enabled: Boolean(orgId),
  });

  const { data: issues, isLoading: issuesLoading } = useQuery<any[]>({
    queryKey: [`/api/orgs/${orgId}/issues`],
    enabled: Boolean(orgId),
  });

  // Mock comparison with previous score (in a real app, we'd fetch historical data)
  const getScoreDiff = (score?: number) => {
    if (!score) return 0;
    return Math.floor(Math.random() * 10) - 2; // Random value between -2 and 7
  };

  const scoreDiff = getScoreDiff(healthScore?.overallScore);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="ml-5 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading health score data</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-emerald-100 rounded-md p-3">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Overall Health Score</dt>
                <dd>
                  <div className="flex items-baseline">
                    <div className="text-2xl font-semibold text-neutral-900">
                      {healthScore?.overallScore || "--"}/100
                    </div>
                    {scoreDiff !== 0 && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        scoreDiff > 0 ? "text-emerald-500" : "text-red-500"
                      }`}>
                        {scoreDiff > 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                        <span className="sr-only">{scoreDiff > 0 ? "Increased" : "Decreased"} by</span>
                        {Math.abs(scoreDiff)}
                      </div>
                    )}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-3 flex justify-between">
          <a href="#" className="text-sm text-primary-600 hover:text-primary-500">View details</a>
          <span className="text-sm text-neutral-500">Updated {healthScore?.createdAt ? new Date(healthScore.createdAt).toLocaleDateString() : "recently"}</span>
        </div>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Issues Detected</dt>
                <dd>
                  <div className="flex items-baseline">
                    <div className="text-2xl font-semibold text-neutral-900">
                      {issuesLoading ? "--" : issues?.length || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-emerald-500">
                      <ArrowDownIcon className="h-3 w-3" />
                      <span className="sr-only">Decreased by</span>
                      3
                    </div>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-3 flex justify-between">
          <a href="#" className="text-sm text-primary-600 hover:text-primary-500">View all issues</a>
          <div className="text-sm">
            <span className="text-red-500 font-medium">
              {issuesLoading ? "--" : issues?.filter(i => i.severity === "critical").length || 0}
            </span>
            <span className="text-neutral-500"> critical, </span>
            <span className="text-amber-500 font-medium">
              {issuesLoading ? "--" : issues?.filter(i => i.severity === "warning").length || 0}
            </span>
            <span className="text-neutral-500"> warnings</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <CalendarCheck className="h-5 w-5 text-primary-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Next Release Impact</dt>
                <dd>
                  <div className="flex items-baseline">
                    <div className="text-2xl font-semibold text-neutral-900">Low</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-neutral-500">
                      3 components affected
                    </div>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-3 flex justify-between">
          <a href="#" className="text-sm text-primary-600 hover:text-primary-500">View release details</a>
          <span className="text-sm text-neutral-500">Spring '23</span>
        </div>
      </Card>
    </div>
  );
}
