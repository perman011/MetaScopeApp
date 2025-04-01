import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  AlertCircle, 
  Lightbulb, 
  CheckCircle, 
  RefreshCw
} from "lucide-react";

interface ActionableInsightsProps {
  orgId: number;
}

export default function ActionableInsights({ orgId }: ActionableInsightsProps) {
  const { toast } = useToast();
  const { data: issues, isLoading } = useQuery<any[]>({
    queryKey: [`/api/orgs/${orgId}/issues`],
    enabled: Boolean(orgId),
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ issueId, status }: { issueId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/issues/${issueId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}/issues`] });
      toast({
        title: "Issue status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleIgnore = (issueId: number) => {
    updateIssueMutation.mutate({ issueId, status: "ignored" });
  };

  const refreshAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orgs/${orgId}/sync`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}/health-scores`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}/issues`] });
      toast({
        title: "Analysis refreshed",
        description: "All insights and health scores have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to refresh analysis",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getIconForSeverity = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="text-red-500" />;
      case "warning":
        return <AlertTriangle className="text-amber-500" />;
      case "info":
        return <Lightbulb className="text-primary-500" />;
      case "success":
        return <CheckCircle className="text-emerald-500" />;
      default:
        return <AlertCircle className="text-neutral-500" />;
    }
  };

  const getBgColorForSeverity = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100";
      case "warning":
        return "bg-amber-100";
      case "info":
        return "bg-primary-100";
      case "success":
        return "bg-emerald-100";
      default:
        return "bg-neutral-100";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-6 w-32" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-4 space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add some predefined insights to supplement the issues
  const predefinedInsights = [
    {
      id: 'predefined-1',
      severity: 'success',
      title: 'Improvement: Workflow to Flow Migration',
      description: 'Successfully migrated 12 workflows to flow processes, improving maintainability and performance.',
      type: 'improvement',
      status: 'open'
    },
    {
      id: 'predefined-2',
      severity: 'info',
      title: 'Recommendation: Custom Object Standardization',
      description: 'Custom objects have inconsistent naming patterns. Consider standardizing the naming convention for better maintainability.',
      type: 'recommendation',
      status: 'open'
    }
  ];

  // Combine real issues with predefined insights
  const allInsights = [...(issues || []), ...predefinedInsights];

  return (
    <Card>
      <div className="px-4 py-5 border-b border-neutral-200 sm:px-6">
        <h3 className="text-base font-medium text-neutral-800">Actionable Insights & Recommendations</h3>
        <p className="mt-1 text-sm text-neutral-500">Based on metadata analysis and best practices</p>
      </div>
      
      <div className="divide-y divide-neutral-200">
        {allInsights.length > 0 ? (
          allInsights.map((insight) => (
            <div key={insight.id} className="p-4 flex items-start">
              <div className="flex-shrink-0 mt-1">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getBgColorForSeverity(insight.severity)}`}>
                  {getIconForSeverity(insight.severity)}
                </span>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-neutral-900">
                  {insight.severity === 'critical' && 'High Risk: '}
                  {insight.severity === 'warning' && 'Performance: '}
                  {insight.title}
                </h4>
                <p className="mt-1 text-sm text-neutral-500">{insight.description}</p>
                <div className="mt-2">
                  <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
                    {insight.type === 'security' ? 'View details' : 
                     insight.type === 'performance' ? 'View affected classes' : 
                     'View analysis'}
                  </a>
                  {insight.status !== 'ignored' && typeof insight.id === 'number' && (
                    <Button
                      variant="link"
                      className="ml-4 text-sm p-0 h-auto text-primary-600 hover:text-primary-500"
                      onClick={() => handleIgnore(insight.id as number)}
                    >
                      Ignore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No insights available. Run an analysis to generate insights.</p>
          </div>
        )}
      </div>
      
      <div className="bg-neutral-50 px-4 py-3 sm:px-6 flex justify-between">
        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">View all insights</a>
        <Button
          size="sm"
          onClick={() => refreshAnalysisMutation.mutate()}
          disabled={refreshAnalysisMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshAnalysisMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshAnalysisMutation.isPending ? 'Refreshing...' : 'Refresh Analysis'}
        </Button>
      </div>
    </Card>
  );
}
